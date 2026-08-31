import { STAGE_ORDER, phaseStage, type PipelineStage } from "./pipeline";

const ROW_ACCENT: Record<PipelineStage, string> = {
  received: "bg-gi-secondary",
  filtration: "bg-amber-500",
  screening: "bg-gi-primary",
  interview: "bg-emerald-600",
  decided: "bg-muted-foreground/50",
};

const STAGE_PROGRESS: Record<PipelineStage, number> = {
  received: 12,
  filtration: 35,
  screening: 62,
  interview: 88,
  decided: 100,
};

const PROGRESS_BAR: Record<PipelineStage, string> = {
  received: "bg-gi-secondary",
  filtration: "bg-amber-500",
  screening: "bg-gi-primary",
  interview: "bg-emerald-600",
  decided: "bg-muted-foreground",
};

export function candidateRowAccent(
  pipelinePhase: string | null | undefined,
): string {
  return ROW_ACCENT[phaseStage(pipelinePhase)];
}

export function pipelineProgressPercent(
  pipelinePhase: string | null | undefined,
): number {
  return STAGE_PROGRESS[phaseStage(pipelinePhase)];
}

export function pipelineProgressBarClass(
  pipelinePhase: string | null | undefined,
): string {
  return PROGRESS_BAR[phaseStage(pipelinePhase)];
}

export function pipelineStageDisplayLabel(stage: PipelineStage): string {
  const labels: Record<PipelineStage, string> = {
    received: "Application",
    filtration: "Filtration",
    screening: "Screening",
    interview: "Interview",
    decided: "Decided",
  };
  return labels[stage];
}

export function personInitials(name: string | null | undefined): string {
  if (!name?.trim()) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** Status chip tones mapped loosely from status label keywords. */
export function applicationStatusBadgeClasses(
  statusLabel: string,
): string {
  const label = statusLabel.toLowerCase();
  if (
    label.includes("new") ||
    label.includes("received") ||
    label.includes("pending")
  ) {
    return "border border-amber-200 bg-amber-50 text-amber-800";
  }
  if (
    label.includes("screen") ||
    label.includes("pass") ||
    label.includes("accept") ||
    label.includes("hire")
  ) {
    return "border border-gi-primary/20 bg-gi-primary/10 text-gi-primary";
  }
  if (label.includes("reject") || label.includes("declin")) {
    return "border border-red-200 bg-red-50 text-red-800";
  }
  if (label.includes("review") || label.includes("shortlist")) {
    return "border border-sky-200 bg-sky-50 text-sky-800";
  }
  return "border border-border-color bg-muted-background text-muted-foreground";
}

export { STAGE_ORDER };
