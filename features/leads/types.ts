import { LeadStatus, UserRole, ActivityAction } from "@/db/schema";
import { ActivityMeta } from "../activity/service";

export type { LeadStatus, UserRole, ActivityAction, ActivityMeta };

export interface LeadFilterQuery {
  page?: number;
  limit?: number;
  status?: LeadStatus | "all";
  assignedTo?: string; // "me" | "unassigned" | userId | "all"
  q?: string; // Search across name, email, company, phone
}

export interface CreatePublicLeadInput {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  source?: string;
  website_url_hp?: string; // Honeypot field
}

export interface UpdateLeadInput {
  status?: LeadStatus;
  assignedTo?: string | null;
}

export interface AddNoteInput {
  body: string;
}
