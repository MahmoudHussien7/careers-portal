"use client";

import { useEffect, useMemo, useState } from "react";
import * as dal from "@/lib/dal";
import { extractApiError } from "@/lib/utils";
import { passwordPolicyRules } from "@/lib/schemas/changePassword";
import type { PasswordPolicy } from "@/types/auth";

export function useChangePasswordPolicy() {
  const [policy, setPolicy] = useState<PasswordPolicy | null>(null);
  const [loadingPolicy, setLoadingPolicy] = useState(true);
  const [policyError, setPolicyError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingPolicy(true);
    setPolicyError(null);
    dal
      .getPasswordPolicy()
      .then((loaded) => {
        if (!cancelled) setPolicy(loaded);
      })
      .catch((err) => {
        if (!cancelled) {
          setPolicyError(
            extractApiError(err, "Failed to load password policy."),
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingPolicy(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const policyRules = useMemo(
    () => (policy ? passwordPolicyRules(policy) : []),
    [policy],
  );

  return { policy, policyRules, loadingPolicy, policyError };
}
