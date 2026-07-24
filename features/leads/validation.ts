import { z } from "zod";
import { LEAD_STATUSES } from "@/db/schema";

export const publicLeadSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  company: z.string().optional(),
  source: z.string().default("public_form"),
  website_url_hp: z.string().optional(), // Honeypot field (must be empty)
});

export const updateLeadSchema = z.object({
  status: z.enum(LEAD_STATUSES).optional(),
  assignedTo: z.string().uuid().nullable().optional(),
});

export const addNoteSchema = z.object({
  body: z.string().min(1, "Note content cannot be empty").max(2000, "Note too long"),
});

export const queryLeadsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  status: z.enum([...LEAD_STATUSES, "all"]).optional().default("all"),
  assignedTo: z.string().optional().default("all"),
  q: z.string().optional().default(""),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
