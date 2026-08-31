import type { UserRole } from "@/types/auth";
import type { HrDirectoryUser, HrRoleSlug } from "@/types/careers";

export { HR_ROLE_OPTIONS } from "@/types/careers";

export type HrFormState = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
  role_slug: HrRoleSlug | "";
  manager_id: string;
};

export type JobFormState = {
  slug: string;
  title: string;
  location: string;
  timezone: string;
  salary_range: string;
  status_id: string;
  department_id: string;
  employment_type_id: string;
  team_id: string;
  published_at: string;
  expires_at: string;
  description: string;
  about_company: string;
  role_overview: string;
  key_responsibilities: string;
  candidate_profile: string;
  what_we_offer: string;
  user_ids: string[];
  screening_form_id: string;
};

/** URL-safe slug from a job title (matches `SLUG_RX` in `lib/schemas/common.ts`). */
export function titleToSlug(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Current local time for `<input type="datetime-local" />`. */
export function nowDatetimeLocal(): string {
  return isoToDatetimeLocal(new Date().toISOString());
}

/** ISO / API datetime → value for `<input type="datetime-local" />`. */
export function isoToDatetimeLocal(iso: string | null | undefined): string {
  if (!iso?.trim()) return "";
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch {
    return "";
  }
}

/** `datetime-local` value → ISO string for the API. */
export function datetimeLocalToIso(local: string | undefined): string | undefined {
  const trimmed = (local ?? "").trim();
  if (!trimmed) return undefined;
  if (trimmed.includes("Z") || trimmed.includes("+")) return trimmed;
  const normalized =
    trimmed.length === 16 ? `${trimmed}:00` : trimmed;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

export const initialHrForm: HrFormState = {
  email: "",
  password: "",
  first_name: "",
  last_name: "",
  phone: "",
  role_slug: "",
  manager_id: "",
};

export const initialJobForm: JobFormState = {
  slug: "",
  title: "",
  location: "",
  timezone: "",
  salary_range: "",
  status_id: "",
  department_id: "",
  employment_type_id: "",
  team_id: "",
  published_at: "",
  expires_at: "",
  description: "",
  about_company: "",
  role_overview: "",
  key_responsibilities: "",
  candidate_profile: "",
  what_we_offer: "",
  user_ids: [],
  screening_form_id: "",
};

/**
 * Roles allowed to access the Careers area at all.
 * Backend role hierarchy (top → bottom):
 *   admin / hr-admin → senior-recruiter → recruiter / office-admin
 */
export const careersAllowedRoles: UserRole[] = [
  "admin",
  "hr-admin",
  "senior-recruiter",
  "recruiter",
  "office-admin",
  "marketing",
  "seo",
  "sales-admin",
];

/**
 * For each new HR user, which role(s) are valid as their direct manager.
 *  - recruiter         must have a senior-recruiter manager (required).
 *  - senior-recruiter  reports up to an hr-admin (optional).
 *  - office-admin      reports to hr-admin (optional).
 *  - hr-admin          top of the tree (no manager).
 */
export const MANAGER_ROLE_FOR: Record<HrRoleSlug, HrRoleSlug[]> = {
  "hr-admin": [],
  "senior-recruiter": ["hr-admin"],
  recruiter: ["senior-recruiter"],
  "office-admin": ["hr-admin"],
};

/** A recruiter MUST have a manager — others are optional. */
export const MANAGER_REQUIRED_FOR: HrRoleSlug[] = ["recruiter"];

/** Filter the HR directory down to candidates eligible to manage `role`. */
export function eligibleManagers(
  role: HrRoleSlug | "",
  directory: HrDirectoryUser[],
): HrDirectoryUser[] {
  if (!role) return [];
  const allowed = MANAGER_ROLE_FOR[role];
  if (!allowed.length) return [];
  return directory.filter((person) =>
    allowed.includes(person.role_slug as HrRoleSlug),
  );
}

export function isManagerRequired(role: HrRoleSlug | ""): boolean {
  return !!role && MANAGER_REQUIRED_FOR.includes(role);
}
