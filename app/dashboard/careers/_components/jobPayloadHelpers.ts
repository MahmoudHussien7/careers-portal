import type { LookupItem } from "@/lib/dal";
import type { HrDirectoryUser, HrRoleSlug, UpsertJobPostingPayload } from "@/types/careers";
import type { ScreeningFormListItem } from "@/types/screeningForm";
import type { JobPostingParsed } from "@/lib/schemas";
import { datetimeLocalToIso } from "./careersForms";
import {
  bulletLinesToApi,
  roleOverviewToApi,
} from "./careerContentFormat";

/** Default IANA timezone for UAE listings when not specified. */
export const DEFAULT_JOB_TIMEZONE = "Asia/Dubai";

/** Roles eligible for a job's assignee pool (round-robin CV routing). */
export const JOB_POOL_ELIGIBLE_ROLES: HrRoleSlug[] = [
  "recruiter",
  "senior-recruiter",
  "hr-admin",
];

const RECRUITER_POOL_ROLES: HrRoleSlug[] = ["recruiter", "senior-recruiter"];

function isActiveHrUser(user: HrDirectoryUser): boolean {
  return user.is_active !== false;
}

function eligiblePoolUserIdSet(hrUsers: HrDirectoryUser[]): Set<string> {
  return new Set(
    hrUsers
      .filter(
        (u) =>
          JOB_POOL_ELIGIBLE_ROLES.includes(u.role_slug as HrRoleSlug) &&
          isActiveHrUser(u),
      )
      .map((u) => u.id),
  );
}

function validRecruiterIds(
  ids: string[] | undefined,
  hrUsers: HrDirectoryUser[],
): string[] {
  if (!ids?.length) return [];
  const eligible = eligiblePoolUserIdSet(hrUsers);
  return ids.filter((id) => eligible.has(id));
}

export function poolRecruiterAndSeniorIds(
  ids: string[],
  hrUsers: HrDirectoryUser[],
): string[] {
  if (!ids.length) return [];
  const eligible = new Set(
    hrUsers
      .filter(
        (u) =>
          RECRUITER_POOL_ROLES.includes(u.role_slug as HrRoleSlug) &&
          isActiveHrUser(u),
      )
      .map((u) => u.id),
  );
  return ids.filter((id) => eligible.has(id));
}

export function activeHrAdminIds(hrUsers: HrDirectoryUser[]): string[] {
  return hrUsers
    .filter((u) => u.role_slug === "hr-admin" && isActiveHrUser(u))
    .map((u) => u.id);
}

/**
 * On create, when no recruiter or senior recruiter is in the pool, assign the
 * creating HR admin (or the first active HR admin) so applications can be received.
 */
export function resolveJobPoolIdsForCreate(
  selectedIds: string[],
  hrUsers: HrDirectoryUser[],
  options: { creatorId?: string; creatorRole?: string },
): string[] {
  const poolIds = validRecruiterIds(selectedIds, hrUsers);
  const hasRecruiterOrSenior = poolRecruiterAndSeniorIds(selectedIds, hrUsers).length > 0;

  if (hasRecruiterOrSenior) return poolIds;
  if (poolIds.length > 0) return poolIds;

  if (options.creatorRole === "hr-admin" && options.creatorId) {
    return [options.creatorId];
  }

  const hrAdmins = activeHrAdminIds(hrUsers);
  return hrAdmins.length > 0 ? [hrAdmins[0]!] : [];
}

export interface JobFormLookups {
  statuses: LookupItem[];
  departments: LookupItem[];
  employmentTypes: LookupItem[];
  teams: LookupItem[];
  hrUsers: HrDirectoryUser[];
  screeningForms: ScreeningFormListItem[];
}

function validLookupId(
  value: string | undefined,
  items: LookupItem[],
): string | undefined {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return undefined;
  return items.some((item) => item.id === trimmed) ? trimmed : undefined;
}

const optionalText = (val: string | undefined) => {
  const trimmed = (val ?? "").trim();
  return trimmed === "" ? undefined : trimmed;
};

/**
 * Maps validated form data to the API body, dropping FK ids that are not in
 * the loaded lookup lists (prevents 400 "related data is missing").
 */
export function buildJobPostingPayload(
  parsed: JobPostingParsed,
  lookups: JobFormLookups,
): UpsertJobPostingPayload {
  const status_id = validLookupId(parsed.status_id, lookups.statuses);
  const department_id = validLookupId(parsed.department_id, lookups.departments);
  const employment_type_id = validLookupId(
    parsed.employment_type_id,
    lookups.employmentTypes,
  );
  const team_id = validLookupId(parsed.team_id, lookups.teams);

  const status = lookups.statuses.find((s) => s.id === status_id);
  const statusSlug = status?.slug?.toLowerCase() ?? "";
  const isDraft = statusSlug === "draft";
  const isPublished = statusSlug === "published";

  let published_at: string | undefined;
  if (status_id && (isPublished || (!isDraft && statusSlug !== "closed"))) {
    published_at =
      datetimeLocalToIso(parsed.published_at) ?? new Date().toISOString();
  }

  const user_ids = validRecruiterIds(parsed.user_ids, lookups.hrUsers);

  const screeningId = (parsed.screening_form_id ?? "").trim();
  const screening_form_id = screeningId
    ? lookups.screeningForms.some((form) => form.id === screeningId)
      ? screeningId
      : undefined
    : null;

  return {
    slug: parsed.slug,
    title: parsed.title,
    location: optionalText(parsed.location),
    timezone: optionalText(parsed.timezone) ?? DEFAULT_JOB_TIMEZONE,
    salary_range: optionalText(parsed.salary_range),
    status_id,
    department_id,
    employment_type_id,
    team_id,
    published_at,
    expires_at: datetimeLocalToIso(parsed.expires_at),
    description: optionalText(parsed.description),
    about_company: optionalText(parsed.about_company),
    role_overview: optionalText(roleOverviewToApi(parsed.role_overview ?? "")),
    key_responsibilities: optionalText(
      bulletLinesToApi(parsed.key_responsibilities ?? ""),
    ),
    candidate_profile: optionalText(
      bulletLinesToApi(parsed.candidate_profile ?? ""),
    ),
    what_we_offer: optionalText(bulletLinesToApi(parsed.what_we_offer ?? "")),
    user_ids: user_ids.length ? user_ids : undefined,
    screening_form_id,
  };
}

/** Body for POST/PATCH — never includes `user_ids` (separate recruiters endpoint). */
export function jobPostingBodyWithoutRecruiters(
  payload: UpsertJobPostingPayload,
): Omit<UpsertJobPostingPayload, "user_ids"> {
  const { user_ids: _omit, ...body } = payload;
  return body;
}

export function extractCreatedJobId(response: unknown): string | undefined {
  if (!response || typeof response !== "object") return undefined;
  const r = response as Record<string, unknown>;
  const data = r.data as Record<string, unknown> | undefined;
  const job = (data?.job ?? r.job) as { id?: string } | undefined;
  if (job?.id) return job.id;
  if (typeof data?.id === "string") return data.id;
  return undefined;
}
