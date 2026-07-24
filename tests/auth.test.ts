import { describe, it, expect } from "vitest";
import { canModifyLead } from "../features/auth/permissions";
import { UserSessionPayload } from "../features/auth/session";

describe("Authorization and Permission Guards", () => {
  const adminUser: UserSessionPayload = {
    userId: "admin-uuid-1",
    name: "Admin User",
    email: "admin@test.com",
    role: "admin",
  };

  const memberUser1: UserSessionPayload = {
    userId: "member-uuid-1",
    name: "Member One",
    email: "member1@test.com",
    role: "member",
  };

  const memberUser2: UserSessionPayload = {
    userId: "member-uuid-2",
    name: "Member Two",
    email: "member2@test.com",
    role: "member",
  };

  it("allows admin to modify any lead", () => {
    const leadAssignedToMember = { assignedTo: memberUser1.userId };
    expect(canModifyLead(adminUser, leadAssignedToMember)).toBe(true);
  });

  it("allows member to modify leads assigned to them", () => {
    const leadAssignedToMember1 = { assignedTo: memberUser1.userId };
    expect(canModifyLead(memberUser1, leadAssignedToMember1)).toBe(true);
  });

  it("allows member to self-assign unassigned leads", () => {
    const unassignedLead = { assignedTo: null };
    expect(canModifyLead(memberUser1, unassignedLead)).toBe(true);
  });

  it("denies member from modifying another member's assigned lead", () => {
    const leadAssignedToMember2 = { assignedTo: memberUser2.userId };
    expect(canModifyLead(memberUser1, leadAssignedToMember2)).toBe(false);
  });
});
