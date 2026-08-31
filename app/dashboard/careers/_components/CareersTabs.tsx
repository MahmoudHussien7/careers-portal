"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  ClipboardList,
  LayoutDashboard,
  Users,
  UserCircle,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TabDef = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
};

const TABS: TabDef[] = [
  {
    href: "/dashboard/careers",
    label: "Overview",
    icon: LayoutDashboard,
    exact: true,
  },
  { href: "/dashboard/careers/jobs", label: "Jobs", icon: Briefcase },
  { href: "/dashboard/careers/candidates", label: "Candidates", icon: Users },
  { href: "/dashboard/careers/users", label: "Users", icon: UserCog },
  { href: "/dashboard/careers/forms", label: "Forms", icon: ClipboardList },
  { href: "/dashboard/careers/profiles", label: "Profiles", icon: UserCircle },
];

export function CareersTabs() {
  const pathname = usePathname();

  return (
    <nav
      role="navigation"
      aria-label="Careers sections"
      className="overflow-x-auto"
    >
      <ul className="inline-flex h-10 items-center gap-1 rounded-lg bg-muted-background p-1 text-muted-foreground">
        {TABS.map((tab) => {
          const active = tab.exact
            ? pathname === tab.href
            : pathname?.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                prefetch
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-md border border-transparent px-3 text-sm font-medium transition-colors",
                  active
                    ? "bg-card-background text-foreground shadow-sm"
                    : "hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
