import type { UserRole } from "@/types/auth";

/**
 * Roles whose entire app experience is the Careers portal.
 */
export const HR_ONLY_ROLES: UserRole[] = [
  "hr-admin",
  "senior-recruiter",
  "recruiter",
  "office-admin",
];

export function isHrOnlyRole(roleSlug: string | null | undefined): boolean {
  return !!roleSlug && HR_ONLY_ROLES.includes(roleSlug as UserRole);
}

/**
 * This mockup is Careers-only — every signed-in role lands on the portal.
 */
export function defaultLandingPath(
  _roleSlug?: string | null,
): string {
  return "/dashboard/careers";
}
