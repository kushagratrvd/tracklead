import { getSession } from "@/features/auth/session";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return apiError("Unauthenticated", "UNAUTHENTICATED", 401);
  }
  return apiSuccess({ user: session });
}
