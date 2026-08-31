"use client";

import { Pencil, Users } from "lucide-react";
import { Button } from "@/Components/atoms/Button";
import { Badge } from "@/Components/atoms/Badge";
import { Modal } from "@/Components/organisms/Modal";
import { DetailField } from "@/Components/organisms/DetailField";
import { LoadingSection } from "@/Components/organisms/LoadingSection";
import type { JobPosting } from "@/types/careers";
import {
  CAREER_SECTION_LABELS,
  parseBulletLines,
  parseRoleOverviewParagraphs,
} from "./careerContentFormat";

interface JobViewModalProps {
  open: boolean;
  loading: boolean;
  job: JobPosting | null;
  canManageJobs: boolean;
  canManageRecruiters: boolean;
  onClose: () => void;
  onEdit: () => void;
  onManageRecruiters: () => void;
}

export function JobViewModal({
  open,
  loading,
  job,
  canManageJobs,
  canManageRecruiters,
  onClose,
  onEdit,
  onManageRecruiters,
}: JobViewModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={job?.title || "Job posting"}
      size="3xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {canManageRecruiters && job && (
            <Button variant="secondary" onClick={onManageRecruiters}>
              <Users className="mr-2 h-4 w-4" />
              Recruiters
            </Button>
          )}
          {canManageJobs && job && (
            <Button onClick={onEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
        </>
      }
    >
      {loading || !job ? (
        <LoadingSection />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {job.status?.name && <Badge>{job.status.name}</Badge>}
            {job.department?.name && (
              <Badge tone="neutral">{job.department.name}</Badge>
            )}
            {job.employment_type?.name && (
              <Badge tone="neutral">{job.employment_type.name}</Badge>
            )}
            {job.team?.name && <Badge tone="neutral">{job.team.name}</Badge>}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <DetailField label="Slug">{job.slug || "—"}</DetailField>
            <DetailField label="Location">{job.location || "—"}</DetailField>
            <DetailField label="Timezone">{job.timezone || "—"}</DetailField>
            <DetailField label="Salary range">
              {job.salary_range || "—"}
            </DetailField>
            <DetailField label="Published">
              {job.published_at
                ? new Date(job.published_at).toLocaleString()
                : "—"}
            </DetailField>
            <DetailField label="Expires">
              {job.expires_at
                ? new Date(job.expires_at).toLocaleString()
                : "—"}
            </DetailField>
          </div>

          {job.description && (
            <DetailField label="Description" asHtml>
              {job.description}
            </DetailField>
          )}
          {job.about_company && (
            <DetailField label="About the company" asHtml>
              {job.about_company}
            </DetailField>
          )}
          {job.role_overview && (
            <RoleOverviewDetail text={job.role_overview} />
          )}
          {job.key_responsibilities && (
            <BulletDetailField
              label={CAREER_SECTION_LABELS.keyResponsibilities}
              text={job.key_responsibilities}
            />
          )}
          {job.candidate_profile && (
            <BulletDetailField
              label={CAREER_SECTION_LABELS.candidateProfile}
              text={job.candidate_profile}
            />
          )}
          {job.what_we_offer && (
            <BulletDetailField
              label={CAREER_SECTION_LABELS.whatWeOffer}
              text={job.what_we_offer}
            />
          )}

          <div className="rounded-md border border-border-color">
            <div className="border-b border-border-color px-4 py-2 text-sm font-medium text-card-foreground">
              Recruiter pool ({job.assigned_users?.length ?? 0})
            </div>
            {!job.assigned_users || job.assigned_users.length === 0 ? (
              <p className="px-4 py-3 text-sm text-muted-foreground">
                No recruiters assigned yet.
              </p>
            ) : (
              <ul className="divide-y divide-border-color">
                {job.assigned_users.map((person) => (
                  <li key={person.id} className="px-4 py-2 text-sm">
                    <p className="font-medium text-foreground">
                      {person.first_name} {person.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {person.email}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

function RoleOverviewDetail({ text }: { text: string }) {
  const paragraphs = parseRoleOverviewParagraphs(text);
  if (!paragraphs.length) return null;
  return (
    <div>
      <p className="text-sm font-medium text-card-foreground">
        {CAREER_SECTION_LABELS.roleOverview}
      </p>
      <div className="mt-1 space-y-2 text-sm text-foreground">
        {paragraphs.map((p) => (
          <p key={p} className="leading-relaxed">
            {p}
          </p>
        ))}
      </div>
    </div>
  );
}

function BulletDetailField({ label, text }: { label: string; text: string }) {
  const items = parseBulletLines(text);
  if (!items.length) return null;
  return (
    <div>
      <p className="text-sm font-medium text-card-foreground">{label}</p>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-foreground">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
