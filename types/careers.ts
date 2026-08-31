export type HrRoleSlug =
  | "hr-admin"
  | "senior-recruiter"
  | "recruiter"
  | "office-admin";

export const HR_ROLE_OPTIONS: Array<{ slug: HrRoleSlug; label: string }> = [
  { slug: "hr-admin", label: "HR Admin" },
  { slug: "senior-recruiter", label: "Senior Recruiter" },
  { slug: "recruiter", label: "Recruiter" },
  { slug: "office-admin", label: "Office Admin" },
];

export interface HrDirectoryUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  address?: string | null;
  /** Display job title, e.g. "Lead Recruiter" (separate from system role). */
  title?: string | null;
  role_slug: HrRoleSlug | string;
  role_name?: string;
  manager_id?: string | null;
  manager?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role_slug?: HrRoleSlug | string;
  } | null;
  profile_picture_url?: string | null;
  is_active?: boolean;
}

export interface HrUsersResponse {
  status: string;
  data: {
    users: HrDirectoryUser[];
  };
}

export interface CreateHrUserPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role_slug: HrRoleSlug;
  manager_id?: string;
}

export interface UpdateHrUserPayload {
  email?: string;
  manager_id?: string | null;
  role_slug?: HrRoleSlug;
  title?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
  is_active?: boolean;
}

export interface JobPostingRelation {
  id: string;
  slug: string;
  name: string;
}

export interface JobAssignedUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  profile_picture_url?: string | null;
}

export interface JobPosting {
  id: string;
  slug: string;
  title: string;
  location?: string | null;
  salary_range?: string | null;
  published_at?: string | null;
  expires_at?: string | null;
  timezone?: string | null;
  department?: JobPostingRelation | null;
  employment_type?: JobPostingRelation | null;
  status?: JobPostingRelation | null;
  team?: JobPostingRelation | null;
  assigned_users?: JobAssignedUser[];
  description?: string;
  about_company?: string;
  role_overview?: string;
  key_responsibilities?: string;
  candidate_profile?: string;
  what_we_offer?: string;
  screening_form_id?: string | null;
  screening_form?: { id: string; title: string; is_active?: boolean } | null;
}

export interface JobPostingsListParams {
  page?: number;
  limit?: number;
  department_id?: string;
  status_id?: string;
  search?: string;
  location?: string;
}

