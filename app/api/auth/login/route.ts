import { NextRequest } from "next/server";
import { loginUser } from "@/features/auth/service";
import { loginSchema } from "@/features/leads/validation";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.parse(body);
    const session = await loginUser(parsed.email, parsed.password);
    return apiSuccess({ user: session, message: "Logged in successfully" });
  } catch (error: any) {
    if (error.statusCode) {
      return apiError(error.message, error.code, error.statusCode);
    }
    if (error.name === "ZodError") {
      return apiError("Validation error", "INVALID_INPUT", 400, error.errors);
    }
    return apiError("Internal server error", "INTERNAL_SERVER_ERROR", 500);
  }
}
