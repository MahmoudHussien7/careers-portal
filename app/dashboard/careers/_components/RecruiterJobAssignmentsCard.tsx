"use client";

import { useMemo, useState } from "react";
import { Briefcase, Search } from "lucide-react";
import { Badge } from "@/Components/ui";
import { Button } from "@/Components/atoms/Button";
import { EmptyState } from "@/Components/organisms/EmptyState";
import type { JobPosting } from "@/types/careers";
import { useRecruiterJobAssignments } from "./useRecruiterJobAssignments";

interface RecruiterJobAssignmentsCardProps {
  recruiterId: string;
  recruiterName: string;
  jobs: JobPosting[];
  onSaved: () => void;
  onError: (message: string) => void;
}

export function RecruiterJobAssignmentsCard({
  recruiterId,
  recruiterName,
  jobs,
  onSaved,
  onError,
}: RecruiterJobAssignmentsCardProps) {
  const [search, setSearch] = useState("");
  const assignments = useRecruiterJobAssignments({
    recruiterId,
    jobs,
    onSaved,
    onError,
  });

  const filteredJobs = useMemo(() => {
    const term = search.trim().toLowerCase();
    const sorted = [...jobs].sort((a, b) => a.title.localeCompare(b.title));
    if (!term) return sorted;
    return sorted.filter(
      (job) =>
        job.title.toLowerCase().includes(term) ||
        job.slug.toLowerCase().includes(term) ||
        job.location?.toLowerCase().includes(term),
    );
  }, [jobs, search]);

  const assignedCount = assignments.selectedJobIds.size;

  return (
    <div className="rounded-lg border border-border-color bg-card-background shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-color px-5 py-4">
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-gi-primary" aria-hidden />
          <div>
            <h3 className="text-base font-semibold text-gi-primary">
              Job assignments
            </h3>
            <p className="text-xs text-muted-foreground">
              Add or remove {recruiterName} from job recruiter pools
            </p>
          </div>
        </div>
        <Badge className="border border-gi-primary/20 bg-gi-primary/10 text-gi-primary">
          {assignedCount} assigned
        </Badge>
      </div>

      <div className="space-y-4 p-5">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search jobs by title, slug, or location…"
            className="w-full rounded-lg border border-border-color py-2 pl-10 pr-3 text-sm focus:border-gi-primary focus:outline-none focus:ring-2 focus:ring-gi-primary/20"
          />
        </div>

        <div className="max-h-80 overflow-y-auto rounded-lg border border-border-color">
          {filteredJobs.length === 0 ? (
            <EmptyState
              message={
                jobs.length === 0
                  ? "No job postings available yet."
                  : "No jobs match your search."
              }
            />
          ) : (
            <ul className="divide-y divide-border-color">
              {filteredJobs.map((job) => {
                const checked = assignments.selectedJobIds.has(job.id);
                const poolSize = job.assigned_users?.length ?? 0;

                return (
                  <li
                    key={job.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted-background/40"
                  >
                    <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => assignments.toggleJob(job.id)}
                        className="mt-1 h-4 w-4 accent-gi-primary"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {job.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {job.slug}
                          {job.location ? ` · ${job.location}` : ""}
                        </p>
                      </div>
                    </label>
                    <div className="shrink-0 text-right">
                      {job.status?.name && (
                        <Badge variant="secondary" className="mb-1">
                          {job.status.name}
                        </Badge>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Pool: {poolSize}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Checked jobs include this person in the round-robin recruiter pool.
          Uncheck to remove them from that job&apos;s pool without deleting the
          posting.
        </p>

        <div className="flex flex-wrap justify-end gap-2 border-t border-border-color pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={assignments.reset}
            disabled={!assignments.isDirty || assignments.saving}
          >
            Reset
          </Button>
          <Button
            type="button"
            onClick={() => void assignments.save()}
            disabled={!assignments.isDirty || assignments.saving}
          >
            {assignments.saving ? "Saving…" : "Save job assignments"}
          </Button>
        </div>
      </div>
    </div>
  );
}