export interface JobPostingsListResponse {
  status: string;
  data: {
    jobs: JobPosting[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface JobPostingDetailResponse {
  status: string;
  data: {
    job: JobPosting;
  };
}

export interface UpsertJobPostingPayload {
  department_id?: string;
  employment_type_id?: string;
  team_id?: string;
  timezone?: string;
  salary_range?: string;
  status_id?: string;
  published_at?: string;
  expires_at?: string;
  slug: string;
  title: string;
  description?: string;
  location?: string;
  about_company?: string;
  role_overview?: string;
  key_responsibilities?: string;
  candidate_profile?: string;
  what_we_offer?: string;
  user_ids?: string[];
  screening_form_id?: string | null;
}

export interface ReplaceRecruitersPayload {
  user_ids: string[];
}

export interface HrMyJobsResponse {
  status: string;
  data: {
    jobs: JobPosting[];
  };
}

export interface ApplicationLanguage {
  id: string;
  code: string;
  name: string;
}

/**
 * Application payload as returned by GET /api/admin/hr/applications and
 * GET /api/admin/hr/me/applications.
 *
 * The backend ships candidate fields flat on the application object —
 * there is no nested `applicant` wrapper. All non-required fields are
 * optional so the UI degrades gracefully when something is missing.
 */
export interface HrApplication {
  id: string;

  // Candidate identity
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;

  // Personal details
  birth_date?: string | null;
  nationality_id?: string | null;
  nationality_name?: string | null;
  current_address?: string | null;
  years_of_experience?: string | number | null;
  spoken_languages?: ApplicationLanguage[];
  education_level?: string | null;
  marital_status?: string | null;
  gender?: string | null;
  visa_status?: string | null;
  driver_license?: boolean | null;
  in_dubai_now?: boolean | null;
  ready_to_join_by?: string | null;
  accept_privacy?: boolean | null;

  // Job linkage (flat on the application)
  job_id?: string | null;
  job_slug?: string | null;
  job_title?: string | null;
  job_status?: JobPostingRelation | null;

  // Pipeline / assignment (`application_pipeline` lookup)
  phase_id?: string | null;
  status_id?: string | null;
  application_status?: JobPostingRelation | null;
  /** Phase slug — kept in sync with `phase_id` when the API returns both. */
  pipeline_phase?: string | null;
  assignment_source?: string | null;
  assigned_to_user_id?: string | null;
  assigned_to_user?: JobAssignedUser | null;
  assigned_at?: string | null;

  // Attachments + free-form
  cv_url?: string | null;
  cv_filename?: string | null;
  cv_uploaded_at?: string | null;
  cover_letter?: string | null;
  notes?: string | null;

  // Audit
  locale?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface HrMyApplicationsResponse {
  status: string;
  data: {
    applications: HrApplication[];
  };
}

/** Phase row from GET /api/lookups/application_pipeline (includes allowed statuses). */
export interface ApplicationPipelinePhase {
  id: string;
  slug: string;
  name: string;
  display_order?: number;
  statuses: Array<{
    id: string;
    slug: string;
    name: string;
    display_order?: number;
  }>;
}

export interface UpdateHrApplicationPayload {
  assigned_to_user_id?: string | null;
  /** UUID from `application_pipeline`. */
  phase_id?: string | null;
  /** Resolved to `phase_id` before PATCH when only a slug is provided. */
  pipeline_phase?: string;
  /** Must be valid for the application's current phase in `application_pipeline`. */
  status_id?: string | null;
  assignment_source?: string | null;
}

/**
 * Field metadata from GET /api/admin/hr/applications/form-fields.
 * Names use Careers camelCase (fullName, mobileNumber, …).
 */
export interface ApplicationFormFieldMeta {
  name: string;
  type?: string;
  required?: boolean;
  label?: string;
  options?: Array<{ value: string; label: string }>;
}

export interface ApplicationFormFieldsResponse {
  status: string;
  data?: {
    fields?: ApplicationFormFieldMeta[];
    create?: ApplicationFormFieldMeta[];
    update?: ApplicationFormFieldMeta[];
  };
  fields?: ApplicationFormFieldMeta[];
}

/**
 * JSON body for POST /api/admin/hr/applications (manual CMS create).
 * Prefer multipart when uploading a CV file.
 */
export interface CreateManualApplicationJsonPayload {
  jobId: string;
  applicationSourceId: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  cvUrl: string;
  coverLetter?: string | null;
  birthDate?: string | null;
  nationalityId?: string | null;
  currentAddress?: string | null;
  yearsOfExperience?: number | null;
  spokenLanguages?: string[];
  educationLevel?: string | null;
  maritalStatus?: string | null;
  gender?: string | null;
  visaStatus?: string | null;
  driverLicense?: boolean | null;
  inDubaiNow?: boolean | null;
  readyToJoinBy?: string | null;
  acceptPrivacy?: boolean;
  statusId?: string | null;
}

/** Form-state companion for multipart create (CV file instead of cvUrl). */
export type CreateManualApplicationFormValues = {
  jobId: string;
  applicationSourceId: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  coverLetter: string;
  birthDate: string;
  nationalityId: string;
  currentAddress: string;
  yearsOfExperience: string;
  spokenLanguageIds: string[];
  educationLevel: string;
  maritalStatus: string;
  gender: string;
  visaStatus: string;
  driverLicense: boolean;
  inDubaiNow: boolean;
  readyToJoinBy: string;
  acceptPrivacy: boolean;
  statusId: string;
};


export interface CreateManualApplicationResponse {
  status: string;
  data?: {
    application?: HrApplication;
  };
  application?: HrApplication;
  message?: string;
}

/**
 * GET /api/admin/hr/feedback-config
 * Driven by HR_FEEDBACK_RATING_MAX and HR_FEEDBACK_REQUIRED_BEFORE_PHASE_CHANGE.
 */
export interface HrFeedbackConfig {
  /** Max rating value (typically 5 or 10). */
  ratingMax: number;
  /** When true, phase progression requires feedback on the current phase. */
  requiredBeforePhaseChange: boolean;
}

export interface HrFeedbackConfigResponse {
  status: string;
  data?: {
    ratingMax?: number;
    rating_max?: number;
    requiredBeforePhaseChange?: boolean;
    required_before_phase_change?: boolean;
  };
  ratingMax?: number;
  rating_max?: number;
  requiredBeforePhaseChange?: boolean;
  required_before_phase_change?: boolean;
}

/** Feedback row from GET /api/admin/hr/applications/{id}/feedback. */
export interface ApplicationFeedbackItem {
  id: string;
  title?: string | null;
  notes?: string | null;
  rating?: number | null;
  recommendation?: { id: string; name?: string; slug?: string } | null;
  recommendation_id?: string | null;
  phase?: { id: string; name?: string; slug?: string } | null;
  phase_id?: string | null;
  author?: {
    id?: string;
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
  } | null;
  attachments?: Array<{
    file_url?: string;
    file_name?: string;
    mime_type?: string;
  }>;
  created_at?: string;
}

export interface CreateApplicationFeedbackPayload {
  title: string;
  notes: string;
  recommendationId: string;
  phaseId: string;
  rating?: number | null;
  attachments?: Array<{
    file_url: string;
    file_name?: string;
    mime_type?: string;
  }>;
}

/** Form-state for adding stage feedback in the candidate modal. */
export type CreateApplicationFeedbackFormValues = {
  title: string;
  notes: string;
  recommendationId: string;
  phaseId: string;
  rating: string;
};

/**
 * GET /api/admin/hr/applications query params.
 *
 * Backend role scope:
 *  - admin / hr-admin       → all assigned applications
 *  - senior-recruiter       → own + direct recruiters
 *  - recruiter / office-admin → only own assigned applications
 */
export interface HrApplicationListParams {
  job_id?: string;
  assigned_to_user_id?: string;
  /** Filter by pipeline phase slug (`application_pipeline`). */
  pipeline_phase?: string;
  /** Filter by status id (must belong to the phase in `application_pipeline`). */
  status_id?: string;
  search?: string;
  limit?: number;
}

export interface HrApplicationsListResponse {
  status: string;
  data: {
    applications: HrApplication[];
  };
}
