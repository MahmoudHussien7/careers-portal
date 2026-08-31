"use client";

import { ReactNode } from "react";
import { withDashboardPage } from "@/lib/hocs";
import { careersAllowedRoles } from "./_components/careersForms";
import { CareersTabs } from "./_components/CareersTabs";
import { CareersDataProvider } from "./_components/CareersDataProvider";

function CareersShell({ children }: { children: ReactNode }) {
  return (
    <CareersDataProvider>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6 space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Careers Portal</h1>
          <p className="text-sm text-muted-foreground">
            HR directory, job postings, candidates, CVs and recruiter pool.
          </p>
        </div>
        <div className="mb-4">
          <CareersTabs />
        </div>
        {children}
      </div>
    </CareersDataProvider>
  );
}

export default withDashboardPage(CareersShell, {
  allowedRoles: careersAllowedRoles,
});
