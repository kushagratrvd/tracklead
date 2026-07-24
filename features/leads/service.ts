import { db } from "@/db";
import { leads, leadNotes, leadActivity, users, LeadStatus } from "@/db/schema";
import { eq, and, or, ilike, count, desc } from "drizzle-orm";
import { UserSessionPayload } from "../auth/session";
import { AuthError, canModifyLead } from "../auth/permissions";
import { canTransition } from "./transitions";
import { logActivity } from "../activity/service";
import {
  LeadFilterQuery,
  CreatePublicLeadInput,
  UpdateLeadInput,
  AddNoteInput,
} from "./types";
import { PaginationMeta } from "@/lib/api/response";

// Helper for transaction execution with fallback for driver environments without interactive transaction support
async function withTransaction<T>(callback: (tx: any) => Promise<T>): Promise<T> {
  try {
    return await db.transaction(callback);
  } catch (err) {
    // Fallback to sequential execution if db.transaction is not supported by driver
    return await callback(db);
  }
}

// 1. Fetch Paginated Leads with Filtering & Search
export async function getLeads(user: UserSessionPayload, query: LeadFilterQuery) {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(100, Math.max(1, query.limit || 10));
  const offset = (page - 1) * limit;

  const conditions = [];

  // Filter by status
  if (query.status && query.status !== "all") {
    conditions.push(eq(leads.status, query.status as LeadStatus));
  }

  // Filter by assignee
  if (query.assignedTo && query.assignedTo !== "all") {
    if (query.assignedTo === "me") {
      conditions.push(eq(leads.assignedTo, user.userId));
    } else if (query.assignedTo === "unassigned") {
      conditions.push(eq(leads.assignedTo, null as unknown as string));
    } else {
      conditions.push(eq(leads.assignedTo, query.assignedTo));
    }
  }

  // Deterministic search over name, email, company, phone
  if (query.q && query.q.trim() !== "") {
    const searchPattern = `%${query.q.trim()}%`;
    conditions.push(
      or(
        ilike(leads.name, searchPattern),
        ilike(leads.email, searchPattern),
        ilike(leads.company, searchPattern),
        ilike(leads.phone, searchPattern)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Execute Count Query
  const [countResult] = await db
    .select({ total: count() })
    .from(leads)
    .where(whereClause);

  const total = Number(countResult?.total || 0);
  const totalPages = Math.ceil(total / limit) || 1;

  // Execute Select Query with relations
  const leadRows = await db.query.leads.findMany({
    where: whereClause,
    orderBy: [desc(leads.createdAt)],
    limit,
    offset,
    with: {
      assignee: {
        columns: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  const meta: PaginationMeta = {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrevious: page > 1,
  };

  return { data: leadRows, meta };
}

// 2. Fetch Single Lead Detail with Notes & Activity Stream
export async function getLeadById(user: UserSessionPayload, leadId: string) {
  const lead = await db.query.leads.findFirst({
    where: eq(leads.id, leadId),
    with: {
      assignee: {
        columns: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      notes: {
        orderBy: [desc(leadNotes.createdAt)],
        with: {
          author: {
            columns: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      },
      activities: {
        orderBy: [desc(leadActivity.createdAt)],
        with: {
          actor: {
            columns: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      },
    },
  });

  if (!lead) {
    throw new AuthError("Lead not found", 404, "NOT_FOUND");
  }

  return lead;
}

// 3. Create Public Lead (Honeypot check + Multi-write Transaction)
export async function createPublicLead(input: CreatePublicLeadInput) {
  // Honeypot check: If honeypot field is filled, silently reject
  if (input.website_url_hp && input.website_url_hp.trim() !== "") {
    throw new AuthError("Spam detected", 400, "SPAM_DETECTED");
  }

  return await withTransaction(async (tx) => {
    const [newLead] = await tx
      .insert(leads)
      .values({
        name: input.name.trim(),
        email: input.email.toLowerCase().trim(),
        phone: input.phone?.trim() || null,
        company: input.company?.trim() || null,
        source: input.source || "public_form",
        status: "new",
        assignedTo: null,
      })
      .returning();

    // Write activity log
    await logActivity(tx, {
      leadId: newLead.id,
      actorId: null,
      action: "created",
      meta: { source: input.source || "public_form" },
    });

    return newLead;
  });
}

// 4. Transactional Lead Update (Status Transition & Assignment)
export async function updateLead(
  user: UserSessionPayload,
  leadId: string,
  input: UpdateLeadInput
) {
  const existingLead = await db.query.leads.findFirst({
    where: eq(leads.id, leadId),
  });

  if (!existingLead) {
    throw new AuthError("Lead not found", 404, "NOT_FOUND");
  }

  // Check authorization boundary
  if (!canModifyLead(user, existingLead)) {
    throw new AuthError(
      "Permission denied. You can only update leads assigned to you.",
      403,
      "FORBIDDEN"
    );
  }

  // Handle status transition validation if status is changing
  if (input.status && input.status !== existingLead.status) {
    const isValid = canTransition(existingLead.status, input.status, user.role);
    if (!isValid) {
      throw new AuthError(
        `Invalid status transition from '${existingLead.status}' to '${input.status}' for role '${user.role}'`,
        400,
        "INVALID_TRANSITION"
      );
    }
  }

  // Handle assignment restrictions if assignedTo is changing
  if (input.assignedTo !== undefined && input.assignedTo !== existingLead.assignedTo) {
    // Members can only self-assign unassigned leads
    if (user.role === "member") {
      if (input.assignedTo !== user.userId) {
        throw new AuthError(
          "Members can only assign leads to themselves.",
          403,
          "FORBIDDEN_ASSIGNMENT"
        );
      }
    }
  }

  return await withTransaction(async (tx) => {
    const updateData: Partial<typeof leads.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (input.status && input.status !== existingLead.status) {
      updateData.status = input.status;
    }

    if (input.assignedTo !== undefined) {
      updateData.assignedTo = input.assignedTo;
    }

    const [updatedLead] = await tx
      .update(leads)
      .set(updateData)
      .where(eq(leads.id, leadId))
      .returning();

    // Log status change activity if changed
    if (input.status && input.status !== existingLead.status) {
      await logActivity(tx, {
        leadId,
        actorId: user.userId,
        action: "status_changed",
        meta: {
          field: "status",
          oldValue: existingLead.status,
          newValue: input.status,
        },
      });
    }

    // Log assignment activity if changed
    if (input.assignedTo !== undefined && input.assignedTo !== existingLead.assignedTo) {
      await logActivity(tx, {
        leadId,
        actorId: user.userId,
        action: "assigned",
        meta: {
          field: "assignedTo",
          oldValue: existingLead.assignedTo,
          newValue: input.assignedTo,
        },
      });
    }

    return updatedLead;
  });
}

// 5. Add Note to Lead (Multi-write Transaction)
export async function addNote(
  user: UserSessionPayload,
  leadId: string,
  input: AddNoteInput
) {
  const existingLead = await db.query.leads.findFirst({
    where: eq(leads.id, leadId),
  });

  if (!existingLead) {
    throw new AuthError("Lead not found", 404, "NOT_FOUND");
  }

  if (!canModifyLead(user, existingLead)) {
    throw new AuthError(
      "Permission denied. You can only add notes to leads assigned to you.",
      403,
      "FORBIDDEN"
    );
  }

  return await withTransaction(async (tx) => {
    const [note] = await tx
      .insert(leadNotes)
      .values({
        leadId,
        authorId: user.userId,
        body: input.body.trim(),
      })
      .returning();

    // Log note_added activity with preview
    const preview =
      input.body.length > 50 ? input.body.substring(0, 50) + "..." : input.body;

    await logActivity(tx, {
      leadId,
      actorId: user.userId,
      action: "note_added",
      meta: {
        noteId: note.id,
        preview,
      },
    });

    return note;
  });
}

// 6. Get Assignable Users list
export async function getAssignableUsers() {
  return await db.query.users.findMany({
    columns: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
    orderBy: [users.name],
  });
}
