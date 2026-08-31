/**
 * Formats job posting text fields the way the public careers site expects.
 *
 * Marketing site (`JobMainContent`):
 *   - role_overview     → roleOverviewParagraphs (split on blank lines)
 *   - key_responsibilities → keyResponse bullets (one item per line)
 *   - candidate_profile    → candidateProfile bullets
 *   - what_we_offer        → whatWeOffer bullets
 *
 * API stores plain strings; we normalize on save and when loading into the CMS.
 */

/** Section titles aligned with `CAREER_SECTION_HEADINGS` on the marketing site. */
export const CAREER_SECTION_LABELS = {
  roleOverview: "Role overview",
  keyResponsibilities: "Key responsibilities",
  candidateProfile: "Candidate profile",
  whatWeOffer: "What we offer",
} as const;

const BULLET_PREFIX = /^[\s•·\-\*–—]+/;

/** Split API / form text into bullet lines for preview or the marketing mapper. */
export function parseBulletLines(text: string | null | undefined): string[] {
  if (!text?.trim()) return [];
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(BULLET_PREFIX, "").trim())
    .filter(Boolean);
}

/** Split role overview into paragraphs (blank line between paragraphs). */
export function parseRoleOverviewParagraphs(
  text: string | null | undefined,
): string[] {
  if (!text?.trim()) return [];
  const byParagraph = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  if (byParagraph.length > 1) return byParagraph;
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

/** CMS textarea → API string for bullet fields. */
export function bulletLinesToApi(text: string): string {
  return parseBulletLines(text).join("\n");
}

/** CMS textarea → API string for role overview. */
export function roleOverviewToApi(text: string): string {
  const paragraphs = parseRoleOverviewParagraphs(text);
  return paragraphs.join("\n\n");
}

/** API → CMS textarea (editable one line per bullet). */
export function apiToBulletLines(text: string | null | undefined): string {
  return parseBulletLines(text).join("\n");
}

/** API → CMS textarea for role overview. */
export function apiToRoleOverview(text: string | null | undefined): string {
  const paragraphs = parseRoleOverviewParagraphs(text);
  return paragraphs.join("\n\n");
}
