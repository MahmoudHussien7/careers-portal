/**
 * Data Access Layer (DAL) — Careers mockup
 * Auth + HR / job postings / applications / screening forms only.
 */

import { api } from "./api";

import {
  ChangePasswordPayload,
  ChangePasswordResponse,
  LoginCredentials,
  LoginResponse,
  MeResponse,
  PasswordPolicy,
} from "@/types/auth";
import {
  HrUsersResponse,
  CreateHrUserPayload,
  UpdateHrUserPayload,
  JobPostingsListParams,
  JobPostingsListResponse,
  JobPostingDetailResponse,
  UpsertJobPostingPayload,
  ReplaceRecruitersPayload,
  HrMyJobsResponse,
  HrMyApplicationsResponse,
  HrApplicationListParams,
  HrApplicationsListResponse,
  UpdateHrApplicationPayload,
  ApplicationPipelinePhase,
  ApplicationFormFieldsResponse,
  CreateManualApplicationJsonPayload,
  CreateManualApplicationResponse,
  ApplicationFeedbackItem,
  CreateApplicationFeedbackPayload,
  HrFeedbackConfig,
  HrFeedbackConfigResponse,
} from "@/types/careers";
import { toApiApplicationPatch } from "@/lib/careers/applicationPipeline";
import type {
  ApplicationScreeningResponse,
  CreateScreeningFormPayload,
  ReplaceScreeningFormQuestionsPayload,
  SaveApplicationScreeningPayload,
  ScreeningFormDetailResponse,
  ScreeningFormsListParams,
  ScreeningFormsListResponse,
  UpdateScreeningFormPayload,
} from "@/types/screeningForm";

const ADMIN_API = "/api/admin";

/* ============================================================================
   AUTH
============================================================================ */

export const login = async (credentials: LoginCredentials) => {
  const { data } = await api.post<LoginResponse>(
    `${ADMIN_API}/auth/login`,
    credentials,
  );
  return data;
};

export const logout = async (refreshTokenValue?: string | null) => {
  try {
    const body = refreshTokenValue ? { refreshToken: refreshTokenValue } : {};
    const { data } = await api.post(`${ADMIN_API}/auth/logout`, body);
    return data;
  } catch (error) {
    console.warn(
      "Logout request failed, clearing frontend state anyway:",
      error,
    );
    return { status: "success", message: "Logged out locally" };
  }
};

export const getMe = async () => {
  const { data } = await api.get<MeResponse>(`${ADMIN_API}/auth/me`);
  return data;
};

function parsePasswordPolicyResponse(response: unknown): PasswordPolicy {
  const root = response as Record<string, unknown>;
  const data = (root?.data ?? root) as Record<string, unknown>;
  const policy = (data?.policy ?? data) as Record<string, unknown>;

  return {
    minLength: Number(policy.minLength ?? policy.min_length ?? 8),
    maxLength: Number(policy.maxLength ?? policy.max_length ?? 72),
    requireUppercase: Boolean(
      policy.requireUppercase ?? policy.require_uppercase ?? true,
    ),
    requireLowercase: Boolean(
      policy.requireLowercase ?? policy.require_lowercase ?? true,
    ),
    requireNumber: Boolean(
      policy.requireNumber ??
        policy.require_number ??
        policy.requireDigit ??
        true,
    ),
    requireSpecialCharacter: Boolean(
      policy.requireSpecialCharacter ??
        policy.require_special_character ??
        policy.requireSpecial ??
        false,
    ),
    rules: Array.isArray(policy.rules)
      ? policy.rules.filter((rule): rule is string => typeof rule === "string")
      : undefined,
  };
}

export const getPasswordPolicy = async (): Promise<PasswordPolicy> => {
  const { data } = await api.get(`${ADMIN_API}/auth/password-policy`);
  return parsePasswordPolicyResponse(data);
};

export const changePassword = async (payload: ChangePasswordPayload) => {
  const { data } = await api.post<ChangePasswordResponse>(
    `${ADMIN_API}/auth/change-password`,
    payload,
  );
  return data;
};

export const refreshToken = async (payload: {
  userId: string;
  refreshToken: string;
}) => {
  const { data } = await api.post(`${ADMIN_API}/auth/refresh`, payload);
  return {
    accessToken: data.accessToken as string,
    refreshToken: data.refreshToken as string,
  };
};

/* ============================================================================
   LOOKUPS
============================================================================ */

export interface LookupItem {
  id: string;
  name: string;
  slug?: string;
}

interface LookupResponse {
  status: string;
  data: {
    type: string;
    items: LookupItem[];
  };
}

