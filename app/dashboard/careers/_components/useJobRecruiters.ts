"use client";

import { useState } from "react";
import * as dal from "@/lib/dal";
import { extractApiError } from "@/lib/utils";
import type { JobPosting } from "@/types/careers";

interface UseJobRecruitersOptions {
  onSaved: () => void;
  onError: (msg: string) => void;
}

/**
 * Modal state + save handler for the "manage recruiter pool" action.
 *
 * Backend rules (PUT /api/admin/job-postings/{id}/recruiters):
 *  - Admin or HR Admin only.
 *  - user_ids: active recruiters, senior recruiters, or HR admins.
 */
export function useJobRecruiters({
  onSaved,
  onError,
}: UseJobRecruitersOptions) {
  const [job, setJob] = useState<JobPosting | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const open = (target: JobPosting) => {
    setJob(target);
    setSelectedIds(target.assigned_users?.map((person) => person.id) ?? []);
  };

  const close = () => {
    setJob(null);
    setSelectedIds([]);
  };

  const toggle = (userId: string) => {
    setSelectedIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const save = async () => {
    if (!job) return;
    setSaving(true);
    try {
      await dal.replaceJobPostingRecruiters(job.id, { user_ids: selectedIds });
      close();
      onSaved();
    } catch (err) {
      onError(extractApiError(err, "Failed to update recruiter pool."));
    } finally {
      setSaving(false);
    }
  };

  return {
    job,
    selectedIds,
    saving,
    open,
    close,
    toggle,
    save,
  };
}
