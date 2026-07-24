import { NextRequest } from "next/server";
import { createPublicLead } from "@/features/leads/service";
import { publicLeadSchema } from "@/features/leads/validation";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function POST(req: NextRequest) {
  // Check sliding-window IP rate limit
  const rateLimitError = checkRateLimit(req);
  if (rateLimitError) return rateLimitError;

  try {
    const body = await req.json();
    const parsed = publicLeadSchema.parse(body);
    const lead = await createPublicLead(parsed);
    return apiSuccess({ lead, message: "Lead submitted successfully" }, undefined, 201);
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
