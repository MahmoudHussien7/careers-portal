"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { UserRole } from "@/types/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requiredPermission?: string;
}

// Simple role check helper
const hasRole = (
  userRole: UserRole | null | undefined,
  allowedRoles: UserRole[],
): boolean => {
  if (!userRole) return false;
  // Admin always has full access.
  if (userRole === "admin") return true;
  return allowedRoles.includes(userRole);
};

export function ProtectedRoute({
  children,
  allowedRoles,
  requiredPermission,
}: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push("/login");
        return;
      }

      // Check role-based access
      if (allowedRoles && user && !hasRole(user.roleSlug, allowedRoles)) {
        router.push("/dashboard/careers");
        return;
      }

      // Check permission-based access
      if (
        requiredPermission &&
        user &&
        !user.permissions.includes(requiredPermission)
      ) {
        router.push("/dashboard/careers");
        return;
      }
    }
  }, [
    loading,
    isAuthenticated,
    user,
    allowedRoles,
    requiredPermission,
    router,
  ]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gi-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Check role-based access
  if (allowedRoles && user && !hasRole(user.roleSlug, allowedRoles)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Access Denied
          </h1>
          <p className="text-muted-foreground">
            You don't have the required role to access this page.
          </p>
        </div>
      </div>
    );
  }

  // Check permission-based access
  if (
    requiredPermission &&
    user &&
    !user.permissions.includes(requiredPermission)
  ) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Access Denied
          </h1>
          <p className="text-muted-foreground">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
