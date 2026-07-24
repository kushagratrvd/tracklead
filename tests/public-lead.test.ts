import { describe, it, expect } from "vitest";
import { publicLeadSchema } from "../features/leads/validation";
import { checkRateLimit } from "../lib/api/rate-limit";
import { NextRequest } from "next/server";

describe("Public Lead Capture & Anti-Abuse Controls", () => {
  it("validates valid public lead inputs", () => {
    const validPayload = {
      name: "Jane Doe",
      email: "jane@company.com",
      phone: "+1 (555) 123-4567",
      company: "Innovate LLC",
    };
    const parsed = publicLeadSchema.parse(validPayload);
    expect(parsed.name).toBe("Jane Doe");
    expect(parsed.email).toBe("jane@company.com");
  });

  it("fails validation when required email is invalid", () => {
    const invalidPayload = {
      name: "Jane Doe",
      email: "not-an-email",
    };
    expect(() => publicLeadSchema.parse(invalidPayload)).toThrow();
  });

  it("triggers rate limit error (HTTP 429) after threshold exceeded", () => {
    const limit = 3;
    const windowMs = 60 * 1000;

    // Simulate 3 requests from same IP
    for (let i = 0; i < limit; i++) {
      const mockReq = new NextRequest("http://localhost:3000/api/public/leads", {
        headers: { "x-forwarded-for": "192.168.1.100" },
      });
      const result = checkRateLimit(mockReq, limit, windowMs);
      expect(result).toBeNull();
    }

    // 4th request from same IP should trigger 429
    const blockedReq = new NextRequest("http://localhost:3000/api/public/leads", {
      headers: { "x-forwarded-for": "192.168.1.100" },
    });
    const blockedResult = checkRateLimit(blockedReq, limit, windowMs);

    expect(blockedResult).not.toBeNull();
    expect(blockedResult?.status).toBe(429);
  });
});
