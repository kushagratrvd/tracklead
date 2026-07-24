"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import {
  ArrowLeft01Icon,
  UserIcon,
  Building01Icon,
  Mail01Icon,
  CallIcon,
  Time01Icon,
  BubbleChatIcon,
  Loading01Icon,
} from "@hugeicons/react";

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [lead, setLead] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Note addition state
  const [noteBody, setNoteBody] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  // Status & Reopen Modal state
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [isReopenOpen, setIsReopenOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Assignee update state
  const [isUpdatingAssignee, setIsUpdatingAssignee] = useState(false);

  const fetchLeadDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch session user
      const userRes = await fetch("/api/auth/me");
      if (userRes.ok) {
        const userData = await userRes.json();
        setCurrentUser(userData.data.user);
      }

      // Fetch users list
      const usersRes = await fetch("/api/users");
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsersList(usersData.data || []);
      }

      // Fetch Lead Detail
      const leadRes = await fetch(`/api/leads/${id}`);
      const leadData = await leadRes.json();

      if (!leadRes.ok) {
        throw new Error(leadData.error?.message || "Lead not found");
      }

      setLead(leadData.data);
    } catch (err: any) {
      setError(err.message || "Failed to load lead details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchLeadDetail();
  }, [fetchLeadDetail]);

  const handleStatusChangeRequest = (newStatus: string) => {
    if (!lead || newStatus === lead.status) return;

    // Check if terminal state reopen (won/lost -> contacted)
    if ((lead.status === "won" || lead.status === "lost") && newStatus === "contacted") {
      setPendingStatus(newStatus);
      setIsReopenOpen(true);
      return;
    }

    // Direct status update
    executeStatusUpdate(newStatus);
  };

  const executeStatusUpdate = async (newStatus: string) => {
    setIsUpdatingStatus(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to update status");
      }

      // Refresh lead details
      await fetchLeadDetail();
    } catch (err: any) {
      setError(err.message || "Status update failed");
    } finally {
      setIsUpdatingStatus(false);
      setIsReopenOpen(false);
      setPendingStatus(null);
    }
  };

  const handleAssigneeChange = async (newAssigneeId: string) => {
    setIsUpdatingAssignee(true);
    setError(null);
    try {
      const assignedToValue = newAssigneeId === "unassigned" ? null : newAssigneeId;

      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedTo: assignedToValue }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to update assignee");
      }

      await fetchLeadDetail();
    } catch (err: any) {
      setError(err.message || "Assignee update failed");
    } finally {
      setIsUpdatingAssignee(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteBody.trim()) return;

    setIsSubmittingNote(true);
    setNoteError(null);

    try {
      const res = await fetch(`/api/leads/${id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: noteBody }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to add note");
      }

      setNoteBody("");
      await fetchLeadDetail();
    } catch (err: any) {
      setNoteError(err.message || "Failed to add note");
    } finally {
      setIsSubmittingNote(false);
    }
  };

  if (loading) {
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

  if (error || !lead) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-12 text-center space-y-4">
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg max-w-md mx-auto font-medium text-sm">
          {error || "Lead not found"}
        </div>
        <Link href="/dashboard">
          <Button variant="outline" className="gap-2">
            <ArrowLeft01Icon size={16} /> Return to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const isMember = currentUser?.role === "member";
  const isAssignedToUser = lead.assignedTo === currentUser?.userId;
  const isUnassigned = !lead.assignedTo;
  const canEdit = currentUser?.role === "admin" || isAssignedToUser || isUnassigned;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs">
              <ArrowLeft01Icon size={14} /> Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
                {lead.name}
              </h1>
              <StatusBadge status={lead.status as LeadStatus} />
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">Lead ID: {lead.id}</p>
          </div>
        </div>

        {/* Status Dropdown & Assignee Selector */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Status:</span>
            <Select
              disabled={!canEdit || isUpdatingStatus}
              value={lead.status}
              onValueChange={handleStatusChangeRequest}
            >
              <SelectTrigger className="h-9 w-36 text-xs font-medium capitalize">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                {LEAD_STATUSES.map((st) => (
                  <SelectItem key={st} value={st} className="capitalize">
                    {st}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assignee Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Assignee:</span>
            <Select
              disabled={isMember && !isUnassigned}
              value={lead.assignedTo || "unassigned"}
              onValueChange={handleAssigneeChange}
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

      {/* Main Grid: Details + Notes / Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Notes Thread & Activity Log */}
        <div className="lg:col-span-2 space-y-6">
          {/* Notes Section */}
          <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
            <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                <BubbleChatIcon size={18} className="text-emerald-600" /> Lead Notes Thread ({lead.notes?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Add Note Form */}
              {canEdit ? (
                <form onSubmit={handleAddNote} className="space-y-3">
                  {noteError && (
                    <div className="p-2 text-xs bg-rose-50 text-rose-700 rounded-md">
                      {noteError}
                    </div>
                  )}
                  <Textarea
                    placeholder="Type a internal note or follow-up update..."
                    value={noteBody}
                    onChange={(e) => setNoteBody(e.target.value)}
                    rows={3}
                    className="text-xs resize-none"
                  />
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={isSubmittingNote || !noteBody.trim()}
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                    >
                      {isSubmittingNote ? "Saving..." : "Add Note"}
                    </Button>
                  </div>
                </form>
              ) : (
                <p className="text-xs text-zinc-500 italic">
                  Read-only mode. Notes can only be added by the assigned team member or an admin.
                </p>
              )}

              {/* Notes List */}
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

          {/* Activity Log Section */}
          <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
            <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                <Time01Icon size={18} className="text-blue-600" /> Audit Activity Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ActivityTimeline activities={lead.activities || []} />
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 col): Lead Contact Details Card */}
        <div className="space-y-6">
          <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
            <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <CardTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Lead Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-xs">
              <div className="space-y-1">
                <span className="text-zinc-400 font-medium flex items-center gap-1.5">
                  <UserIcon size={14} /> Full Name
                </span>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">{lead.name}</p>
              </div>

              <div className="space-y-1">
                <span className="text-zinc-400 font-medium flex items-center gap-1.5">
                  <Mail01Icon size={14} /> Email Address
                </span>
                <p className="font-mono text-zinc-900 dark:text-zinc-100">{lead.email}</p>
              </div>

              <div className="space-y-1">
                <span className="text-zinc-400 font-medium flex items-center gap-1.5">
                  <CallIcon size={14} /> Phone
                </span>
                <p className="text-zinc-900 dark:text-zinc-100">{lead.phone || "—"}</p>
              </div>

              <div className="space-y-1">
                <span className="text-zinc-400 font-medium flex items-center gap-1.5">
                  <Building01Icon size={14} /> Company
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

      {/* Terminal Reopen Confirmation Dialog */}
      {pendingStatus && (
        <ReopenDialog
          isOpen={isReopenOpen}
          onClose={() => {
            setIsReopenOpen(false);
            setPendingStatus(null);
          }}
          onConfirm={() => executeStatusUpdate(pendingStatus)}
          currentStatus={lead.status}
          targetStatus={pendingStatus}
          isSubmitting={isUpdatingStatus}
        />
      )}
    </div>
  );
}
