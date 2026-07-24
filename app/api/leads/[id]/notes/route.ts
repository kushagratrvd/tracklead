import { NextRequest } from "next/server";
import { requireAuth } from "@/features/auth/permissions";
import { addNote } from "@/features/leads/service";
import { addNoteSchema } from "@/features/leads/validation";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const parsed = addNoteSchema.parse(body);
    const note = await addNote(user, id, parsed);
    return apiSuccess(note, undefined, 201);
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
