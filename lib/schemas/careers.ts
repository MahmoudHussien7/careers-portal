import { z } from "zod";
import {
  HR_ROLE_OPTIONS,
  type HrDirectoryUser,
  type HrRoleSlug,
} from "@/types/careers";
import {
  email,
  enumField,
  optionalDate,
  optionalDateTime,
  optionalString,
  password,
  phone,
  requiredString,
  slug,
  uuid,
} from "./common";

const HR_ROLE_SLUGS = HR_ROLE_OPTIONS.map((option) => option.slug) as [
  HrRoleSlug,
  ...HrRoleSlug[],
];

/**
 * Which role(s) are valid managers for a given role.
 * Keep this in lock-step with `careersForms.ts::MANAGER_ROLE_FOR`.
 */
const MANAGER_ROLE_FOR: Record<HrRoleSlug, HrRoleSlug[]> = {
  "hr-admin": [],
  "senior-recruiter": ["hr-admin"],
  recruiter: ["senior-recruiter"],
  "office-admin": ["hr-admin"],
};

const ASSIGNMENT_SOURCE_VALUES = ["auto", "manual", ""] as const;

/* ----------------------------------------------------------------- *
 *  HR user creation
 * ----------------------------------------------------------------- */

/**
 * Validation for the "Create HR User" modal.
 *
 * Required fields:  email, password, first_name, last_name, role_slug
 * Conditional:      manager_id is REQUIRED when role_slug = "recruiter"
 *                   (recruiters must report to a senior recruiter)
 *
 * QA test matrix is documented in `docs/FORM_VALIDATION.md`.
 */
const hrUserBaseSchema = z.object({
  email: email("Email"),
  password: password("Password"),
  first_name: requiredString("First name", { min: 2, max: 60 }),
  last_name: requiredString("Last name", { min: 2, max: 60 }),
  phone: phone("Phone"),
  role_slug: enumField("Role", HR_ROLE_SLUGS),
  // manager_id is optional at the type level; we add cross-field rules below.
  manager_id: uuid("Manager", { required: false }),
});

/**
 * Static rules (no dependency on the HR directory):
 *  • recruiter → manager_id required
 *  • hr-admin  → must NOT have a manager_id
 */
export const hrUserSchema = hrUserBaseSchema.superRefine((value, ctx) => {
  if (value.role_slug === "recruiter" && !value.manager_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["manager_id"],
      message:
        "Manager is required for Recruiters. Pick a Senior Recruiter to report to.",
    });
  }
  if (value.role_slug === "hr-admin" && value.manager_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["manager_id"],
      message:
        "HR Admin sits at the top of the hierarchy and cannot have a manager.",
    });
  }
});

/**
 * Factory that builds an HR-user schema *and* enforces "the selected
 * manager has a valid role for this hire". Needs the current HR
 * directory so we can look the manager up.
 */
export function makeHrUserSchema(hrUsers: HrDirectoryUser[]) {
  return hrUserBaseSchema.superRefine((value, ctx) => {
    if (value.role_slug === "recruiter" && !value.manager_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["manager_id"],
        message:
          "Manager is required for Recruiters. Pick a Senior Recruiter to report to.",
      });
      return;
    }
    if (value.role_slug === "hr-admin" && value.manager_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["manager_id"],
        message:
          "HR Admin sits at the top of the hierarchy and cannot have a manager.",
      });
      return;
    }

    if (!value.manager_id) return;

    const role = value.role_slug as HrRoleSlug;
    const allowed = MANAGER_ROLE_FOR[role];
    if (!allowed || allowed.length === 0) return;

    const manager = hrUsers.find((person) => person.id === value.manager_id);
    if (!manager) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["manager_id"],
        message:
          "Selected manager is not in the HR directory. Refresh the page and pick again.",
      });
      return;
    }
    if (!allowed.includes(manager.role_slug as HrRoleSlug)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["manager_id"],
        message: `Manager has role "${manager.role_slug}". A ${role} must report to a ${allowed.join(" or ")}.`,
      });
    }
  });
}

export type HrUserSchema = z.input<typeof hrUserSchema>;
export type HrUserParsed = z.output<typeof hrUserSchema>;

