"use client";

import { useMemo, useState } from "react";
import { Button } from "@/Components/atoms/Button";
import { Badge } from "@/Components/atoms/Badge";
import { Modal } from "@/Components/organisms/Modal";
import { EmptyState } from "@/Components/organisms/EmptyState";
import type {
  HrDirectoryUser,
  HrRoleSlug,
  JobPosting,
} from "@/types/careers";
import { JOB_POOL_ELIGIBLE_ROLES } from "./jobPayloadHelpers";

interface JobRecruitersModalProps {
  job: JobPosting | null;
  hrUsers: HrDirectoryUser[];
  selectedIds: string[];
  saving: boolean;
  onToggle: (userId: string) => void;
  onClose: () => void;
  onSave: () => void;
}

export function JobRecruitersModal({
  job,
  hrUsers,
  selectedIds,
  saving,
  onToggle,
  onClose,
  onSave,
}: JobRecruitersModalProps) {
  const [search, setSearch] = useState("");

  const eligible = useMemo(() => {
    return hrUsers.filter((person) =>
      JOB_POOL_ELIGIBLE_ROLES.includes(person.role_slug as HrRoleSlug),
    );
  }, [hrUsers]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return eligible;
    return eligible.filter((person) =>
      `${person.first_name} ${person.last_name} ${person.email}`
        .toLowerCase()
        .includes(term),
    );
  }, [eligible, search]);

  if (!job) return null;

  const selectedCount = selectedIds.length;

  return (
    <Modal
      open={!!job}
      onClose={onClose}
      title={`Recruiter pool · ${job.title}`}
      size="2xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={saving}>
            {saving ? "Saving..." : `Save (${selectedCount})`}
          </Button>
        </>
      }
    >
      <p className="text-xs text-muted-foreground">
        Pool members can be active <strong>Recruiter</strong>,{" "}
        <strong>Senior Recruiter</strong>, or <strong>HR Admin</strong> users.
        Applications are round-robin assigned across the selected pool.
      </p>

      <input
        placeholder="Search recruiters by name or email"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-md border border-border-color px-3 py-2 text-sm"
      />

      <div className="max-h-80 overflow-y-auto rounded-md border border-border-color">
        {filtered.length === 0 ? (
          <EmptyState
            message={
              eligible.length === 0
                ? "No active recruiters in the directory yet."
                : "No matching recruiters."
            }
          />
        ) : (
          <ul className="divide-y divide-border-color">
            {filtered.map((person) => {
              const checked = selectedIds.includes(person.id);
              return (
                <li
                  key={person.id}
                  className="flex items-center justify-between gap-3 px-4 py-2"
                >
                  <label className="flex flex-1 cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggle(person.id)}
                      className="h-4 w-4 accent-gi-primary"
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {person.first_name} {person.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {person.email}
                      </p>
                    </div>
                  </label>
                  <Badge tone="neutral">
                    {person.role_name || person.role_slug}
                  </Badge>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Modal>
  );
}
