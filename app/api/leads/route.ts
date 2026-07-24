import { NextRequest } from "next/server";
import { requireAuth } from "@/features/auth/permissions";
import { getLeads } from "@/features/leads/service";
import { queryLeadsSchema } from "@/features/leads/validation";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = Object.fromEntries(req.nextUrl.searchParams.entries());
    const query = queryLeadsSchema.parse(searchParams);
    const { data, meta } = await getLeads(user, query);
    return apiSuccess(data, meta);
  } catch (error: any) {
    if (error.statusCode) {
      return apiError(error.message, error.code, error.statusCode);
    }
    if (error.name === "ZodError") {
      return apiError("Invalid query parameters", "INVALID_INPUT", 400, error.errors);
    }
    return apiError("Internal server error", "INTERNAL_SERVER_ERROR", 500);
  }
}