/** Validation for admin edits to an existing HR directory user profile. */
export function makeUpdateHrUserSchema(hrUsers: HrDirectoryUser[]) {
  return z
    .object({
      first_name: requiredString("First name", { min: 2, max: 60 }),
      last_name: requiredString("Last name", { min: 2, max: 60 }),
      email: email("Email"),
      phone: phone("Phone"),
      address: optionalString("Address", 500),
      title: optionalString("Job title", 120),
      role_slug: enumField("Role", HR_ROLE_SLUGS),
      is_active: z.boolean(),
      manager_id: uuid("Manager", { required: false }),
    })
    .superRefine((value, ctx) => {
      const role = value.role_slug;

      if (role === "recruiter" && !value.manager_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["manager_id"],
          message:
            "A recruiter must report to a Senior Recruiter. Select a manager or reassign below.",
        });
        return;
      }

      if (role === "hr-admin" && value.manager_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["manager_id"],
          message: "HR Admin cannot have a manager.",
        });
        return;
      }

      if (!value.manager_id) return;

      const allowed = MANAGER_ROLE_FOR[role as HrRoleSlug];
      if (!allowed?.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["manager_id"],
          message: "This role cannot have a manager.",
        });
        return;
      }

      const manager = hrUsers.find((person) => person.id === value.manager_id);
      if (!manager) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["manager_id"],
          message: "Selected manager was not found in the HR directory.",
        });
        return;
      }
      if (!allowed.includes(manager.role_slug as HrRoleSlug)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["manager_id"],
          message: `Manager must be a ${allowed.join(" or ")}.`,
        });
      }
    });
}

export type UpdateHrUserSchema = z.input<
  ReturnType<typeof makeUpdateHrUserSchema>
>;
export type UpdateHrUserParsed = z.output<
  ReturnType<typeof makeUpdateHrUserSchema>
>;

/* ----------------------------------------------------------------- *
 *  Job posting (create + edit)
 * ----------------------------------------------------------------- */

/**
 * "Create / edit job posting" modal validation.
 *
 * Required: slug, title, location, status, department, employment type,
 *             team, and all public job-page content sections.
 */
export const jobPostingSchema = z.object({
  slug: slug("Slug"),
  title: requiredString("Title", { min: 3, max: 120 }),
  location: requiredString("Location", { min: 2, max: 120 }),
  timezone: optionalString("Timezone", 60),
  salary_range: optionalString("Salary range", 80),
  status_id: uuid("Status", { required: true }),
  department_id: uuid("Department", { required: true }),
  employment_type_id: uuid("Employment type", { required: true }),
  team_id: uuid("Team", { required: true }),
  published_at: optionalDateTime("Published at"),
  expires_at: optionalDateTime("Expires at"),
  description: optionalString("Description", 8000),
  about_company: optionalString("About company", 8000),
  role_overview: requiredString("Role overview", { min: 10, max: 8000 }),
  key_responsibilities: requiredString("Key responsibilities", {
    min: 3,
    max: 8000,
  }),
  candidate_profile: requiredString("Candidate profile", {
    min: 3,
    max: 8000,
  }),
  what_we_offer: requiredString("What we offer", { min: 3, max: 8000 }),
  user_ids: z.array(
    z.string().uuid({ message: "Each assigned user must be a valid UUID." }),
  ),
  screening_form_id: uuid("Screening form", { required: false }),
});

export type JobPostingSchema = z.input<typeof jobPostingSchema>;
export type JobPostingParsed = z.output<typeof jobPostingSchema>;

/* ----------------------------------------------------------------- *
 *  Candidate / application update
 * ----------------------------------------------------------------- */

/**
 * Edits applied to an HR application from the candidate detail modal.
 * No field is required individually, but at least one of them must be
 * provided (otherwise there is nothing to save).
 */
export const candidateUpdateSchema = z
  .object({
    phase_id: z
      .union([uuid("Pipeline phase", { required: false }), z.null()])
      .optional(),
    pipeline_phase: z.string().optional(),
    status_id: z
      .union([uuid("Application status", { required: false }), z.null()])
      .optional(),
    assigned_to_user_id: z
      .union([uuid("Assignee", { required: false }), z.null()])
      .optional(),
    assignment_source: z
      .string()
      .max(40, {
        message: "Assignment source must be at most 40 characters.",
      })
      .optional()
      .refine(
        (v) =>
          !v || ASSIGNMENT_SOURCE_VALUES.includes(v as "auto" | "manual" | ""),
        {
          message: 'Assignment source must be "auto" or "manual".',
        },
      ),
  })
  .refine(
    (value) =>
      value.phase_id !== undefined ||
      (value.pipeline_phase !== undefined && value.pipeline_phase !== "") ||
      value.status_id !== undefined ||
      value.assigned_to_user_id !== undefined ||
      (value.assignment_source !== undefined && value.assignment_source !== ""),
    {
      message: "Change at least one field before saving.",
      path: ["_root"],
    },
  );

