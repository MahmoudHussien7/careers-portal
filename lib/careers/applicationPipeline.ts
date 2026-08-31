import type { LookupItem } from "@/lib/dal";
import type {
  ApplicationPipelinePhase,
  HrApplication,
  UpdateHrApplicationPayload,
} from "@/types/careers";

export type PipelineStatus = ApplicationPipelinePhase["statuses"][number];

function sortByOrder<T extends { display_order?: number; name: string }>(
  items: T[],
): T[] {
  return [...items].sort((a, b) => {
    const orderA = a.display_order ?? 0;
    const orderB = b.display_order ?? 0;
    if (orderA !== orderB) return orderA - orderB;
    return a.name.localeCompare(b.name);
  });
}

export function sortedPipeline(
  pipeline: ApplicationPipelinePhase[],
): ApplicationPipelinePhase[] {
  return sortByOrder(pipeline).map((phase) => ({
    ...phase,
    statuses: sortByOrder(phase.statuses),
  }));
}

/** Phase rows for `<Select>` / `ApplicationLookupSelect`. */
export function pipelinePhaseItems(
  pipeline: ApplicationPipelinePhase[],
): LookupItem[] {
  return sortedPipeline(pipeline).map((phase) => ({
    id: phase.id,
    name: phase.name,
    slug: phase.slug,
  }));
}

export function findPipelinePhase(
  pipeline: ApplicationPipelinePhase[],
  opts: { id?: string | null; slug?: string | null },
): ApplicationPipelinePhase | undefined {
  if (opts.id) {
    const byId = pipeline.find((phase) => phase.id === opts.id);
    if (byId) return byId;
  }
  if (opts.slug) {
    return pipeline.find((phase) => phase.slug === opts.slug);
  }
  return undefined;
}

export function phaseIdFromSlug(
  pipeline: ApplicationPipelinePhase[],
  slug: string | null | undefined,
): string | undefined {
  return findPipelinePhase(pipeline, { slug })?.id;
}

export function phaseSlugFromId(
  pipeline: ApplicationPipelinePhase[],
  phaseId: string | null | undefined,
): string | undefined {
  return findPipelinePhase(pipeline, { id: phaseId })?.slug;
}

export function applicationPhaseId(
  application: HrApplication,
  pipeline: ApplicationPipelinePhase[],
): string | undefined {
  if (application.phase_id) {
    return findPipelinePhase(pipeline, { id: application.phase_id })?.id;
  }
  return phaseIdFromSlug(pipeline, application.pipeline_phase);
}

export function applicationPhaseRecord(
  application: HrApplication,
  pipeline: ApplicationPipelinePhase[],
): ApplicationPipelinePhase | undefined {
  return findPipelinePhase(pipeline, {
    id: application.phase_id ?? applicationPhaseId(application, pipeline),
    slug: application.pipeline_phase,
  });
}

/** Statuses allowed for a given phase id (from `application_pipeline`). */
export function statusesForPhaseId(
  phaseId: string | null | undefined,
  pipeline: ApplicationPipelinePhase[],
): LookupItem[] {
  const phase = findPipelinePhase(pipeline, { id: phaseId });
  if (!phase?.statuses?.length) return [];
  return phase.statuses.map((status) => ({
    id: status.id,
    name: status.name,
    slug: status.slug,
  }));
}

/** Statuses valid for PATCH on this application (scoped to its current phase). */
export function statusesForApplication(
  application: HrApplication,
  pipeline: ApplicationPipelinePhase[],
): LookupItem[] {
  const phaseId = applicationPhaseId(application, pipeline);
  return statusesForPhaseId(phaseId, pipeline);
}

/**
 * Flatten all statuses across phases (for list filters).
 * When a phase filter is active, only that phase's statuses are returned.
 */
export function pipelineStatusFilterItems(
  pipeline: ApplicationPipelinePhase[],
  phaseFilter?: { id?: string; slug?: string },
): LookupItem[] {
  if (phaseFilter?.id || phaseFilter?.slug) {
    const phase = findPipelinePhase(pipeline, phaseFilter);
    return (
      phase?.statuses.map((status) => ({
        id: status.id,
        name: status.name,
        slug: status.slug,
      })) ?? []
    );
  }

  const byId = new Map<string, LookupItem>();
  for (const phase of sortedPipeline(pipeline)) {
    for (const status of phase.statuses) {
      byId.set(status.id, {
        id: status.id,
        name: `${status.name} (${phase.name})`,
        slug: status.slug,
      });
    }
  }
  return Array.from(byId.values());
}

export function statusLabelFromPipeline(
  pipeline: ApplicationPipelinePhase[],
  statusId: string | null | undefined,
): string | null {
  if (!statusId) return null;
  for (const phase of pipeline) {
    const status = phase.statuses.find((row) => row.id === statusId);
    if (status) return status.name;
  }
  return null;
}

export function applicationPhaseLabel(
  application: HrApplication,
  pipeline: ApplicationPipelinePhase[],
): string {
  const phase = applicationPhaseRecord(application, pipeline);
  if (phase) return phase.name;
  return application.pipeline_phase ?? "—";
}

export function applicationStatusLabel(
  application: HrApplication,
  pipeline: ApplicationPipelinePhase[],
): string {
  return (
    application.application_status?.name ??
    statusLabelFromPipeline(pipeline, application.status_id) ??
    "—"
  );
}

/**
 * Maps the CMS payload to the backend PATCH body (`phase_id`, not slug).
 */
export function toApiApplicationPatch(
  payload: UpdateHrApplicationPayload,
  pipeline: ApplicationPipelinePhase[],
): Record<string, unknown> {
  const body: Record<string, unknown> = {};

  if (payload.assigned_to_user_id !== undefined) {
    body.assigned_to_user_id = payload.assigned_to_user_id;
  }

  if (payload.status_id !== undefined && payload.status_id !== "") {
    body.status_id = payload.status_id;
  }

  if (payload.assignment_source !== undefined) {
    body.assignment_source = payload.assignment_source || null;
  }

  if (payload.phase_id !== undefined) {
    body.phase_id = payload.phase_id;
  } else if (payload.pipeline_phase) {
    const phaseId = phaseIdFromSlug(pipeline, payload.pipeline_phase);
    if (phaseId) body.phase_id = phaseId;
  }

  return body;
}
