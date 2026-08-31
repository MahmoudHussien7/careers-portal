"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Briefcase,
  FileText,
  Users,
  UserCog,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/Components/ui";

interface KpiProps {
  title: string;
  value: number;
  description: string;
  href: string;
  icon: "jobs" | "candidates" | "users" | "cvs";
}

const ICONS = {
  jobs: Briefcase,
  candidates: Users,
  users: UserCog,
  cvs: FileText,
} as const;

function KpiCard({ title, value, description, href, icon }: KpiProps) {
  const Icon = ICONS[icon];
  return (
    <Card>
      <CardHeader>
        <CardDescription className="flex items-center gap-2 py-2 text-card-foreground">
          <Icon className="h-4 w-4 text-gi-primary" />
          {title}
        </CardDescription>
        <CardTitle className="text-3xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-xs font-medium text-gi-primary hover:underline"
        >
          {description}
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </CardContent>
    </Card>
  );
}

interface Props {
  jobs: number;
  candidates: number;
  users: number;
  cvs: number;
}

export function OverviewKpiCards({ jobs, candidates, users, cvs }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        title="Job postings"
        value={jobs}
        description="Manage jobs"
        href="/dashboard/careers/jobs"
        icon="jobs"
      />
      <KpiCard
        title="Candidates"
        value={candidates}
        description="Open pipeline"
        href="/dashboard/careers/candidates"
        icon="candidates"
      />
      <KpiCard
        title="CVs on file"
        value={cvs}
        description="Browse CVs"
        href="/dashboard/careers/cvs"
        icon="cvs"
      />
      <KpiCard
        title="HR users"
        value={users}
        description="Open directory"
        href="/dashboard/careers/users"
        icon="users"
      />
    </div>
  );
}