export type CandidateUpdateSchema = z.input<typeof candidateUpdateSchema>;
export type CandidateUpdateParsed = z.output<typeof candidateUpdateSchema>;

/* ----------------------------------------------------------------- *
 *  Job recruiters multi-select
 * ----------------------------------------------------------------- */

/**
 * Validation for the "Manage recruiter pool" modal. Backend accepts an
 * empty array to clear the pool, so we just verify every entry is a UUID.
 */
export const jobRecruitersSchema = z.object({
  user_ids: z
    .array(z.string().uuid({ message: "Recruiter ID must be a valid UUID." }), {
      message: "Recruiter selection must be a list.",
    })
    .max(100, { message: "Cannot assign more than 100 recruiters at once." }),
});

export type JobRecruitersSchema = z.infer<typeof jobRecruitersSchema>;

/* ----------------------------------------------------------------- *
 *  Manual candidate application (CMS create)
 * ----------------------------------------------------------------- */

/**
 * Validation for POST /api/admin/hr/applications (manual entry).
 * Field names match the Careers camelCase API contract.
 * CV file is validated separately in the submit hook (not in Zod).
 */
export const manualApplicationSchema = z.object({
  jobId: uuid("Job posting", { required: true }),
  applicationSourceId: uuid("Application source", { required: true }),
  fullName: requiredString("Full name", { min: 2, max: 120 }),
  email: email("Email"),
  mobileNumber: phone("Mobile number", { required: true }),
  coverLetter: optionalString("Cover letter", 10_000),
  birthDate: optionalDate("Birth date"),
  nationalityId: uuid("Nationality", { required: false }),
  currentAddress: optionalString("Current address", 500),
  yearsOfExperience: z
    .string()
    .refine(
      (v) => !v || (!Number.isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 60),
      { message: "Years of experience must be a number between 0 and 60." },
    ),
  spokenLanguageIds: z.array(z.string()).max(20, {
    message: "Select at most 20 languages.",
  }),
  educationLevel: optionalString("Education level", 120),
  maritalStatus: optionalString("Marital status", 60),
  gender: optionalString("Gender", 40),
  visaStatus: optionalString("Visa status", 120),
  driverLicense: z.boolean(),
  inDubaiNow: z.boolean(),
  readyToJoinBy: optionalDate("Ready to join by"),
  acceptPrivacy: z.boolean(),
  statusId: uuid("Status", { required: false }),
});

export type ManualApplicationSchema = z.input<typeof manualApplicationSchema>;

/* ----------------------------------------------------------------- *
 *  Candidate stage feedback
 * ----------------------------------------------------------------- */

/**
 * Validation for POST /api/admin/hr/applications/{id}/feedback.
 * Field names match the API camelCase contract.
 * `ratingMax` comes from GET /api/admin/hr/feedback-config.
 */
export function makeApplicationFeedbackSchema(ratingMax = 5) {
  const max = Number.isFinite(ratingMax) && ratingMax > 0 ? ratingMax : 5;
  return z.object({
    title: requiredString("Title", { min: 2, max: 200 }),
    notes: requiredString("Notes", { min: 2, max: 10_000 }),
    recommendationId: uuid("Recommendation", { required: true }),
    phaseId: uuid("Phase", { required: true }),
    rating: z
      .string()
      .refine(
        (v) => {
          if (!v) return true;
          const n = Number(v);
          return Number.isInteger(n) && n >= 1 && n <= max;
        },
        { message: `Rating must be a whole number between 1 and ${max}.` },
      ),
  });
}

export type ApplicationFeedbackSchema = z.input<
  ReturnType<typeof makeApplicationFeedbackSchema>
>;
export type ApplicationFeedbackParsed = z.output<
  ReturnType<typeof makeApplicationFeedbackSchema>
>;
