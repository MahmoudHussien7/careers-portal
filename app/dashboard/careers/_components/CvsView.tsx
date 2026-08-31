"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download, FileText, Search } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/Components/ui";
import { TextInput } from "@/Components/atoms/TextInput";
import { ErrorBanner } from "@/Components/organisms/ErrorBanner";
import { LoadingSection } from "@/Components/organisms/LoadingSection";
import { EmptyState } from "@/Components/organisms/EmptyState";
import { useCareersStore } from "./CareersDataProvider";
import {
  candidateFullName,
  formatDateOnly,
  resolveCvUrl,
} from "./candidateHelpers";
import { PhaseBadge } from "./PhaseBadge";

const ALL = "__all__";

export function CvsView() {
  const { careers, candidate } = useCareersStore();
  const [search, setSearch] = useState("");
  const [jobFilter, setJobFilter] = useState<string>(ALL);

  // Use whichever scope this user has — team list if they have it, else myWork.
  const sourceApplications = careers.permissions.canViewTeamApplications
    ? careers.applications
    : careers.myApplications;

  const candidatesWithCv = useMemo(() => {
    const term = search.trim().toLowerCase();
    return sourceApplications
      .filter((application) => !!application.cv_url)
      .filter((application) => {
        if (jobFilter !== ALL && application.job_id !== jobFilter) return false;
        if (!term) return true;
        const haystack = [
          application.first_name,
          application.last_name,
          application.email,
          application.cv_url,
          application.job_title,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(term);
      });
  }, [sourceApplications, search, jobFilter]);

  if (careers.loading) return <LoadingSection />;

  return (
    <div className="space-y-4">
      <ErrorBanner
        message={careers.error}
        onDismiss={() => careers.setError(null)}
      />

      <Card>
        <CardHeader>
          <CardTitle>CVs on file</CardTitle>
          <CardDescription>
            Every candidate who attached a CV. Filenames missing a hosted URL
            are still listed so you can request the file from the recruiter.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <TextInput
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search candidate, email or filename…"
                className="h-9 max-w-xs pl-8"
              />
            </div>

            <Select value={jobFilter} onValueChange={setJobFilter}>
              <SelectTrigger size="sm" className="w-[220px]">
                <SelectValue placeholder="All jobs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All jobs</SelectItem>
                {careers.jobs.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {candidatesWithCv.length === 0 ? (
            <EmptyState message="No CVs match the current filters." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Phase</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidatesWithCv.map((application) => {
                  const url = resolveCvUrl(application);
                  return (
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
                      <TableCell>
                        <span className="inline-flex items-center gap-1 text-sm text-card-foreground">
                          <FileText className="h-4 w-4 text-gi-primary" />
                          {application.cv_filename ?? application.cv_url}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDateOnly(application.cv_uploaded_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        {url ? (
                          <Link
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-8 items-center rounded-md border border-border-color px-3 text-sm text-card-foreground shadow-sm hover:bg-muted-background"
                          >
                            <Download className="mr-1 h-3.5 w-3.5" />
                            Open
                          </Link>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Filename only
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
