"use client";

import Link from "next/link";
import { KeyRound, UserCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/Components/ui";

export function AccountSettingsView() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 sm:px-0">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Account settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile and security preferences.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserCircle className="h-5 w-5" />
            Profile
          </CardTitle>
          <CardDescription>Signed-in CMS user</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p className="font-medium text-foreground">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-muted-foreground">{user?.email}</p>
          {/* <p className="text-muted-foreground">{user?.roleName}</p> */}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <KeyRound className="h-5 w-5" />
            Security
          </CardTitle>
          <CardDescription>
            Update your password without administrator help.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/dashboard/account/change-password"
            className="inline-flex h-10 items-center rounded-md border border-border-color bg-card-background px-4 text-sm font-medium text-foreground shadow-sm hover:bg-muted-background"
          >
            Change password
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
