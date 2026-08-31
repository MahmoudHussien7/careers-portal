"use client";

import { useMemo } from "react";
import type { HrApplication } from "@/types/careers";

interface ApplicationsByJobOptions {
  applications: HrApplication[];
  myApplications: HrApplication[];
  canViewTeamApplications: boolean;
}

/**
 * Groups applications by `job_id` for the jobs table expand rows.
 * Team-scoped users see the full applications list; recruiters only see
 * their own assigned applications from `myApplications`.
 */
export function useApplicationsByJob({
  applications,
  myApplications,
  canViewTeamApplications,
}: ApplicationsByJobOptions) {
  return useMemo(() => {
    const map = new Map<string, HrApplication[]>();
    const source = canViewTeamApplications ? applications : myApplications;

    for (const application of source) {
      const jobId = application.job_id;
      if (!jobId) continue;
      const existing = map.get(jobId) ?? [];
      if (existing.some((item) => item.id === application.id)) continue;
      map.set(jobId, [...existing, application]);
    }

    return map;
  }, [applications, myApplications, canViewTeamApplications]);
}

export function getApplicationsForJob(
  map: Map<string, HrApplication[]>,
  jobId: string,
): HrApplication[] {
  return map.get(jobId) ?? [];
}
