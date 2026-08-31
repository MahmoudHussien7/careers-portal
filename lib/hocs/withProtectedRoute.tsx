"use client";

import { ComponentType } from "react";
import { ProtectedRoute } from "@/Components/ProtectedRoute";
import type { UserRole } from "@/types/auth";

interface WithProtectedRouteOptions {
  allowedRoles?: UserRole[];
  requiredPermission?: string;
}

/**
 * Higher-order component that wraps any page component with the
 * authentication / RBAC guard.
 *
 * @example
 *   export default withProtectedRoute(BlogsContent, {
 *     allowedRoles: ["admin", "marketing"],
 *   });
 */
export function withProtectedRoute<P extends object>(
  Component: ComponentType<P>,
  options: WithProtectedRouteOptions = {},
) {
  const Wrapped = (props: P) => (
    <ProtectedRoute
      allowedRoles={options.allowedRoles}
      requiredPermission={options.requiredPermission}
    >
      <Component {...props} />
    </ProtectedRoute>
  );

  Wrapped.displayName = `withProtectedRoute(${Component.displayName ?? Component.name ?? "Component"})`;

  return Wrapped;
}
