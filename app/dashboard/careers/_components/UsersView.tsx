"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, UserCircle } from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/Components/ui";
import { Button } from "@/Components/atoms/Button";
import { TextInput } from "@/Components/atoms/TextInput";
import { ErrorBanner } from "@/Components/organisms/ErrorBanner";
import { LoadingSection } from "@/Components/organisms/LoadingSection";
import { EmptyState } from "@/Components/organisms/EmptyState";
import { HR_ROLE_OPTIONS } from "@/types/careers";
import { useCareersStore } from "./CareersDataProvider";

const ALL = "__all__";

export function UsersView() {
  const { careers, hrUserForm } = useCareersStore();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>(ALL);

  const visibleUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return careers.hrUsers.filter((user) => {
      if (roleFilter !== ALL && user.role_slug !== roleFilter) return false;
      if (!term) return true;
      const haystack = [
        user.first_name,
        user.last_name,
        user.email,
        user.phone,
        user.role_slug,
        user.role_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [careers.hrUsers, search, roleFilter]);

  if (careers.loading) return <LoadingSection />;

  return (
    <div className="space-y-4">
      <ErrorBanner
        message={careers.error}
        onDismiss={() => careers.setError(null)}
      />

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle>HR users</CardTitle>
            <CardDescription>
              {careers.hrUsers.length} people across the HR hierarchy.
            </CardDescription>
          </div>
          {careers.permissions.canManageHrDirectory && (
            <Button onClick={hrUserForm.open}>
              <Plus className="mr-2 h-4 w-4" />
              Add HR user
            </Button>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <TextInput
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, email, phone…"
                className="h-9 max-w-xs pl-8"
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger size="sm" className="w-[200px]">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All roles</SelectItem>
                {HR_ROLE_OPTIONS.map((role) => (
                  <SelectItem key={role.slug} value={role.slug}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {visibleUsers.length === 0 ? (
            <EmptyState message="No HR users match the current filters." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleUsers.map((user) => {
                  const isRecruiter =
                    user.role_slug === "recruiter" ||
                    user.role_slug === "senior-recruiter";
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted-background text-xs font-medium text-gi-primary">
                            {(user.first_name?.[0] ?? "") +
                              (user.last_name?.[0] ?? "")}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {user.first_name} {user.last_name}
                            </p>
                            {user.is_active === false && (
                              <Badge variant="destructive" className="mt-0.5">
                                Inactive
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-card-foreground">
                        {user.email}
                      </TableCell>
                      <TableCell className="text-sm text-card-foreground">
                        {user.phone ?? (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {user.role_name ?? user.role_slug}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-card-foreground">
                        {user.manager ? (
                          `${user.manager.first_name} ${user.manager.last_name}`
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {isRecruiter ? (
                          <Link
                            href={`/dashboard/careers/profiles/${user.id}`}
                            className="inline-flex h-8 items-center rounded-md px-3 text-sm text-card-foreground hover:bg-muted-background"
                          >
                            <UserCircle className="mr-1 h-3.5 w-3.5" />
                            Profile
                          </Link>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
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
