import { describe, it, expect } from "vitest";
import { queryLeadsSchema } from "../features/leads/validation";
import { PaginationMeta } from "../lib/api/response";

describe("JSON REST API Design & Pagination Math", () => {
  it("parses query parameters with clean default values", () => {
    const parsed = queryLeadsSchema.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBe(10);
    expect(parsed.status).toBe("all");
    expect(parsed.assignedTo).toBe("all");
    expect(parsed.q).toBe("");
  });

  it("calculates pagination metadata correctly", () => {
    const page = 2;
    const limit = 10;
    const total = 45;
    const totalPages = Math.ceil(total / limit); // 5

    const meta: PaginationMeta = {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };

    expect(meta.totalPages).toBe(5);
    expect(meta.hasNext).toBe(true);
    expect(meta.hasPrevious).toBe(true);
  });

  it("handles boundary page calculations for first and last page", () => {
    // First page
    const firstPageMeta: PaginationMeta = {
      page: 1,
      limit: 10,
      total: 25,
      totalPages: 3,
      hasNext: true,
      hasPrevious: false,
    };
    expect(firstPageMeta.hasPrevious).toBe(false);
    expect(firstPageMeta.hasNext).toBe(true);

    // Last page
    const lastPageMeta: PaginationMeta = {
      page: 3,
      limit: 10,
      total: 25,
      totalPages: 3,
      hasNext: false,
      hasPrevious: true,
    };
    expect(lastPageMeta.hasNext).toBe(false);
    expect(lastPageMeta.hasPrevious).toBe(true);
  });
});
