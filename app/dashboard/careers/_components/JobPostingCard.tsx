"use client";

import type { ReactNode } from "react";
import {
  Building2,
  ChevronDown,
  Eye,
  MapPin,
  MoreVertical,
  Pencil,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/Components/ui";
import { cn } from "@/lib/utils";
import type { JobPosting } from "@/types/careers";
import {
  jobStatusAccent,
  jobStatusBadgeClasses,
} from "./jobPostingHelpers";

interface JobPostingCardProps {
  job: JobPosting;
  candidateCount: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onView: () => void;
  onEdit?: () => void;
  onManageRecruiters?: () => void;
  onDelete?: () => void;
  canManageRecruiters?: boolean;
  readOnly?: boolean;
  expandedContent?: ReactNode;
}

export function JobPostingCard({
  job,
  candidateCount,
  isExpanded,
  onToggleExpand,
  onView,
  onEdit,
  onManageRecruiters,
  onDelete,
  canManageRecruiters = false,
  readOnly = false,
  expandedContent,
}: JobPostingCardProps) {
  const recruiterCount = job.assigned_users?.length ?? 0;
  const hasCandidates = candidateCount > 0;
  const statusName = job.status?.name ?? "Unknown";

  return (
    <article
      className={cn(
        "overflow-hidden rounded-lg border border-border-color bg-card-background transition-all duration-300",
        "hover:border-gi-primary/30 hover:shadow-lg",
        isExpanded && "border-gi-primary/25 shadow-md",
      )}
    >
      <div className="relative flex items-stretch">
        <div
          className={cn("w-1.5 shrink-0", jobStatusAccent(statusName))}
          aria-hidden
        />

        <div className="min-w-0 flex-1 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={onView}
                  className="text-left text-lg font-semibold text-gi-primary hover:underline"
                >
                  {job.title}
                </button>
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider",
                    jobStatusBadgeClasses(statusName),
                  )}
                >
                  {statusName}
                </span>
              </div>

              {job.slug && (
                <p className="mb-4 text-sm text-muted-foreground">{job.slug}</p>
              )}

              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                  {job.location || "—"}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Building2 className="h-4 w-4 shrink-0" aria-hidden />
                  {job.department?.name || "—"}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Users
                    className={cn(
                      "h-4 w-4 shrink-0",
                      hasCandidates && "fill-gi-primary/20 text-gi-primary",
                    )}
                    aria-hidden
                  />
                  <span
                    className={cn(
                      hasCandidates && "font-semibold text-gi-primary",
                    )}
                  >
                    {candidateCount} Candidate{candidateCount === 1 ? "" : "s"}
                  </span>
                </span>
                <span className="inline-flex items-center gap-2">
                  <UserCheck className="h-4 w-4 shrink-0" aria-hidden />
                  {recruiterCount} Recruiter{recruiterCount === 1 ? "" : "s"}
                </span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={hasCandidates ? onToggleExpand : undefined}
                disabled={!hasCandidates}
                aria-expanded={isExpanded}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-all",
                  hasCandidates
                    ? "border-border-color text-foreground hover:bg-muted-background"
                    : "cursor-not-allowed border-border-color bg-muted-background text-muted-foreground",
                )}
              >
                {hasCandidates ? "View candidates" : "No candidates"}
                {hasCandidates && (
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform duration-300",
                      isExpanded && "rotate-180",
                    )}
                  />
                )}
              </button>

              {!readOnly ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label={`Actions for ${job.title}`}
                      className="rounded-lg border border-border-color p-2 text-muted-foreground transition-colors hover:bg-muted-background hover:text-foreground"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>{job.title}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={onView}>
                      <Eye className="mr-2 h-4 w-4" />
                      View details
                    </DropdownMenuItem>
                    {onEdit && (
                      <DropdownMenuItem onSelect={onEdit}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit posting
                      </DropdownMenuItem>
                    )}
                    {canManageRecruiters && onManageRecruiters && (
                      <DropdownMenuItem onSelect={onManageRecruiters}>
                        <Users className="mr-2 h-4 w-4" />
                        Manage recruiters
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={onDelete}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <button
                  type="button"
                  onClick={onView}
                  className="rounded-lg border border-border-color p-2 text-muted-foreground transition-colors hover:bg-muted-background hover:text-gi-primary"
                  aria-label={`View ${job.title}`}
                >
                  <Eye className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "grid transition-all duration-300 ease-out",
          isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t border-border-color bg-muted-background/30 p-5">
            {expandedContent}
          </div>
        </div>
      </div>
    </article>
  );
}
