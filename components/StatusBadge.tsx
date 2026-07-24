import { Badge } from "@/components/ui/badge";
import { LeadStatus } from "@/db/schema";

interface StatusBadgeProps {
  status: LeadStatus;
  className?: string;
}

const statusConfig: Record<
  LeadStatus,
  { label: string; className: string }
> = {
  new: {
    label: "New",
    className: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700",
  },
  contacted: {
    label: "Contacted",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 border-blue-300 dark:border-blue-800",
  },
  qualified: {
    label: "Qualified",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border-amber-300 dark:border-amber-800",
  },
  won: {
    label: "Won",
    className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800",
  },
  lost: {
    label: "Lost",
    className: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 border-rose-300 dark:border-rose-800",
  },
};

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.new;
  return (
    <Badge
      variant="outline"
      className={`font-semibold capitalize px-2.5 py-0.5 text-xs rounded-full shadow-xs ${config.className} ${className}`}
    >
      {config.label}
    </Badge>
  );
}
