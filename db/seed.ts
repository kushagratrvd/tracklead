import { db } from "./index";
import { users, leads, leadNotes, leadActivity } from "./schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

export async function seedDatabase() {
  console.log("🌱 Seeding TrackLead database...");

  // Password hashes
  const adminPasswordHash = await bcrypt.hash("Admin123!", 10);
  const memberPasswordHash = await bcrypt.hash("Member123!", 10);

  // 1. Upsert Admin User
  let adminUser = await db.query.users.findFirst({
    where: eq(users.email, "admin@digitalheroes.com"),
  });

  if (!adminUser) {
    const [inserted] = await db
      .insert(users)
      .values({
        name: "Sarah Jenkins (Admin)",
        email: "admin@digitalheroes.com",
        passwordHash: adminPasswordHash,
        role: "admin",
      })
      .returning();
    adminUser = inserted;
    console.log("✓ Created admin user: admin@digitalheroes.com");
  }

  // 2. Upsert Member User
  let memberUser = await db.query.users.findFirst({
    where: eq(users.email, "member@digitalheroes.com"),
  });

  if (!memberUser) {
    const [inserted] = await db
      .insert(users)
      .values({
        name: "Alex Rivera (Member)",
        email: "member@digitalheroes.com",
        passwordHash: memberPasswordHash,
        role: "member",
      })
      .returning();
    memberUser = inserted;
    console.log("✓ Created member user: member@digitalheroes.com");
  }

  // 3. Seed Sample Leads if none exist
  const existingLeads = await db.query.leads.findMany({ limit: 1 });
  if (existingLeads.length === 0) {
    // Lead 1: Assigned to Member
    const [lead1] = await db
      .insert(leads)
      .values({
        name: "Acme Corp Lead",
        email: "contact@acme.com",
        phone: "+1 (555) 019-2834",
        company: "Acme Corporation",
        source: "public_form",
        status: "contacted",
        assignedTo: memberUser.id,
      })
      .returning();

    // Lead 1 Activity & Notes
    await db.insert(leadActivity).values([
      {
        leadId: lead1.id,
        actorId: null,
        action: "created",
        meta: { source: "public_form" },
      },
      {
        leadId: lead1.id,
        actorId: adminUser.id,
        action: "assigned",
        meta: { field: "assignedTo", oldValue: null, newValue: memberUser.id },
      },
      {
        leadId: lead1.id,
        actorId: memberUser.id,
        action: "status_changed",
        meta: { field: "status", oldValue: "new", newValue: "contacted" },
      },
    ]);

    await db.insert(leadNotes).values({
      leadId: lead1.id,
      authorId: memberUser.id,
      body: "Initial discovery call completed. Client requested custom enterprise proposal.",
    });

    // Lead 2: Unassigned (New)
    const [lead2] = await db
      .insert(leads)
      .values({
        name: "TechStart Demo Request",
        email: "founders@techstart.io",
        phone: "+1 (555) 482-9102",
        company: "TechStart Labs",
        source: "public_form",
        status: "new",
        assignedTo: null,
      })
      .returning();

    await db.insert(leadActivity).values({
      leadId: lead2.id,
      actorId: null,
      action: "created",
      meta: { source: "public_form" },
    });

    // Lead 3: Qualified Lead assigned to Admin
    const [lead3] = await db
      .insert(leads)
      .values({
        name: "Global Logistics Inc",
        email: "procurement@globallogistics.com",
        phone: "+1 (555) 839-2019",
        company: "Global Logistics",
        source: "manual",
        status: "qualified",
        assignedTo: adminUser.id,
      })
      .returning();

    await db.insert(leadActivity).values([
      {
        leadId: lead3.id,
        actorId: adminUser.id,
        action: "created",
        meta: { source: "manual" },
      },
      {
        leadId: lead3.id,
        actorId: adminUser.id,
        action: "status_changed",
        meta: { field: "status", oldValue: "contacted", newValue: "qualified" },
      },
    ]);

    await db.insert(leadNotes).values({
      leadId: lead3.id,
      authorId: adminUser.id,
      body: "Budget approved for Q3. Security compliance review pending.",
    });

    console.log("✓ Created sample leads, activity logs, and notes.");
  }

  console.log("✨ Seed completed successfully.");
}

// Top-level call — this file is only ever run as a CLI script
seedDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  });

