import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface ActivityItem {
  id: string;
  action: "created" | "status_changed" | "assigned" | "note_added" | string;
  actor?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  meta: Record<string, any>;
  createdAt: string | Date;
}

interface ActivityTimelineProps {
  activities: ActivityItem[];
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  if (!activities || activities.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400 border border-dashed rounded-lg">
        No activity recorded yet.
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-800">
      {activities.map((activity) => {
        const actorName = activity.actor ? activity.actor.name : "Public Lead Form / System";
        const dateStr = formatDistanceToNow(new Date(activity.createdAt), {
          addSuffix: true,
        });

        return (
          <div key={activity.id} className="relative group">
            {/* Dot Marker */}
            <div className="absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-white dark:border-zinc-950 bg-zinc-900 dark:bg-zinc-100 shadow-xs" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {actorName}
                </span>
                <Badge variant="secondary" className="capitalize text-[10px] px-1.5 py-0">
                  {activity.action.replace("_", " ")}
                </Badge>
              </div>
              <span className="text-zinc-500 text-[11px]">{dateStr}</span>
            </div>

            {/* Render Metadata Details */}
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              {activity.action === "created" && (
                <p>Created lead submission via <span className="font-medium">{activity.meta?.source || "web form"}</span></p>
              )}

              {activity.action === "status_changed" && (
                <p>
                  Changed status from{" "}
                  <span className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded capitalize font-medium">
                    {activity.meta?.oldValue || "unknown"}
                  </span>{" "}
                  to{" "}
                  <span className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded capitalize font-medium">
                    {activity.meta?.newValue}
                  </span>
                </p>
              )}

              {activity.action === "assigned" && (
                <p>
                  Updated assignee (
                  <span className="font-medium">
                    {activity.meta?.newValue ? "Assigned" : "Unassigned"}
                  </span>
                  )
                </p>
              )}

              {activity.action === "note_added" && (
                <div className="bg-zinc-50 dark:bg-zinc-900 p-2.5 rounded-md border border-zinc-200 dark:border-zinc-800 mt-1 italic text-xs text-zinc-700 dark:text-zinc-300">
                  &ldquo;{activity.meta?.preview || "Added a note"}&rdquo;
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