export const getLookupItems = async (type: string): Promise<LookupItem[]> => {
  const { data } = await api.get<LookupResponse>(`/api/lookups/${type}`);
  const items =
    data?.data?.items ??
    (data as { items?: LookupItem[] })?.items ??
    (data as { data?: LookupItem[] })?.data ??
    (Array.isArray(data) ? data : []);
  return Array.isArray(items) ? items : [];
};

export const getJobPostingStatuses = () => getLookupItems("job_statuses");

interface ApplicationPipelineResponse {
  status: string;
  data: {
    type: string;
    items: ApplicationPipelinePhase[];
  };
}

export const getApplicationPipeline = async (): Promise<
  ApplicationPipelinePhase[]
> => {
  const { data } = await api.get<ApplicationPipelineResponse>(
    "/api/lookups/application_pipeline",
  );
  const items = data?.data?.items;
  return Array.isArray(items) ? items : [];
};

export const getLanguages = () => getLookupItems("languages");
export const getDepartments = () => getLookupItems("departments");
export const getEmploymentTypes = () => getLookupItems("employment_types");
export const getTeams = () => getLookupItems("teams");
export const getApplicationSources = () =>
  getLookupItems("application_sources");
export const getNationalities = () => getLookupItems("nationalities");
export const getFeedbackRecommendations = () =>
  getLookupItems("feedback_recommendations");

/* ============================================================================
   CAREERS - HR DIRECTORY
============================================================================ */

export const getAdminHrUsers = async (role_slug?: string) => {
  const { data } = await api.get<HrUsersResponse>(`${ADMIN_API}/hr/users`, {
    params: role_slug ? { role_slug } : undefined,
  });
  return data;
};

export const createAdminHrUser = async (payload: CreateHrUserPayload) => {
  const { data } = await api.post(`${ADMIN_API}/hr/users`, payload);
  return data;
};

export const updateAdminHrUser = async (
  id: string,
  payload: UpdateHrUserPayload,
) => {
  const { data } = await api.patch(`${ADMIN_API}/hr/users/${id}`, payload);
  return data;
};

/* ============================================================================
   CAREERS - JOB POSTINGS
============================================================================ */

export const getAdminJobPostings = async (params?: JobPostingsListParams) => {
  const { data } = await api.get<JobPostingsListResponse>(
    `${ADMIN_API}/job-postings`,
    { params },
  );
  return data;
};

export const getAdminJobPostingById = async (id: string) => {
  const { data } = await api.get<JobPostingDetailResponse>(
    `${ADMIN_API}/job-postings/${id}`,
  );
  return data;
};

export const createAdminJobPosting = async (
  payload: UpsertJobPostingPayload,
) => {
  const { data } = await api.post(`${ADMIN_API}/job-postings`, payload);
  return data;
};

export const updateAdminJobPosting = async (
  id: string,
  payload: Partial<UpsertJobPostingPayload>,
) => {
  const { data } = await api.patch(`${ADMIN_API}/job-postings/${id}`, payload);
  return data;
};

export const deleteAdminJobPosting = async (id: string) => {
  const { data } = await api.delete(`${ADMIN_API}/job-postings/${id}`);
  return data;
};

export const replaceJobPostingRecruiters = async (
  id: string,
  payload: ReplaceRecruitersPayload,
) => {
  const { data } = await api.put(
    `${ADMIN_API}/job-postings/${id}/recruiters`,
    payload,
  );
  return data;
};

/* ============================================================================
   CAREERS - MY WORKLOAD & APPLICATIONS
============================================================================ */

export const getAdminHrMyJobs = async () => {
  const { data } = await api.get<HrMyJobsResponse>(`${ADMIN_API}/hr/me/jobs`);
  return data;
};

export const getAdminHrMyApplications = async () => {
  const { data } = await api.get<HrMyApplicationsResponse>(
    `${ADMIN_API}/hr/me/applications`,
  );
  return data;
};

export const getAdminHrApplications = async (
  params?: HrApplicationListParams,
) => {
  const { data } = await api.get<HrApplicationsListResponse>(
    `${ADMIN_API}/hr/applications`,
    { params },
  );
  return data;
};

export const updateAdminHrApplication = async (
  id: string,
  payload: UpdateHrApplicationPayload,
  options?: { pipeline?: ApplicationPipelinePhase[] },
) => {
  const body = toApiApplicationPatch(payload, options?.pipeline ?? []);
  const { data } = await api.patch(`${ADMIN_API}/hr/applications/${id}`, body);
  return data;
};

