"use client";

import { useMemo } from "react";
import { RefreshCw } from "lucide-react";
import Link from "next/link";
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
import { Button } from "@/Components/atoms/Button";
import { useCareersStore } from "./CareersDataProvider";
import { OverviewKpiCards } from "./OverviewKpiCards";
import { CandidateOutcomePie } from "./charts/CandidateOutcomePie";
import { PipelineStageBars } from "./charts/PipelineStageBars";
import { UsersByRoleBars } from "./charts/UsersByRoleBars";
import { PhaseBadge } from "./PhaseBadge";
import { candidateFullName } from "./candidateHelpers";

export function OverviewView() {
  const { careers, candidate } = useCareersStore();

  const teamApplications = careers.applications;
  const myApplications = careers.myApplications;

  // Combine the application sources visible to this user so the charts
  // reflect everything they're scoped to see.
  const allApplications = useMemo(() => {
    const map = new Map<string, (typeof teamApplications)[number]>();
    for (const application of teamApplications)
      map.set(application.id, application);
    for (const application of myApplications) {
      if (!map.has(application.id)) map.set(application.id, application);
    }
    return Array.from(map.values());
  }, [teamApplications, myApplications]);

  const cvsCount = useMemo(
    () => allApplications.filter((application) => application.cv_url).length,
    [allApplications],
  );

  const recent = useMemo(
    () =>
      [...allApplications]
        .sort((a, b) => {
          const aDate = new Date(a.created_at ?? 0).getTime();
          const bDate = new Date(b.created_at ?? 0).getTime();
          return bDate - aDate;
        })
        .slice(0, 6),
    [allApplications],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Quick read on hiring health — KPIs, pipeline distribution and HR team
          shape.
        </p>
        <Button
          variant="secondary"
          size="sm"
          onClick={careers.handleRefresh}
          disabled={careers.refreshing}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${careers.refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <ErrorBanner
        message={careers.error}
        onDismiss={() => careers.setError(null)}
      />

      {careers.loading ? (
        <LoadingSection />
      ) : (
        <>
          <OverviewKpiCards
            jobs={careers.jobsPagination.total || careers.jobs.length}
            candidates={allApplications.length}
            users={careers.hrUsers.length}
            cvs={cvsCount}
          />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <PipelineStageBars applications={allApplications} />
            </div>
            <CandidateOutcomePie applications={allApplications} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <UsersByRoleBars hrUsers={careers.hrUsers} />

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Recent applications</CardTitle>
                <CardDescription>
                  The six most recent candidates across the pipeline you can
                  see.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recent.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No applications yet.
                  </p>
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
                      {recent.map((application) => (
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
                              ? new Date(
                                  application.created_at,
                                ).toLocaleDateString()
                              : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
              <CardContent className="pt-0">
                <Link
                  href="/dashboard/careers/candidates"
                  className="inline-flex items-center text-sm font-medium text-gi-primary hover:underline"
                >
                  View all candidates →
                </Link>
              </CardContent>
            </Card>
          </div>

          {!careers.permissions.canManageJobs &&
            !careers.permissions.canViewMyWork &&
            !careers.permissions.canViewTeamApplications && (
              <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  Your role does not have permissions for hiring actions.
                </CardContent>
              </Card>
            )}

          {!careers.permissions.canViewTeamApplications &&
            careers.permissions.canViewMyWork && (
              <Card>
                <CardHeader>
                  <CardTitle>Your assigned work</CardTitle>
                  <CardDescription>
                    You see only candidates and jobs assigned to you. Open the
                    Candidates tab to drive them forward.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 text-sm">
                    <Badge variant="secondary">
                      {careers.myApplications.length} candidates
                    </Badge>
                    <Badge variant="secondary">
                      {careers.myJobs.length} jobs
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
        </>
      )}
    </div>
  );
}
