"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  Users as UsersIcon,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/Components/ui";
import { ErrorBanner } from "@/Components/organisms/ErrorBanner";
import { LoadingSection } from "@/Components/organisms/LoadingSection";
import { EmptyState } from "@/Components/organisms/EmptyState";
import type {
  HrApplication,
  HrDirectoryUser,
  JobPosting,
} from "@/types/careers";
import { useCareersStore } from "./CareersDataProvider";
import { PhaseBadge } from "./PhaseBadge";
import { candidateFullName } from "./candidateHelpers";
import { phaseOutcome } from "./pipeline";
import { CandidateOutcomePie } from "./charts/CandidateOutcomePie";
import { PipelineStageBars } from "./charts/PipelineStageBars";
import { RecruiterProfileEditCard } from "./RecruiterProfileEditCard";
import { RecruiterJobAssignmentsCard } from "./RecruiterJobAssignmentsCard";

const EDITABLE_RECRUITER_ROLES = ["recruiter", "senior-recruiter"] as const;

interface Props {
  recruiterId: string;
}

/**
 * Full-page dashboard for one recruiter / senior-recruiter:
 * KPIs, pipeline charts, jobs they're assigned to, candidates they own.
 *
 * Access rules (mirrors backend role scope):
 *   admin / hr-admin → anyone
 *   senior-recruiter → self + direct reports (manager_id === self.id)
 *   recruiter        → self only
 */
