import { NextRequest } from "next/server";
import { requireAuth } from "@/features/auth/permissions";
import { getLeadById, updateLead } from "@/features/leads/service";
import { updateLeadSchema } from "@/features/leads/validation";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const lead = await getLeadById(user, id);
    return apiSuccess(lead);
  } catch (error: any) {
    if (error.statusCode) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return apiError("Internal server error", "INTERNAL_SERVER_ERROR", 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const parsed = updateLeadSchema.parse(body);
    const updatedLead = await updateLead(user, id, parsed);
    return apiSuccess(updatedLead);
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
