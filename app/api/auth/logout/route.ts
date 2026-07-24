import { logoutUser } from "@/features/auth/service";
import { apiSuccess } from "@/lib/api/response";

export async function POST() {
  await logoutUser();
  return apiSuccess({ message: "Logged out successfully" });
}