export function ProfileDetailView({ recruiterId }: Props) {
  const { careers, candidate } = useCareersStore();
  const { user } = useAuth();

  const [applications, setApplications] = useState<HrApplication[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);

  const recruiter = useMemo<HrDirectoryUser | null>(
    () => careers.hrUsers.find((person) => person.id === recruiterId) ?? null,
    [careers.hrUsers, recruiterId],
  );

  // Permission gate. We compute it from the loaded HR directory + the
  // viewer's role, so it works regardless of where the user landed from.
  const viewerRole = user?.roleSlug;
  const viewerId = user?.id;
  const canEditProfile = useMemo(() => {
    if (!recruiter) return false;
    if (!careers.permissions.canManageHrDirectory) return false;
    return EDITABLE_RECRUITER_ROLES.includes(
      recruiter.role_slug as (typeof EDITABLE_RECRUITER_ROLES)[number],
    );
  }, [recruiter, careers.permissions.canManageHrDirectory]);

  const canViewThisProfile = useMemo(() => {
    if (!viewerRole) return false;
    if (viewerRole === "admin" || viewerRole === "hr-admin") return true;
    if (viewerId === recruiterId) return true;
    if (viewerRole === "senior-recruiter") {
      return recruiter?.manager_id === viewerId;
    }
    return false;
  }, [viewerRole, viewerId, recruiter, recruiterId]);

  useEffect(() => {
    if (!canViewThisProfile) {
      setLoadingApps(false);
      return;
    }
    let cancelled = false;
    setLoadingApps(true);
    careers
      .loadRecruiterApplications(recruiterId)
      .then((items) => {
        if (!cancelled) setApplications(items);
      })
      .finally(() => {
        if (!cancelled) setLoadingApps(false);
      });
    return () => {
      cancelled = true;
    };
    // We deliberately depend on the recruiter id + gate; the loader fn
    // is recreated on each render but stable enough for this one-shot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recruiterId, canViewThisProfile]);

  // Jobs where this person is in the recruiter pool.
  const recruiterJobs = useMemo<JobPosting[]>(
    () =>
      careers.jobs.filter((job) =>
        job.assigned_users?.some((u) => u.id === recruiterId),
      ),
    [careers.jobs, recruiterId],
  );

  // Senior recruiter? Surface their direct reports.
  const directReports = useMemo<HrDirectoryUser[]>(() => {
    if (!recruiter) return [];
    if (recruiter.role_slug !== "senior-recruiter") return [];
    return careers.hrUsers.filter(
      (person) => person.manager_id === recruiter.id,
    );
  }, [careers.hrUsers, recruiter]);

  const kpis = useMemo(() => {
    let accepted = 0;
    let rejected = 0;
    let inPipeline = 0;
    for (const application of applications) {
      const outcome = phaseOutcome(application.pipeline_phase);
      if (outcome === "accepted") accepted += 1;
      else if (outcome === "rejected") rejected += 1;
      else inPipeline += 1;
    }
    return { accepted, rejected, inPipeline };
  }, [applications]);

  if (careers.loading) return <LoadingSection />;

  if (!recruiter) {
    return (
      <div className="space-y-4">
        <BackLink />
        <EmptyState message="Recruiter not found in your directory." />
      </div>
    );
  }

  if (!canViewThisProfile) {
    return (
      <div className="space-y-4">
        <BackLink />
        <EmptyState message="You do not have access to this recruiter's profile." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackLink />

      <ErrorBanner
        message={careers.error}
        onDismiss={() => careers.setError(null)}
      />

      {/* Identity card */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 py-6">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-muted-background text-lg font-semibold text-gi-primary">
            {(recruiter.first_name?.[0] ?? "") +
              (recruiter.last_name?.[0] ?? "")}
          </span>
          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-foreground">
              {recruiter.first_name} {recruiter.last_name}
            </h2>
            {recruiter.title && (
              <p className="text-sm font-medium text-gi-primary">
                {recruiter.title}
              </p>
            )}
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <Badge variant="secondary">
                {recruiter.role_name ?? recruiter.role_slug}
              </Badge>
              {recruiter.is_active === false ? (
                <Badge variant="destructive">Inactive</Badge>
              ) : (
                <Badge className="border border-gi-primary/20 bg-gi-primary/10 text-gi-primary">
                  Active
                </Badge>
              )}
              <span className="inline-flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" /> {recruiter.email}
              </span>
              {recruiter.phone && (
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" /> {recruiter.phone}
                </span>
              )}
              {recruiter.address && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {recruiter.address}
                </span>
              )}
            </div>
            {recruiter.manager && (
              <p className="mt-1 text-xs text-muted-foreground">
                Reports to {recruiter.manager.first_name}{" "}
                {recruiter.manager.last_name}
                {recruiter.manager.role_slug
                  ? ` · ${recruiter.manager.role_slug}`
                  : ""}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {canEditProfile && (
        <>
          <RecruiterProfileEditCard
            recruiter={recruiter}
            hrUsers={careers.hrUsers}
            onSaved={() => void careers.loadHrUsers()}
            onError={careers.setError}
          />
          {careers.permissions.canManageJobRecruiters && (
            <RecruiterJobAssignmentsCard
              recruiterId={recruiter.id}
              recruiterName={recruiter.first_name}
              jobs={careers.jobs}
              onSaved={async () => {
                await careers.loadJobs();
              }}
              onError={careers.setError}
            />
          )}
        </>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={<UsersIcon className="h-4 w-4 text-gi-primary" />}
          label="Total candidates"
          value={applications.length}
        />
        <KpiCard
          icon={<CheckCircle2 className="h-4 w-4 text-green-700" />}
          label="Accepted"
          value={kpis.accepted}
        />
        <KpiCard
          icon={<XCircle className="h-4 w-4 text-red-700" />}
          label="Rejected"
          value={kpis.rejected}
        />
        <KpiCard
          icon={<Briefcase className="h-4 w-4 text-gi-primary" />}
          label="Open jobs"
          value={recruiterJobs.length}
          hint="Jobs assigned to this recruiter"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PipelineStageBars applications={applications} />
        </div>
        <CandidateOutcomePie applications={applications} />
      </div>

      {/* Direct reports for senior recruiters */}
      {directReports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Direct reports</CardTitle>
            <CardDescription>
              Recruiters who report to {recruiter.first_name}. Click to drill
              in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {directReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/careers/profiles/${report.id}`}
                        className="text-sm font-medium text-foreground hover:text-gi-primary"
                      >
                        {report.first_name} {report.last_name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-card-foreground">
                      {report.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {report.role_name ?? report.role_slug}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Assigned jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Assigned jobs</CardTitle>
          <CardDescription>
            Roles where {recruiter.first_name} is in the recruiter pool.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recruiterJobs.length === 0 ? (
            <EmptyState message="Not in any job's recruiter pool yet." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Pool size</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recruiterJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => careers.openJobView(job.id)}
                        className="text-left text-sm font-medium text-foreground hover:text-gi-primary"
                      >
                        {job.title}
                      </button>
                    </TableCell>
                    <TableCell>
                      {job.status?.name ? (
                        <Badge variant="secondary">{job.status.name}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-card-foreground">
                      {job.location || (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {job.assigned_users?.length ?? 0}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Candidate list */}
      <Card>
        <CardHeader>
          <CardTitle>Assigned candidates</CardTitle>
          <CardDescription>
            Every application currently sitting with {recruiter.first_name}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingApps ? (
            <LoadingSection />
          ) : applications.length === 0 ? (
            <EmptyState message="No applications assigned to this person yet." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Phase</TableHead>
                  <TableHead className="text-right">Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => candidate.open(application)}
                        className="text-left text-sm font-medium text-foreground hover:text-gi-primary"
                      >
                        {candidateFullName(application)}
                      </button>
                      {application.email && (
                        <p className="text-xs text-muted-foreground">
                          {application.email}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-card-foreground">
                      {application.job_title ?? (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <PhaseBadge phase={application.pipeline_phase} />
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {application.created_at
                        ? new Date(application.created_at).toLocaleDateString()
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/dashboard/careers/profiles"
      className="inline-flex items-center gap-1 text-sm text-gi-primary hover:underline"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to profiles
    </Link>
  );
}

function KpiCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription className="flex items-center gap-2 text-card-foreground">
          {icon}
          {label}
        </CardDescription>
        <CardTitle className="text-3xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      {hint && (
        <CardContent>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </CardContent>
      )}
    </Card>
  );
}
