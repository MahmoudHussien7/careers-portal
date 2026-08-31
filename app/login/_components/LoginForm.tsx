"use client";

import { Button } from "@/Components/atoms/Button";
import { useLoginForm } from "./useLoginForm";

interface LoginFormProps {
  onLoading: () => React.ReactNode;
}

export function LoginForm({ onLoading }: LoginFormProps) {
  const { form, onSubmit, error, isSubmitting, loading, isAuthenticated } =
    useLoginForm();

  if (loading) return onLoading();
  if (isAuthenticated) return null;

  const {
    register,
    formState: { errors },
  } = form;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
            Sign in to Careers Portal
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Enter your credentials to access the HR dashboard
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={onSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                {...register("email")}
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-border-color placeholder-muted-foreground text-foreground rounded-t-md focus:outline-none focus:ring-gi-primary focus:border-gi-primary focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                {...register("password")}
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-border-color placeholder-muted-foreground text-foreground rounded-b-md focus:outline-none focus:ring-gi-primary focus:border-gi-primary focus:z-10 sm:text-sm"
                placeholder="Password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting} fullWidth>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
