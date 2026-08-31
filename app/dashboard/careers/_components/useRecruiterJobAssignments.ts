"use client";

import { useEffect, useMemo, useState } from "react";
import * as dal from "@/lib/dal";
import { extractApiError } from "@/lib/utils";
import type { JobPosting } from "@/types/careers";

function initialAssignedJobIds(
  jobs: JobPosting[],
  recruiterId: string,
): Set<string> {
  return new Set(
    jobs
      .filter((job) =>
        job.assigned_users?.some((person) => person.id === recruiterId),
      )
      .map((job) => job.id),
  );
}

interface UseRecruiterJobAssignmentsOptions {
  recruiterId: string;
  jobs: JobPosting[];
  onSaved: () => void;
  onError: (message: string) => void;
}

export function useRecruiterJobAssignments({
  recruiterId,
  jobs,
  onSaved,
  onError,
}: UseRecruiterJobAssignmentsOptions) {
  const baseline = useMemo(
    () => initialAssignedJobIds(jobs, recruiterId),
    [jobs, recruiterId],
  );
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(baseline);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelectedJobIds(initialAssignedJobIds(jobs, recruiterId));
  }, [jobs, recruiterId]);

  const isDirty = useMemo(() => {
    if (baseline.size !== selectedJobIds.size) return true;
    for (const id of baseline) {
      if (!selectedJobIds.has(id)) return true;
    }
    return false;
  }, [baseline, selectedJobIds]);

  const toggleJob = (jobId: string) => {
    setSelectedJobIds((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId);
      else next.add(jobId);
      return next;
    });
  };

  const reset = () => setSelectedJobIds(new Set(baseline));

  const save = async () => {
    const changedJobs = jobs.filter((job) => {
      const wasAssigned = baseline.has(job.id);
      const isAssigned = selectedJobIds.has(job.id);
      return wasAssigned !== isAssigned;
    });

    if (changedJobs.length === 0) return;

    setSaving(true);
    try {
      for (const job of changedJobs) {
        const currentIds =
          job.assigned_users?.map((person) => person.id) ?? [];
        const shouldAssign = selectedJobIds.has(job.id);
        const nextIds = shouldAssign
          ? [...new Set([...currentIds, recruiterId])]
          : currentIds.filter((id) => id !== recruiterId);

        await dal.replaceJobPostingRecruiters(job.id, { user_ids: nextIds });
      }
      onSaved();
    } catch (err) {
      onError(extractApiError(err, "Failed to update job assignments."));
    } finally {
      setSaving(false);
    }
  };

  return {
    selectedJobIds,
    toggleJob,
    saving,
    isDirty,
    save,
    reset,
  };
}
