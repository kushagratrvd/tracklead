import { db } from "@/db";
import { leadActivity, ActivityAction } from "@/db/schema";

export type ActivityMeta = Record<string, unknown>;

export interface LogActivityParams {
  leadId: string;
  actorId?: string | null;
  action: ActivityAction;
  meta?: ActivityMeta;
}

// Accepts any Drizzle transaction or default db instance
export async function logActivity(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db,
  params: LogActivityParams
) {
  const { leadId, actorId = null, action, meta = {} } = params;

  const [inserted] = await tx
    .insert(leadActivity)
    .values({
      leadId,
      actorId,
      action,
      meta,
    })
    .returning();

  return inserted;
}
