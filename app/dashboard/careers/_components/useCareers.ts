"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import * as dal from "@/lib/dal";
import { extractApiError } from "@/lib/utils";
import type {
  ApplicationPipelinePhase,
  HrApplication,
  HrApplicationListParams,
  HrDirectoryUser,
  JobPosting,
  JobPostingsListParams,
  UpdateHrApplicationPayload,
} from "@/types/careers";
import { useViewModal } from "@/hooks";

const initialJobsPagination = { page: 1, limit: 10, total: 0, totalPages: 0 };

export function useCareers() {
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [jobFilters, setJobFilters] = useState<JobPostingsListParams>({
    page: 1,
    limit: 10,
  });
  const [searchInput, setSearchInput] = useState("");
  const [jobsPagination, setJobsPagination] = useState(initialJobsPagination);

  const [hrUsers, setHrUsers] = useState<HrDirectoryUser[]>([]);
  const [myJobs, setMyJobs] = useState<JobPosting[]>([]);
  const [myApplications, setMyApplications] = useState<HrApplication[]>([]);

  const [applications, setApplications] = useState<HrApplication[]>([]);
  const [applicationFilters, setApplicationFilters] =
    useState<HrApplicationListParams>({ limit: 25 });

  const [statuses, setStatuses] = useState<dal.LookupItem[]>([]);
  const [departments, setDepartments] = useState<dal.LookupItem[]>([]);
  const [employmentTypes, setEmploymentTypes] = useState<dal.LookupItem[]>([]);
  const [teams, setTeams] = useState<dal.LookupItem[]>([]);
  const [applicationPipeline, setApplicationPipeline] = useState<
    ApplicationPipelinePhase[]
  >([]);

  const [applicationPatchMap, setApplicationPatchMap] = useState<
    Record<string, UpdateHrApplicationPayload>
  >({});

  const roleSlug = user?.roleSlug || "";
  const permissions = useMemo(
    () => ({
      // Only admin and hr-admin can create / edit HR directory users.
      canManageHrDirectory: roleSlug === "admin" || roleSlug === "hr-admin",
      canManageJobs: [
        "admin",
        "hr-admin",
        "marketing",
        "seo",
        "sales-admin",
      ].includes(roleSlug),
      // The "My Work" section is for anyone who can be assigned applications.
      canViewMyWork: [
        "admin",
        "hr-admin",
        "senior-recruiter",
        "recruiter",
        "office-admin",
      ].includes(roleSlug),
      // The team-wide applications section is gated by backend role-scope:
      //   admin / hr-admin       → all
      //   senior-recruiter       → own + direct recruiters
      //   recruiter / office-admin would only see their own → use My Work instead.
      canViewTeamApplications: [
        "admin",
        "hr-admin",
        "senior-recruiter",
      ].includes(roleSlug),
      // Only admin / hr-admin may replace the recruiter pool on a job posting
      // (PUT /admin/job-postings/{id}/recruiters).
      canManageJobRecruiters: roleSlug === "admin" || roleSlug === "hr-admin",
      // Read-only listing of "jobs assigned to me" (GET /admin/hr/me/jobs).
      // Open to anyone in the HR/Careers area.
      canViewMyJobs: [
        "admin",
        "hr-admin",
        "senior-recruiter",
        "recruiter",
        "office-admin",
      ].includes(roleSlug),
      // Manual candidate create — same roles as the API docs
      // (HR Admin, Senior Recruiter, Recruiter, Office Admin + admin).
      canCreateApplications: [
        "admin",
        "hr-admin",
        "senior-recruiter",
        "recruiter",
        "office-admin",
      ].includes(roleSlug),
      // Can the user inspect another recruiter's profile/metrics?
      //   admin / hr-admin   → anyone
      //   senior-recruiter   → their own direct reports (filtered downstream)
      //   recruiter          → only themselves
      canViewSubordinates: ["admin", "hr-admin", "senior-recruiter"].includes(
        roleSlug,
      ),
    }),
    [roleSlug],
  );

  const jobView = useViewModal<JobPosting>();
  const [loadingJobDetail, setLoadingJobDetail] = useState(false);

  const openJobView = async (id: string) => {
    setLoadingJobDetail(true);
    try {
      const response = await dal.getAdminJobPostingById(id);
      const job = response?.data?.job;
      if (job) jobView.open(job);
    } catch (err) {
      setError(extractApiError(err, "Failed to load job posting."));
    } finally {
      setLoadingJobDetail(false);
    }
  };

  const refreshSelectedJob = async () => {
    if (!jobView.selected) return;
    try {
      const response = await dal.getAdminJobPostingById(jobView.selected.id);
      const job = response?.data?.job;
      if (job) jobView.setSelected(job);
    } catch {
      /* swallow; the list refresh will pick up the change */
    }
  };

  const loadLookups = useCallback(async () => {
    const [
      statusRes,
      departmentsRes,
      employmentTypesRes,
      teamsRes,
      pipelineRes,
    ] = await Promise.all([
      dal.getJobPostingStatuses().catch(() => []),
      dal.getDepartments().catch(() => []),
      dal.getEmploymentTypes().catch(() => []),
      dal.getTeams().catch(() => []),
      dal.getApplicationPipeline().catch(() => []),
    ]);

    setStatuses(statusRes);
    setDepartments(departmentsRes);
    setEmploymentTypes(employmentTypesRes);
    setTeams(teamsRes);
    setApplicationPipeline(pipelineRes);
  }, []);

  const loadJobs = useCallback(async () => {
    if (!permissions.canManageJobs) return;
    const response = await dal.getAdminJobPostings(jobFilters);
    setJobs(response?.data?.jobs ?? []);
    setJobsPagination(response?.data?.pagination ?? initialJobsPagination);
  }, [permissions.canManageJobs, jobFilters]);

  const loadHrUsers = useCallback(async () => {
    // Anyone in the careers area benefits from the directory: it's used
    // as a manager dropdown source and as the assignee picker.
    try {
      const response = await dal.getAdminHrUsers();
      setHrUsers(response?.data?.users ?? []);
    } catch {
      // Non-admins may be 403'd — that's fine, just leave the list empty.
      setHrUsers([]);
    }
  }, []);

  const loadMyWork = useCallback(async () => {
    if (!permissions.canViewMyWork) return;
    const [jobsRes, applicationsRes] = await Promise.all([
      dal.getAdminHrMyJobs().catch(() => ({ data: { jobs: [] } })),
      dal
        .getAdminHrMyApplications()
        .catch(() => ({ data: { applications: [] } })),
    ]);
    setMyJobs(jobsRes?.data?.jobs ?? []);
    setMyApplications(applicationsRes?.data?.applications ?? []);
  }, [permissions.canViewMyWork]);

  const loadApplications = useCallback(async () => {
    if (!permissions.canViewTeamApplications) return;
    try {
      const response = await dal.getAdminHrApplications(applicationFilters);
      setApplications(response?.data?.applications ?? []);
    } catch (err) {
      setError(extractApiError(err, "Failed to load applications."));
    }
  }, [permissions.canViewTeamApplications, applicationFilters]);

  const loadAll = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      await loadLookups();
      await Promise.all([
        loadJobs(),
        loadHrUsers(),
        loadMyWork(),
        loadApplications(),
      ]);
    } catch (err) {
      setError(extractApiError(err, "Failed to load careers data."));
    } finally {
      setLoading(false);
    }
  }, [loadJobs, loadHrUsers, loadLookups, loadMyWork, loadApplications]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadJobs(),
        loadHrUsers(),
        loadMyWork(),
        loadApplications(),
      ]);
    } catch (err) {
      setError(extractApiError(err, "Refresh failed."));
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeleteJob = async (id: string) => {
    if (!confirm("Delete this job posting?")) return;
    try {
      await dal.deleteAdminJobPosting(id);
      await loadJobs();
    } catch (err) {
      setError(extractApiError(err, "Failed to delete job posting."));
    }
  };

  const handlePatchApplication = async (applicationId: string) => {
    const payload = applicationPatchMap[applicationId];
    if (
      !payload ||
      (!payload.phase_id &&
        !payload.pipeline_phase &&
        !payload.status_id &&
        !payload.assigned_to_user_id &&
        !payload.assignment_source)
    ) {
      setError("Add at least one application field before saving.");
      return;
    }
    try {
      await dal.updateAdminHrApplication(applicationId, payload, {
        pipeline: applicationPipeline,
      });
      setApplicationPatchMap((prev) => {
        const copy = { ...prev };
        delete copy[applicationId];
        return copy;
      });
      await Promise.all([loadMyWork(), loadApplications()]);
    } catch (err) {
      setError(extractApiError(err, "Failed to update application."));
    }
  };

  /** Load a single recruiter's assigned applications (for the profile modal). */
  const loadRecruiterApplications = async (
    userId: string,
  ): Promise<HrApplication[]> => {
    try {
      const response = await dal.getAdminHrApplications({
        assigned_to_user_id: userId,
      });
      return response?.data?.applications ?? [];
    } catch (err) {
      setError(extractApiError(err, "Failed to load recruiter profile."));
      return [];
    }
  };

  return {
    error,
    setError,
    loading,
    refreshing,
    permissions,
    jobs,
    jobFilters,
    setJobFilters,
    jobsPagination,
    searchInput,
    setSearchInput,
    hrUsers,
    myJobs,
    myApplications,
    applications,
    applicationFilters,
    setApplicationFilters,
    statuses,
    departments,
    employmentTypes,
    teams,
    applicationPipeline,
    applicationPatchMap,
    setApplicationPatchMap,
    handleRefresh,
    handleDeleteJob,
    handlePatchApplication,
    loadJobs,
    loadHrUsers,
    loadMyWork,
    loadApplications,
    loadRecruiterApplications,
    jobView,
    loadingJobDetail,
    openJobView,
    refreshSelectedJob,
  };
}
