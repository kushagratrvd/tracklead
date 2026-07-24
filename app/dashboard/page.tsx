"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/StatusBadge";
import { LEAD_STATUSES, LeadStatus } from "@/db/schema";
import { formatDistanceToNow } from "date-fns";
import {
  Search01Icon,
  UserIcon,
  FilterIcon,
  ArrowRight01Icon,
  FolderNotFoundIcon,
} from "@hugeicons/react";

export default function DashboardPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  // Users for assignee filter dropdown
  const [usersList, setUsersList] = useState<any[]>([]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (res.ok) {
        setUsersList(data.data || []);
      }
    } catch {
      // Ignore user list fetch failure
    }
  };

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "10");
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
      if (assigneeFilter && assigneeFilter !== "all") params.set("assignedTo", assigneeFilter);
      if (search.trim()) params.set("q", search.trim());

      const res = await fetch(`/api/leads?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to fetch leads");
      }

      setLeads(data.data || []);
      if (data.meta) setMeta(data.meta);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, assigneeFilter, search]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Title & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Lead Management Pipeline
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Track, assign, and convert sales opportunities across your team
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Total Leads: <span className="font-bold text-zinc-900 dark:text-zinc-100">{meta.total}</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <CardContent className="p-4 flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search01Icon className="absolute left-3 top-2.5 text-zinc-400" size={16} />
            <Input
              placeholder="Search name, email, company..."
              className="pl-9 h-9 text-xs"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-44 flex items-center gap-1.5">
            <FilterIcon size={14} className="text-zinc-400 shrink-0" />
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {LEAD_STATUSES.map((st) => (
                  <SelectItem key={st} value={st} className="capitalize">
                    {st}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assignee Filter */}
          <div className="w-full md:w-48 flex items-center gap-1.5">
            <UserIcon size={14} className="text-zinc-400 shrink-0" />
            <Select
              value={assigneeFilter}
              onValueChange={(val) => {
                setAssigneeFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="All Assignees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignees</SelectItem>
                <SelectItem value="me">Assigned to Me</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {usersList.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reset Filters button if filters applied */}
          {(search || statusFilter !== "all" || assigneeFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-9 text-zinc-500 hover:text-zinc-900 ml-auto"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setAssigneeFilter("all");
                setPage(1);
              }}
            >
              Reset Filters
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Leads Table Card */}
      <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 font-medium text-sm">
            {error}
          </div>
        ) : leads.length === 0 ? (
          <div className="py-16 px-4 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mb-3">
              <FolderNotFoundIcon size={24} />
            </div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              No leads found
            </h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm">
              No lead records match your filter criteria or search query. Try adjusting your search.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-zinc-50 dark:bg-zinc-800/50">
                <TableRow>
                  <TableHead className="w-[220px]">Lead / Contact</TableHead>
                  <TableHead className="w-[180px]">Company</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead className="w-[180px]">Assigned To</TableHead>
                  <TableHead className="w-[120px]">Created</TableHead>
                  <TableHead className="text-right w-[100px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                          {lead.name}
                        </span>
                        <span className="text-xs text-zinc-500 font-mono">
                          {lead.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      {lead.company || "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={lead.status as LeadStatus} />
                    </TableCell>
                    <TableCell>
                      {lead.assignee ? (
                        <div className="flex items-center gap-1.5 text-xs text-zinc-800 dark:text-zinc-200">
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                          <span className="font-medium">{lead.assignee.name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-400 italic">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-zinc-500">
                      {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/leads/${lead.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 text-xs font-semibold gap-1">
                          View <ArrowRight01Icon size={14} />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && leads.length > 0 && (
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 bg-zinc-50/50 dark:bg-zinc-800/20">
            <div>
              Showing Page <strong className="text-zinc-900 dark:text-zinc-100">{meta.page}</strong> of{" "}
              <strong className="text-zinc-900 dark:text-zinc-100">{meta.totalPages}</strong> ({meta.total} total leads)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                disabled={!meta.hasPrevious}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                disabled={!meta.hasNext}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
