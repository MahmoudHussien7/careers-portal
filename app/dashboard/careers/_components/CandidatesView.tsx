"use client";

import { useMemo, useState } from "react";
import {
  ClipboardList,
  Filter,
  Layers,
  Phone,
  RotateCcw,
  Search,
  User,
  UserPlus,
  UserX,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui";
import { Button } from "@/Components/atoms/Button";
import { ErrorBanner } from "@/Components/organisms/ErrorBanner";
import { LoadingSection } from "@/Components/organisms/LoadingSection";
import { EmptyState } from "@/Components/organisms/EmptyState";
import { Pagination } from "@/Components/organisms/Pagination";
import { cn, extractApiError } from "@/lib/utils";
import * as dal from "@/lib/dal";
import type { HrApplication } from "@/types/careers";
import { useCareersStore } from "./CareersDataProvider";
import { ApplicationLookupSelect } from "./ApplicationLookupSelect";
import {
  applicationAssigneeLabel,
  applicationPhaseLabel,
  applicationStatusLabel,
  phaseIdFromSlug,
  phaseSlugFromId,
  pipelinePhaseItems,
  pipelineStatusFilterItems,
  statusesForApplication,
} from "./applicationHelpers";
import { candidateFullName, candidateInitials } from "./candidateHelpers";
import {
  applicationStatusBadgeClasses,
  candidateRowAccent,
  personInitials,
  pipelineProgressBarClass,
  pipelineProgressPercent,
  pipelineStageDisplayLabel,
} from "./candidateViewHelpers";
import { STAGE_LABEL, STAGE_ORDER, phaseStage } from "./pipeline";

const ALL = "__all__";
const DEFAULT_APPLICATION_FILTERS = { limit: 25 } as const;
const PAGE_SIZE = 10;

function FilterLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </label>
  );
}

