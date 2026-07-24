import { describe, it, expect } from "vitest";
import { canTransition } from "../features/leads/transitions";

describe("Status Transition State Machine", () => {
  it("allows standard forward transitions for both member and admin", () => {
    expect(canTransition("new", "contacted", "member")).toBe(true);
    expect(canTransition("contacted", "qualified", "member")).toBe(true);
    expect(canTransition("qualified", "won", "member")).toBe(true);
    expect(canTransition("qualified", "lost", "member")).toBe(true);

    expect(canTransition("new", "contacted", "admin")).toBe(true);
    expect(canTransition("contacted", "qualified", "admin")).toBe(true);
  });

  it("rejects illegal forward skips", () => {
    expect(canTransition("new", "won", "member")).toBe(false);
    expect(canTransition("new", "qualified", "member")).toBe(false);
  });

  it("restricts reopening terminal states (won/lost -> contacted) strictly to admin role", () => {
    // Admin can reopen
    expect(canTransition("won", "contacted", "admin")).toBe(true);
    expect(canTransition("lost", "contacted", "admin")).toBe(true);

    // Member cannot reopen
    expect(canTransition("won", "contacted", "member")).toBe(false);
    expect(canTransition("lost", "contacted", "member")).toBe(false);
  });
});
