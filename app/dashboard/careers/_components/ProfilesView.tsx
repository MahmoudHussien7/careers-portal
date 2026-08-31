"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Mail, Phone, Search, UserCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  Badge,
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
} from "@/Components/ui";
import { TextInput } from "@/Components/atoms/TextInput";
import { ErrorBanner } from "@/Components/organisms/ErrorBanner";
import { LoadingSection } from "@/Components/organisms/LoadingSection";
import { EmptyState } from "@/Components/organisms/EmptyState";
import { useCareersStore } from "./CareersDataProvider";

const ALL = "__all__";
const RECRUITER_ROLES = ["senior-recruiter", "recruiter"] as const;

export function ProfilesView() {
  const { careers } = useCareersStore();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>(ALL);

  const allApplications = careers.permissions.canViewTeamApplications
    ? careers.applications
    : careers.myApplications;

  const recruiters = useMemo(() => {
    const term = search.trim().toLowerCase();
    const role = user?.roleSlug;
    return (
      careers.hrUsers
        .filter((person) =>
          RECRUITER_ROLES.includes(
            person.role_slug as (typeof RECRUITER_ROLES)[number],
          ),
        )
        // Scope to what this viewer is allowed to see:
        //   admin / hr-admin → all recruiters
        //   senior-recruiter → direct reports + self
        //   recruiter        → only self
        .filter((person) => {
          if (role === "admin" || role === "hr-admin") return true;
          if (role === "senior-recruiter") {
            return person.id === user?.id || person.manager_id === user?.id;
          }
          if (role === "recruiter") return person.id === user?.id;
          return false;
        })
        .filter((person) => {
          if (roleFilter !== ALL && person.role_slug !== roleFilter)
            return false;
          if (!term) return true;
          const haystack = [person.first_name, person.last_name, person.email]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return haystack.includes(term);
        })
    );
  }, [careers.hrUsers, search, roleFilter, user]);

  const workloadByRecruiter = useMemo(() => {
    const map = new Map<string, number>();
    for (const application of allApplications) {
      const id = application.assigned_to_user_id;
      if (!id) continue;
      map.set(id, (map.get(id) ?? 0) + 1);
    }
    return map;
  }, [allApplications]);

  if (careers.loading) return <LoadingSection />;

  return (
    <div className="space-y-4">
      <ErrorBanner
        message={careers.error}
        onDismiss={() => careers.setError(null)}
      />

      <Card>
        <CardHeader>
          <CardTitle>Recruiter profiles</CardTitle>
          <CardDescription>
            Click a recruiter to inspect their assigned candidates and current
            workload.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <TextInput
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search recruiter…"
                className="h-9 max-w-xs pl-8"
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger size="sm" className="w-[200px]">
                <SelectValue placeholder="All recruiter roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All recruiter roles</SelectItem>
                <SelectItem value="senior-recruiter">
                  Senior Recruiter
                </SelectItem>
                <SelectItem value="recruiter">Recruiter</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {recruiters.length === 0 ? (
            <EmptyState message="No recruiter profiles match the filters." />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recruiters.map((recruiter) => {
                const workload = workloadByRecruiter.get(recruiter.id) ?? 0;
                return (
                  <Card
                    key={recruiter.id}
                    className="transition-shadow hover:shadow-md"
                  >
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted-background text-sm font-medium text-gi-primary">
                          {(recruiter.first_name?.[0] ?? "") +
                            (recruiter.last_name?.[0] ?? "")}
                        </span>
                        <div>
                          <CardTitle className="text-base">
                            {recruiter.first_name} {recruiter.last_name}
                          </CardTitle>
                          <CardDescription>
                            {recruiter.role_name ?? recruiter.role_slug}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-card-foreground">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        {recruiter.email}
                      </div>
                      {recruiter.phone && (
                        <div className="flex items-center gap-2 text-sm text-card-foreground">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          {recruiter.phone}
                        </div>
                      )}
                      <div className="flex items-center justify-between border-t border-border-color pt-3">
                        <div className="text-xs text-muted-foreground">
                          Active candidates
                        </div>
                        <Badge variant="secondary">{workload}</Badge>
                      </div>
                      <Link
                        href={`/dashboard/careers/profiles/${recruiter.id}`}
                        className="inline-flex h-9 w-full items-center justify-center rounded-md border border-border-color bg-card-background text-sm font-medium text-card-foreground shadow-sm hover:bg-muted-background"
                      >
                        <UserCircle className="mr-2 h-3.5 w-3.5" />
                        Open profile
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