export function CandidatesView() {
  const { careers, candidate, createApplication } = useCareersStore();
  const [search, setSearch] = useState(careers.applicationFilters.search ?? "");
  const [stageFilter, setStageFilter] = useState<string>(ALL);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const pipeline = careers.applicationPipeline;
  const phaseItems = useMemo(() => pipelinePhaseItems(pipeline), [pipeline]);

  const phaseFilterId =
    phaseIdFromSlug(pipeline, careers.applicationFilters.pipeline_phase) ?? ALL;

  const statusFilterId = careers.applicationFilters.status_id ?? ALL;

  const filterStatusItems = useMemo(
    () =>
      pipelineStatusFilterItems(
        pipeline,
        phaseFilterId !== ALL ? { id: phaseFilterId } : undefined,
      ),
    [pipeline, phaseFilterId],
  );

  const jobFilterOptions = useMemo(() => {
    const byId = new Map<string, (typeof careers.jobs)[number]>();
    for (const job of [...careers.jobs, ...careers.myJobs]) {
      byId.set(job.id, job);
    }
    return Array.from(byId.values());
  }, [careers.jobs, careers.myJobs]);

  const visibleApplications = useMemo(() => {
    const base = careers.permissions.canViewTeamApplications
      ? careers.applications
      : careers.myApplications;
    return base.filter((application) => {
      if (stageFilter === ALL) return true;
      return phaseStage(application.pipeline_phase) === stageFilter;
    });
  }, [
    careers.applications,
    careers.myApplications,
    careers.permissions.canViewTeamApplications,
    stageFilter,
  ]);

  const total = visibleApplications.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const pagedApplications = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return visibleApplications.slice(start, start + PAGE_SIZE);
  }, [visibleApplications, safePage]);

  const rangeStart = total === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * PAGE_SIZE, total);

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(1);
    careers.setApplicationFilters((prev) => ({
      ...prev,
      search: search.trim() || undefined,
    }));
  };

  const setPhaseFilter = (phaseId: string) => {
    setPage(1);
    careers.setApplicationFilters((prev) => ({
      ...prev,
      pipeline_phase:
        phaseId === ALL ? undefined : phaseSlugFromId(pipeline, phaseId),
      status_id: undefined,
    }));
  };

  const setStatusFilter = (statusId: string) => {
    setPage(1);
    careers.setApplicationFilters((prev) => ({
      ...prev,
      status_id: statusId === ALL ? undefined : statusId,
    }));
  };

  const hasActiveFilters = useMemo(() => {
    const filters = careers.applicationFilters;
    return (
      stageFilter !== ALL ||
      search.trim() !== "" ||
      !!filters.search ||
      !!filters.job_id ||
      !!filters.pipeline_phase ||
      !!filters.status_id
    );
  }, [careers.applicationFilters, search, stageFilter]);

  const resetFilters = () => {
    setSearch("");
    setStageFilter(ALL);
    setPage(1);
    careers.setApplicationFilters({ ...DEFAULT_APPLICATION_FILTERS });
  };

  const handleStatusChange = async (
    applicationId: string,
    statusId: string,
  ) => {
    if (!statusId) return;

    setUpdatingStatusId(applicationId);
    try {
      await dal.updateAdminHrApplication(
        applicationId,
        { status_id: statusId },
        { pipeline },
      );
      await Promise.all([careers.loadApplications(), careers.loadMyWork()]);
    } catch (err) {
      careers.setError(
        extractApiError(err, "Failed to update application status."),
      );
    } finally {
      setUpdatingStatusId(null);
    }
  };

  if (careers.loading) return <LoadingSection />;

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      <ErrorBanner
        message={careers.error}
        onDismiss={() => careers.setError(null)}
      />

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gi-primary md:text-3xl">
            Candidates
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage applications across all active job postings
          </p>
          {total > 0 && (
            <span className="mt-2 inline-block rounded bg-gi-secondary/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-gi-secondary">
              {total} candidate{total === 1 ? "" : "s"}
            </span>
          )}
        </div>
        {careers.permissions.canCreateApplications && (
          <Button onClick={createApplication.openCreate}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add candidate
          </Button>
        )}
      </div>

      <form
        onSubmit={submitSearch}
        className="rounded-lg border border-border-color bg-card-background p-4 shadow-sm"
      >
        <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <FilterLabel>Search</FilterLabel>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name or email…"
                className="w-full rounded-lg border border-border-color py-2 pl-10 pr-3 text-sm focus:border-gi-primary focus:outline-none focus:ring-2 focus:ring-gi-primary/20"
              />
            </div>
          </div>

          <div>
            <FilterLabel>Job posting</FilterLabel>
            <Select
              value={careers.applicationFilters.job_id ?? ALL}
              onValueChange={(value) => {
                setPage(1);
                careers.setApplicationFilters((prev) => ({
                  ...prev,
                  job_id: value === ALL ? undefined : value,
                }));
              }}
            >
              <SelectTrigger className="w-full rounded-lg">
                <SelectValue placeholder="All jobs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All jobs</SelectItem>
                {jobFilterOptions.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <FilterLabel>Pipeline phase</FilterLabel>
            <ApplicationLookupSelect
              items={phaseItems}
              value={phaseFilterId === ALL ? "" : phaseFilterId}
              onChange={(id) => setPhaseFilter(id || ALL)}
              placeholder="All phases"
              emptyLabel="All phases"
              className="w-full"
              size="default"
            />
          </div>

          <div>
            <FilterLabel>Status</FilterLabel>
            <ApplicationLookupSelect
              items={filterStatusItems}
              value={statusFilterId === ALL ? "" : statusFilterId}
              onChange={(id) => setStatusFilter(id || ALL)}
              placeholder="All statuses"
              emptyLabel="All statuses"
              className="w-full"
              size="default"
            />
          </div>

          <div className="flex gap-2">
            <div className="min-w-0 flex-1">
              <FilterLabel>Funnel stage</FilterLabel>
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="w-full rounded-lg">
                  <Filter className="mr-1 h-3.5 w-3.5 shrink-0" />
                  <SelectValue placeholder="All stages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All stages</SelectItem>
                  {STAGE_ORDER.filter((stage) => stage !== "decided").map(
                    (stage) => (
                      <SelectItem key={stage} value={stage}>
                        {STAGE_LABEL[stage]}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col justify-end">
              <button
                type="button"
                onClick={resetFilters}
                disabled={!hasActiveFilters}
                title="Reset filters"
                className="rounded-lg border border-border-color p-2.5 text-muted-foreground transition-colors hover:bg-muted-background disabled:opacity-40"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            type="submit"
            variant="secondary"
            size="sm"
            className="font-semibold"
          >
            Apply filters
          </Button>
        </div>
      </form>

      {visibleApplications.length === 0 ? (
        <EmptyState message="No candidates match the current filters.">
          {hasActiveFilters && (
            <Button variant="outline" onClick={resetFilters}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset filters
            </Button>
          )}
        </EmptyState>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border-color bg-card-background shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border-color bg-muted-background/60">
                  {[
                    "Candidate",
                    "Role",
                    "Status",
                    "Pipeline phase",
                    "Update status",
                    "Assignee",
                    "Actions",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className={cn(
                        "px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground",
                        heading === "Actions" && "text-right",
                      )}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-color">
                {pagedApplications.map((application) => (
                  <CandidateRow
                    key={application.id}
                    application={application}
                    pipeline={pipeline}
                    hrUsers={careers.hrUsers}
                    updatingStatusId={updatingStatusId}
                    onOpen={() => candidate.open(application)}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col items-center justify-between gap-3 border-t border-border-color bg-muted-background/30 px-5 py-3 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              Showing{" "}
              <span className="font-semibold text-gi-primary">
                {rangeStart}–{rangeEnd}
              </span>{" "}
              of <span className="font-semibold text-gi-primary">{total}</span>{" "}
              candidates
            </p>
            {totalPages > 1 && (
              <Pagination
                pagination={{
                  page: safePage,
                  limit: PAGE_SIZE,
                  total,
                  totalPages,
                }}
                onPageChange={setPage}
                className="mt-0 justify-end"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function stageIcon(stage: ReturnType<typeof phaseStage>) {
  switch (stage) {
    case "received":
      return ClipboardList;
    case "filtration":
      return Filter;
    case "screening":
      return Layers;
    case "interview":
      return Phone;
    default:
      return User;
  }
}

function CandidateRow({
  application,
  pipeline,
  hrUsers,
  updatingStatusId,
  onOpen,
  onStatusChange,
}: {
  application: HrApplication;
  pipeline: Parameters<typeof applicationPhaseLabel>[1];
  hrUsers: Parameters<typeof applicationAssigneeLabel>[1];
  updatingStatusId: string | null;
  onOpen: () => void;
  onStatusChange: (applicationId: string, statusId: string) => void;
}) {
  const currentStatusId = application.status_id ?? "";
  const editableStatuses = statusesForApplication(application, pipeline);
  const statusLabel = applicationStatusLabel(application, pipeline);
  const phaseLabel = applicationPhaseLabel(application, pipeline);
  const stage = phaseStage(application.pipeline_phase);
  const StageIcon = stageIcon(stage);
  const assigneeName = applicationAssigneeLabel(application, hrUsers);
  const progress = pipelineProgressPercent(application.pipeline_phase);

  return (
    <tr className="group relative transition-colors hover:bg-muted-background/50">
      <td className="relative px-5 py-4">
        <div
          className={cn(
            "absolute bottom-0 left-0 top-0 w-1 rounded-r transition-all group-hover:w-1.5",
            candidateRowAccent(application.pipeline_phase),
          )}
          aria-hidden
        />
        <div className="flex items-center gap-3 pl-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border-color bg-gi-primary/10 text-sm font-semibold text-gi-primary">
            {candidateInitials(application) || "?"}
          </div>
          <div className="min-w-0 ">
            <button
              type="button"
              onClick={onOpen}
              className="text-left text-sm font-bold cursor-pointer text-gi-primary hover:underline"
            >
              {candidateFullName(application)}
            </button>
            {application.email && (
              <p className="truncate text-xs text-muted-foreground">
                {application.email}
              </p>
            )}
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <p className="text-sm font-medium text-gi-primary">
          {application.job_title ?? "—"}
        </p>
      </td>

      <td className="px-5 py-4">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
            applicationStatusBadgeClasses(statusLabel),
          )}
        >
          {statusLabel}
        </span>
      </td>

      <td className="px-5 py-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <StageIcon
              className="h-4 w-4 shrink-0 text-gi-primary"
              aria-hidden
            />
            <span className="text-sm font-medium text-foreground">
              {phaseLabel || pipelineStageDisplayLabel(stage)}
            </span>
          </div>
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted-background">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                pipelineProgressBarClass(application.pipeline_phase),
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <ApplicationLookupSelect
          items={editableStatuses}
          value={currentStatusId}
          onChange={(statusId) => {
            if (statusId && statusId !== currentStatusId) {
              void onStatusChange(application.id, statusId);
            }
          }}
          disabled={
            updatingStatusId === application.id || editableStatuses.length === 0
          }
          placeholder="Update status…"
          emptyLabel="No status"
          className="w-full min-w-[140px] max-w-[200px]"
          size="sm"
        />
      </td>

      <td className="px-5 py-4">
        {assigneeName ? (
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gi-secondary/20 text-[10px] font-bold text-gi-secondary">
              {personInitials(assigneeName)}
            </div>
            <span className="text-sm text-foreground">{assigneeName}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted-background">
              <UserX className="h-3.5 w-3.5" aria-hidden />
            </div>
            <span className="text-sm italic">Unassigned</span>
          </div>
        )}
      </td>

      <td className="px-5 py-4 text-right">
        <button
          type="button"
          onClick={onOpen}
          className="rounded px-2 py-1 text-xs font-semibold uppercase tracking-wide text-foreground transition-colors hover:bg-muted-background"
        >
          View details
        </button>
      </td>
    </tr>
  );
}
