"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/lib/auth";
import { defaultLandingPath, extractApiError } from "@/lib/utils";
import { loginSchema, type LoginFormData } from "@/lib/schemas";

/**
 * Encapsulates the login screen's form, redirect-when-authenticated logic,
 * and submit handler. Keeps the page component purely presentational.
 */
export function useLoginForm() {
  const router = useRouter();
  const { login, isAuthenticated, loading, user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Once authenticated + user payload is loaded, route to the landing
  // path appropriate for the user's role (HR-only → /dashboard/careers).
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      router.push(defaultLandingPath(user.roleSlug));
    }
  }, [isAuthenticated, loading, user, router]);

  useEffect(() => {
    setError(null);
  }, []);

  const onSubmit = form.handleSubmit(async (data) => {
    setError(null);
    setIsSubmitting(true);
    try {
      await login(data.email, data.password);
      // The useEffect above will pick up the new auth state and route to
      // the right landing page — we don't push here so we don't race the
      // role check.
    } catch (err) {
      setError(
        extractApiError(err, "Login failed. Please check your credentials."),
      );
    } finally {
      setIsSubmitting(false);
    }
  });

  return {
    form,
    onSubmit,
    error,
    isSubmitting,
    loading,
    isAuthenticated,
  };
}
