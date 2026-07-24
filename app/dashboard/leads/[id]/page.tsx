"use client";

import { useState, use } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/StatusBadge";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import { ReopenDialog } from "@/components/ReopenDialog";
import { LEAD_STATUSES, LeadStatus } from "@/db/schema";
import { formatDistanceToNow, format } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  UserIcon,
  Building01Icon,
  Mail01Icon,
  CallIcon,
  Time01Icon,
  BubbleChatIcon,
} from "@hugeicons/core-free-icons";

// ─── Fetchers / mutators ──────────────────────────────────────────────────────
async function fetchLead(id: string) {
  const res = await fetch(`/api/leads/${id}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Lead not found");
  return data.data;
}

async function fetchCurrentUser() {
  const res = await fetch("/api/auth/me");
  const data = await res.json();
  if (!res.ok) throw new Error("Unauthenticated");
  return data.data.user;
}

async function fetchUsers() {
  const res = await fetch("/api/users");
  const data = await res.json();
  if (!res.ok) throw new Error("Failed to fetch users");
  return data.data as { id: string; name: string; role: string }[];
}

async function patchLead(id: string, patch: Record<string, unknown>) {
  const res = await fetch(`/api/leads/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Update failed");
  return data.data;
}

async function postNote(id: string, body: string) {
  const res = await fetch(`/api/leads/${id}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Failed to add note");
  return data.data;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();

  // Reopen modal state
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [isReopenOpen, setIsReopenOpen] = useState(false);

  // Note form state
  const [noteBody, setNoteBody] = useState("");

  // ── Queries ────────────────────────────────────────────────────────────────
  const {
    data: lead,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["lead", id],
    queryFn: () => fetchLead(id),
  });

  const { data: currentUser } = useQuery({
    queryKey: ["me"],
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60 * 1000,
  });

  const { data: usersList = [] } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
    staleTime: 5 * 60 * 1000,
  });

  // ── Mutations ─────────────────────────────────────────────────────────────
  // Invalidate both the individual lead AND the list so both views refresh
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["lead", id] });
    queryClient.invalidateQueries({ queryKey: ["leads"] });
  };

  const statusMutation = useMutation({
    mutationFn: (newStatus: string) => patchLead(id, { status: newStatus }),
    onSuccess: () => {
      invalidate();
      setIsReopenOpen(false);
      setPendingStatus(null);
    },
  });

  const assigneeMutation = useMutation({
    mutationFn: (newAssigneeId: string) =>
      patchLead(id, { assignedTo: newAssigneeId === "unassigned" ? null : newAssigneeId }),
    onSuccess: invalidate,
  });

  const noteMutation = useMutation({
    mutationFn: (body: string) => postNote(id, body),
    onSuccess: () => {
      setNoteBody("");
      invalidate();
    },
  });

  // ── Permission helpers ────────────────────────────────────────────────────
  const isMember = currentUser?.role === "member";
  const isAssignedToUser = lead?.assignedTo === currentUser?.userId;
  const isUnassigned = !lead?.assignedTo;
  const canEdit = currentUser?.role === "admin" || isAssignedToUser || isUnassigned;

  // ── Status change handler ─────────────────────────────────────────────────
  const handleStatusChangeRequest = (newStatus: string) => {
    if (!lead || newStatus === lead.status) return;
    // Prompt confirmation for terminal-state reopen
    if ((lead.status === "won" || lead.status === "lost") && newStatus === "contacted") {
      setPendingStatus(newStatus);
      setIsReopenOpen(true);
      return;
    }
    statusMutation.mutate(newStatus);
  };

  // ── Loading / Error UI ────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (isError || !lead) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-12 text-center space-y-4">
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg max-w-md mx-auto font-medium text-sm">
          {(error as Error)?.message || "Lead not found"}
        </div>
        <Link href="/dashboard">
          <Button variant="outline" className="gap-2">
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" /> Return to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs">
              <HugeiconsIcon icon={ArrowLeft01Icon} className="size-3.5" /> Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">{lead.name}</h1>
              <StatusBadge status={lead.status as LeadStatus} />
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">Lead ID: {lead.id}</p>
          </div>
        </div>

        {/* Status & Assignee Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Status:</span>
            <Select
              disabled={!canEdit || statusMutation.isPending}
              value={lead.status}
              onValueChange={handleStatusChangeRequest}
            >
              <SelectTrigger className="h-9 w-36 text-xs font-medium capitalize">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                {LEAD_STATUSES.map((st) => (
                  <SelectItem key={st} value={st} className="capitalize">{st}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assignee Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Assignee:</span>
            <Select
              disabled={isMember && !isUnassigned || assigneeMutation.isPending}
              value={lead.assignedTo || "unassigned"}
              onValueChange={(val) => { if (val) assigneeMutation.mutate(val); }}
            >
              <SelectTrigger className="h-9 w-44 text-xs font-medium">
                <SelectValue placeholder="Assign User" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {usersList.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name} {u.id === currentUser?.userId ? "(You)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Inline mutation errors */}
      {(statusMutation.isError || assigneeMutation.isError) && (
        <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-md">
          {(statusMutation.error as Error)?.message || (assigneeMutation.error as Error)?.message}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Notes + Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Notes */}
          <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
            <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                <HugeiconsIcon icon={BubbleChatIcon} className="size-4 text-emerald-600" />
                Lead Notes Thread ({lead.notes?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {canEdit ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (noteBody.trim()) noteMutation.mutate(noteBody);
                  }}
                  className="space-y-3"
                >
                  {noteMutation.isError && (
                    <div className="p-2 text-xs bg-rose-50 text-rose-700 rounded-md">
                      {(noteMutation.error as Error).message}
                    </div>
                  )}
                  <Textarea
                    placeholder="Type an internal note or follow-up update..."
                    value={noteBody}
                    onChange={(e) => setNoteBody(e.target.value)}
                    rows={3}
                    className="text-xs resize-none"
                  />
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={noteMutation.isPending || !noteBody.trim()}
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                    >
                      {noteMutation.isPending ? "Saving..." : "Add Note"}
                    </Button>
                  </div>
                </form>
              ) : (
                <p className="text-xs text-zinc-500 italic">
                  Read-only mode. Notes can only be added by the assigned team member or an admin.
                </p>
              )}

              <div className="space-y-3 pt-2">
                {lead.notes?.length === 0 ? (
                  <p className="text-xs text-zinc-400 italic text-center py-4">No notes added yet.</p>
                ) : (
                  lead.notes?.map((note: any) => (
                    <div
                      key={note.id}
                      className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {note.author?.name}
                        </span>
                        <span className="text-[11px] text-zinc-400">
                          {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                        {note.body}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Activity Log */}
          <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
            <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                <HugeiconsIcon icon={Time01Icon} className="size-4 text-blue-600" /> Audit Activity Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ActivityTimeline activities={lead.activities || []} />
            </CardContent>
          </Card>
        </div>

        {/* Right: Contact Details */}
        <div className="space-y-6">
          <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
            <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <CardTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">Lead Overview</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-xs">
              <div className="space-y-1">
                <span className="text-zinc-400 font-medium flex items-center gap-1.5">
                  <HugeiconsIcon icon={UserIcon} className="size-3.5" /> Full Name
                </span>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">{lead.name}</p>
              </div>
              <div className="space-y-1">
                <span className="text-zinc-400 font-medium flex items-center gap-1.5">
                  <HugeiconsIcon icon={Mail01Icon} className="size-3.5" /> Email Address
                </span>
                <p className="font-mono text-zinc-900 dark:text-zinc-100">{lead.email}</p>
              </div>
              <div className="space-y-1">
                <span className="text-zinc-400 font-medium flex items-center gap-1.5">
                  <HugeiconsIcon icon={CallIcon} className="size-3.5" /> Phone
                </span>
                <p className="text-zinc-900 dark:text-zinc-100">{lead.phone || "—"}</p>
              </div>
              <div className="space-y-1">
                <span className="text-zinc-400 font-medium flex items-center gap-1.5">
                  <HugeiconsIcon icon={Building01Icon} className="size-3.5" /> Company
                </span>
                <p className="text-zinc-900 dark:text-zinc-100">{lead.company || "—"}</p>
              </div>
              <div className="space-y-1 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-400 font-medium">Source:</span>
                <span className="ml-2 capitalize bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded font-mono">
                  {lead.source}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-zinc-400 font-medium">Created:</span>
                <p className="text-zinc-600 dark:text-zinc-400">
                  {format(new Date(lead.createdAt), "PPP 'at' p")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Terminal Reopen Dialog */}
      {pendingStatus && (
        <ReopenDialog
          isOpen={isReopenOpen}
          onClose={() => { setIsReopenOpen(false); setPendingStatus(null); }}
          onConfirm={() => statusMutation.mutate(pendingStatus)}
          currentStatus={lead.status}
          targetStatus={pendingStatus}
          isSubmitting={statusMutation.isPending}
        />
      )}
    </div>
  );
}