export const getAdminHrApplicationFormFields = async () => {
  const { data } = await api.get<ApplicationFormFieldsResponse>(
    `${ADMIN_API}/hr/applications/form-fields`,
  );
  return data;
};

export const createAdminHrApplication = async (
  payload: CreateManualApplicationJsonPayload | FormData,
) => {
  if (payload instanceof FormData) {
    const { data } = await api.post<CreateManualApplicationResponse>(
      `${ADMIN_API}/hr/applications`,
      payload,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
  }
  const { data } = await api.post<CreateManualApplicationResponse>(
    `${ADMIN_API}/hr/applications`,
    payload,
  );
  return data;
};

export const getAdminHrFeedbackConfig = async (): Promise<HrFeedbackConfig> => {
  const { data } = await api.get<HrFeedbackConfigResponse>(
    `${ADMIN_API}/hr/feedback-config`,
  );
  const raw = data?.data ?? data;
  const ratingMax = Number(
    (raw as HrFeedbackConfigResponse)?.ratingMax ??
      (raw as HrFeedbackConfigResponse)?.rating_max ??
      5,
  );
  const requiredBeforePhaseChange = Boolean(
    (raw as HrFeedbackConfigResponse)?.requiredBeforePhaseChange ??
      (raw as HrFeedbackConfigResponse)?.required_before_phase_change ??
      false,
  );
  return {
    ratingMax: Number.isFinite(ratingMax) && ratingMax > 0 ? ratingMax : 5,
    requiredBeforePhaseChange,
  };
};

export const getAdminHrApplicationFeedback = async (
  id: string,
): Promise<ApplicationFeedbackItem[]> => {
  const { data } = await api.get<{
    status: string;
    data?: {
      items?: ApplicationFeedbackItem[];
      feedback?: ApplicationFeedbackItem[];
    };
    items?: ApplicationFeedbackItem[];
    feedback?: ApplicationFeedbackItem[];
  }>(`${ADMIN_API}/hr/applications/${id}/feedback`);
  const items =
    data?.data?.items ??
    data?.data?.feedback ??
    data?.items ??
    data?.feedback ??
    [];
  return Array.isArray(items) ? items : [];
};

export const createAdminHrApplicationFeedback = async (
  id: string,
  payload: CreateApplicationFeedbackPayload | FormData,
) => {
  if (payload instanceof FormData) {
    const { data } = await api.post(
      `${ADMIN_API}/hr/applications/${id}/feedback`,
      payload,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
  }
  const { data } = await api.post(
    `${ADMIN_API}/hr/applications/${id}/feedback`,
    payload,
  );
  return data;
};

/* ============================================================================
   CAREERS - SCREENING FORMS
============================================================================ */

export const getAdminScreeningForms = async (
  params?: ScreeningFormsListParams,
) => {
  const { data } = await api.get<ScreeningFormsListResponse>(
    `${ADMIN_API}/screening-forms`,
    { params },
  );
  return data;
};

export const getAdminScreeningFormById = async (id: string) => {
  const { data } = await api.get<ScreeningFormDetailResponse>(
    `${ADMIN_API}/screening-forms/${id}`,
  );
  return data;
};

export const createAdminScreeningForm = async (
  payload: CreateScreeningFormPayload,
) => {
  const { data } = await api.post<ScreeningFormDetailResponse>(
    `${ADMIN_API}/screening-forms`,
    payload,
  );
  return data;
};

export const updateAdminScreeningForm = async (
  id: string,
  payload: UpdateScreeningFormPayload,
) => {
  const { data } = await api.patch<ScreeningFormDetailResponse>(
    `${ADMIN_API}/screening-forms/${id}`,
    payload,
  );
  return data;
};

export const deleteAdminScreeningForm = async (id: string) => {
  const { data } = await api.delete(`${ADMIN_API}/screening-forms/${id}`);
  return data;
};

export const replaceAdminScreeningFormQuestions = async (
  id: string,
  payload: ReplaceScreeningFormQuestionsPayload,
) => {
  const { data } = await api.put<ScreeningFormDetailResponse>(
    `${ADMIN_API}/screening-forms/${id}/questions`,
    payload,
  );
  return data;
};

export const getAdminApplicationScreening = async (applicationId: string) => {
  const { data } = await api.get<ApplicationScreeningResponse>(
    `${ADMIN_API}/hr/applications/${applicationId}/screening`,
  );
  return data;
};

export const saveAdminApplicationScreening = async (
  applicationId: string,
  payload: SaveApplicationScreeningPayload,
) => {
  const { data } = await api.put<ApplicationScreeningResponse>(
    `${ADMIN_API}/hr/applications/${applicationId}/screening`,
    payload,
  );
  return data;
};
