import { pgTable, uuid, varchar, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const USER_ROLES = ["admin", "member"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const LEAD_STATUSES = ["new", "contacted", "qualified", "won", "lost"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const ACTIVITY_ACTIONS = [
  "created",
  "status_changed",
  "assigned",
  "note_added",
] as const;
export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];

// 1. Users Table
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    role: varchar("role", { length: 50 }).$type<UserRole>().default("member").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_users_email").on(table.email),
  ]
);

// 2. Leads Table
export const leads = pgTable(
  "leads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 50 }),
    company: varchar("company", { length: 255 }),
    source: varchar("source", { length: 100 }).default("public_form").notNull(),
    status: varchar("status", { length: 50 })
      .$type<LeadStatus>()
      .default("new")
      .notNull(),
    assignedTo: uuid("assigned_to").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_leads_status").on(table.status),
    index("idx_leads_assigned_to").on(table.assignedTo),
    index("idx_leads_email").on(table.email),
    index("idx_leads_created_at").on(table.createdAt),
  ]
);

// 3. Lead Notes Table
export const leadNotes = pgTable(
  "lead_notes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_lead_notes_lead_id").on(table.leadId),
  ]
);

// 4. Lead Activity Table
export const leadActivity = pgTable(
  "lead_activity",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    actorId: uuid("actor_id").references(() => users.id, {
      onDelete: "set null",
    }), // Nullable for public/system submissions
    action: varchar("action", { length: 50 }).$type<ActivityAction>().notNull(),
    meta: jsonb("meta").$type<Record<string, unknown>>().default({}).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_lead_activity_lead_id").on(table.leadId),
    index("idx_lead_activity_created_at").on(table.createdAt),
  ]
);

// Relations Definitions
export const usersRelations = relations(users, ({ many }) => ({
  assignedLeads: many(leads),
  notes: many(leadNotes),
  activities: many(leadActivity),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
  assignee: one(users, {
    fields: [leads.assignedTo],
    references: [users.id],
  }),
  notes: many(leadNotes),
  activities: many(leadActivity),
}));

export const leadNotesRelations = relations(leadNotes, ({ one }) => ({
  lead: one(leads, {
    fields: [leadNotes.leadId],
    references: [leads.id],
  }),
  author: one(users, {
    fields: [leadNotes.authorId],
    references: [users.id],
  }),
}));

export const leadActivityRelations = relations(leadActivity, ({ one }) => ({
  lead: one(leads, {
    fields: [leadActivity.leadId],
    references: [leads.id],
  }),
  actor: one(users, {
    fields: [leadActivity.actorId],
    references: [users.id],
  }),
}));
