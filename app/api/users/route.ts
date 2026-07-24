import { requireAuth } from "@/features/auth/permissions";
import { getAssignableUsers } from "@/features/leads/service";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function GET() {
  try {
    await requireAuth();
    const team = await getAssignableUsers();
    return apiSuccess(team);
  } catch (error: any) {
    if (error.statusCode) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return apiError("Internal server error", "INTERNAL_SERVER_ERROR", 500);
  }
}
