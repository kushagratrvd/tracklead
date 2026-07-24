import { getSession, UserSessionPayload } from "./session";
import { UserRole } from "@/db/schema";

export class AuthError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 401, code = "UNAUTHORIZED") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export async function requireAuth(): Promise<UserSessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new AuthError("Authentication required. Please log in.", 401, "UNAUTHENTICATED");
  }
  return session;
}

export async function requireRole(allowedRoles: UserRole[]): Promise<UserSessionPayload> {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.role)) {
    throw new AuthError(
      `Permission denied. Required role: ${allowedRoles.join(" or ")}. Your role: ${session.role}`,
      403,
      "FORBIDDEN"
    );
  }
  return session;
}

export function canAccessLead(
  user: UserSessionPayload,
  lead: { assignedTo: string | null }
): boolean {
  // Admin can access all leads
  if (user.role === "admin") return true;
  // Members can view all leads (read-only) or view assigned leads
  return true;
}

export function canModifyLead(
  user: UserSessionPayload,
  lead: { assignedTo: string | null }
): boolean {
  // Admin can modify all leads
  if (user.role === "admin") return true;
  // Member can modify assigned leads or self-assign unassigned leads
  if (user.role === "member") {
    if (!lead.assignedTo || lead.assignedTo === user.userId) {
      return true;
    }
  }
  return false;
}
