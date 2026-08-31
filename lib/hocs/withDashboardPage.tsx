"use client";

import { ComponentType } from "react";
import { DashboardLayout } from "@/Components/DashboardLayout";
import { ProtectedRoute } from "@/Components/ProtectedRoute";
import type { UserRole } from "@/types/auth";

interface WithDashboardPageOptions {
  allowedRoles?: UserRole[];
  requiredPermission?: string;
}

/**
 * Higher-order component that wires the most common dashboard
 * page shell:
 *   <ProtectedRoute><DashboardLayout>{children}</DashboardLayout></ProtectedRoute>
 *
 * Page modules become a one-liner:
 *
 *   export default withDashboardPage(BlogsContent);
 */
export function withDashboardPage<P extends object>(
  Component: ComponentType<P>,
  options: WithDashboardPageOptions = {},
) {
  const Wrapped = (props: P) => (
    <ProtectedRoute
      allowedRoles={options.allowedRoles}
      requiredPermission={options.requiredPermission}
    >
      <DashboardLayout>
        <Component {...props} />
      </DashboardLayout>
    </ProtectedRoute>
  );

  Wrapped.displayName = `withDashboardPage(${Component.displayName ?? Component.name ?? "Component"})`;

  return Wrapped;
}
