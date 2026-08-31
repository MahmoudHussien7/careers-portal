"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ErrorBanner } from "@/Components/organisms/ErrorBanner";
import { LoadingSection } from "@/Components/organisms/LoadingSection";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/Components/ui";
import { ChangePasswordFields } from "./ChangePasswordFields";
import { useChangePasswordPolicy } from "./useChangePasswordForm";

export function ChangePasswordForm() {
  const { policy, policyRules, loadingPolicy, policyError } =
    useChangePasswordPolicy();

  return (
    <div className="mx-auto max-w-lg space-y-4 px-4 sm:px-0">
      <Link
        href="/dashboard/account"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to account settings
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
          <CardDescription>
            Enter your current password, then choose a new one. You will stay
            signed in on this device; other sessions are ended for security.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingPolicy ? (
            <LoadingSection />
          ) : policyError ? (
            <ErrorBanner message={policyError} />
          ) : policy ? (
            <ChangePasswordFields policy={policy} policyRules={policyRules} />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
