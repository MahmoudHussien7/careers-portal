import type { HrDirectoryUser, HrRoleSlug } from "@/types/careers";
import type { HrApplication } from "@/types/careers";

export {
  applicationPhaseId,
  applicationPhaseLabel,
  applicationPhaseRecord,
  applicationStatusLabel,
  findPipelinePhase,
  phaseIdFromSlug,
  phaseSlugFromId,
  pipelinePhaseItems,
  pipelineStatusFilterItems,
  sortedPipeline,
  statusesForApplication,
  statusesForPhaseId,
  statusLabelFromPipeline,
  toApiApplicationPatch,
} from "@/lib/careers/applicationPipeline";

function personDisplayName(
  firstName?: string | null,
  lastName?: string | null,
  email?: string | null,
): string | null {
  const composed = [firstName, lastName]
    .filter((part) => typeof part === "string" && part.trim().length > 0)
    .join(" ")
    .trim();
  if (composed) return composed;
  if (email?.trim()) return email.trim();
  return null;
}

const ASSIGNABLE_ROLES: HrRoleSlug[] = [
  "hr-admin",
  "senior-recruiter",
  "recruiter",
  "office-admin",
];

/** HR users eligible to own an application, plus the current assignee if missing. */
export function assigneeOptionsForApplication(
  hrUsers: HrDirectoryUser[],
  application: HrApplication | null | undefined,
): HrDirectoryUser[] {
  const byId = new Map<string, HrDirectoryUser>();

  for (const user of hrUsers) {
    if (ASSIGNABLE_ROLES.includes(user.role_slug as HrRoleSlug)) {
      byId.set(user.id, user);
    }
  }

  const currentId = application?.assigned_to_user_id;
  if (currentId && !byId.has(currentId)) {
    const embedded = application?.assigned_to_user;
    if (embedded?.id === currentId) {
      byId.set(currentId, {
        id: embedded.id,
        email: embedded.email,
        first_name: embedded.first_name,
        last_name: embedded.last_name,
        role_slug: "",
        role_name: "Current assignee",
      });
    } else {
      const fromDirectory = hrUsers.find((user) => user.id === currentId);
      if (fromDirectory) {
        byId.set(currentId, fromDirectory);
      }
    }
  }

  return Array.from(byId.values()).sort((a, b) =>
    `${a.first_name} ${a.last_name}`.localeCompare(
      `${b.first_name} ${a.last_name}`,
    ),
  );
}

export function applicationAssigneeLabel(
  application: HrApplication,
  hrUsers: HrDirectoryUser[],
): string | null {
  const embedded = application.assigned_to_user;
  if (embedded) {
    const name = personDisplayName(
      embedded.first_name,
      embedded.last_name,
      embedded.email,
    );
    if (name) return name;
  }

  const userId = application.assigned_to_user_id;
  if (!userId) return null;

  const fromDirectory = hrUsers.find((user) => user.id === userId);
  if (fromDirectory) {
    return personDisplayName(
      fromDirectory.first_name,
      fromDirectory.last_name,
      fromDirectory.email,
    );
  }

  return null;
}
