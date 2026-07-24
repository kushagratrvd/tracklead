import { LeadStatus, UserRole } from "@/db/schema";

// Forward transitions state machine
export const allowedTransitions: Record<LeadStatus, LeadStatus[]> = {
  new: ["contacted", "lost"],
  contacted: ["qualified", "lost"],
  qualified: ["won", "lost"],
  won: [], // Terminal state
  lost: [], // Terminal state
};

// Reopening terminal states map (Admin only)
export const adminReopenTransitions: Record<LeadStatus, LeadStatus[]> = {
  new: [],
  contacted: [],
  qualified: [],
  won: ["contacted"],
  lost: ["contacted"],
};

export function canTransition(
  currentStatus: LeadStatus,
  nextStatus: LeadStatus,
  userRole: UserRole
): boolean {
  if (currentStatus === nextStatus) return true;

  // Check standard forward transitions
  const validForward = allowedTransitions[currentStatus]?.includes(nextStatus);
  if (validForward) return true;

  // Check terminal state reopening (Admin only)
  if (userRole === "admin") {
    const validReopen = adminReopenTransitions[currentStatus]?.includes(nextStatus);
    if (validReopen) return true;
  }

  return false;
}
