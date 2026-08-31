/**
 * Recruitment pipeline state machine.
 *
 * Flow:
 *   received
 *   ├─ filtration_rejected     (terminal)
 *   ├─ filtration_shortlisted  (terminal — held for later)
 *   └─ filtration_passed
 *        ├─ screening_rejected
 *        ├─ screening_shortlisted
 *        └─ screening_passed
 *             ├─ interview_rejected   (terminal)
 *             └─ interview_accepted   (terminal — hired)
 */

export type PipelinePhase =
  | "received"
  | "filtration_passed"
  | "filtration_shortlisted"
  | "filtration_rejected"
  | "screening_passed"
  | "screening_shortlisted"
  | "screening_rejected"
  | "interview_accepted"
  | "interview_rejected";

export type PipelineStage =
  | "received"
  | "filtration"
  | "screening"
  | "interview"
  | "decided";

export type PhaseOutcome = "neutral" | "passed" | "shortlisted" | "rejected" | "accepted";

interface PhaseMeta {
  label: string;
  stage: PipelineStage;
  outcome: PhaseOutcome;
}

export const PIPELINE_PHASES: Record<PipelinePhase, PhaseMeta> = {
  received: { label: "Received", stage: "received", outcome: "neutral" },

  filtration_passed: {
    label: "Filtration · Passed",
    stage: "filtration",
    outcome: "passed",
  },
  filtration_shortlisted: {
    label: "Filtration · Shortlisted",
    stage: "filtration",
    outcome: "shortlisted",
  },
  filtration_rejected: {
    label: "Filtration · Rejected",
    stage: "filtration",
    outcome: "rejected",
  },

  screening_passed: {
    label: "Screening · Passed",
    stage: "screening",
    outcome: "passed",
  },
  screening_shortlisted: {
    label: "Screening · Shortlisted",
    stage: "screening",
    outcome: "shortlisted",
  },
  screening_rejected: {
    label: "Screening · Rejected",
    stage: "screening",
    outcome: "rejected",
  },

  interview_accepted: {
    label: "Interview · Accepted",
    stage: "interview",
    outcome: "accepted",
  },
  interview_rejected: {
    label: "Interview · Rejected",
    stage: "interview",
    outcome: "rejected",
  },
};

export const PIPELINE_PHASE_ORDER: PipelinePhase[] = [
  "received",
  "filtration_passed",
  "filtration_shortlisted",
  "filtration_rejected",
  "screening_passed",
  "screening_shortlisted",
  "screening_rejected",
  "interview_accepted",
  "interview_rejected",
];

export const STAGE_ORDER: PipelineStage[] = [
  "received",
  "filtration",
  "screening",
  "interview",
  "decided",
];

export const STAGE_LABEL: Record<PipelineStage, string> = {
  received: "Received",
  filtration: "Filtration",
  screening: "Screening",
  interview: "Interview",
  decided: "Decided",
};

/** Is the given value a known pipeline phase? */
export function isPipelinePhase(value: unknown): value is PipelinePhase {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(PIPELINE_PHASES, value)
  );
}

export function phaseLabel(phase: string | null | undefined): string {
  if (isPipelinePhase(phase)) return PIPELINE_PHASES[phase].label;
  if (!phase) return "—";
  return phase;
}

export function phaseStage(phase: string | null | undefined): PipelineStage {
  if (isPipelinePhase(phase)) return PIPELINE_PHASES[phase].stage;
  return "received";
}

export function phaseOutcome(phase: string | null | undefined): PhaseOutcome {
  if (isPipelinePhase(phase)) return PIPELINE_PHASES[phase].outcome;
  return "neutral";
}

/** Tailwind classes for a status badge tied to a pipeline outcome. */
export function phaseBadgeClasses(phase: string | null | undefined): string {
  switch (phaseOutcome(phase)) {
    case "accepted":
    case "passed":
      return "bg-green-100 text-green-800 border-green-200";
    case "shortlisted":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "rejected":
      return "bg-red-100 text-red-800 border-red-200";
    case "neutral":
    default:
      return "bg-muted-background text-card-foreground border-border-color";
  }
}

/**
 * Phases that a recruiter may move a candidate to from the current phase.
 * Encodes the rules:
 *   - received       → filtration_*
 *   - filtration_passed → screening_*
 *   - filtration_shortlisted → screening_* (still advanceable)
 *   - screening_passed → interview_*
 *   - screening_shortlisted → interview_*
 *   - filtration_rejected / screening_rejected / interview_* → terminal
 */
export function nextPhaseOptions(
  current: string | null | undefined,
): PipelinePhase[] {
  const stage = phaseStage(current);
  switch (stage) {
    case "received":
      return [
        "filtration_passed",
        "filtration_shortlisted",
        "filtration_rejected",
      ];
    case "filtration": {
      const outcome = phaseOutcome(current);
      if (outcome === "rejected") return [];
      return [
        "screening_passed",
        "screening_shortlisted",
        "screening_rejected",
      ];
    }
    case "screening": {
      const outcome = phaseOutcome(current);
      if (outcome === "rejected") return [];
      return ["interview_accepted", "interview_rejected"];
    }
    case "interview":
    case "decided":
    default:
      return [];
  }
}

/** Stable counts keyed by stage, used by the overview charts. */
export interface StageCounts {
  stage: PipelineStage;
  label: string;
  total: number;
  passed: number;
  shortlisted: number;
  rejected: number;
  accepted: number;
  pending: number;
}

export function emptyStageCounts(): StageCounts[] {
  return STAGE_ORDER.filter((stage) => stage !== "decided").map((stage) => ({
    stage,
    label: STAGE_LABEL[stage],
    total: 0,
    passed: 0,
    shortlisted: 0,
    rejected: 0,
    accepted: 0,
    pending: 0,
  }));
}

/** Aggregate counts per stage for a list of applications. */
export function tallyApplications<T extends { pipeline_phase?: string | null }>(
  applications: T[],
): StageCounts[] {
  const buckets = emptyStageCounts();
  const byStage = new Map(buckets.map((entry) => [entry.stage, entry]));

  for (const application of applications) {
    const phase = application.pipeline_phase;
    const stage = phaseStage(phase);
    const outcome = phaseOutcome(phase);
    const bucket = byStage.get(stage);
    if (!bucket) continue;
    bucket.total += 1;
    if (outcome === "passed") bucket.passed += 1;
    else if (outcome === "shortlisted") bucket.shortlisted += 1;
    else if (outcome === "rejected") bucket.rejected += 1;
    else if (outcome === "accepted") bucket.accepted += 1;
    else bucket.pending += 1;
  }

  return buckets;
}

/** Counts grouped by outcome — used by the donut chart. */
export interface OutcomeSlice {
  outcome: PhaseOutcome;
  label: string;
  value: number;
  color: string;
}

const OUTCOME_LABEL: Record<PhaseOutcome, string> = {
  accepted: "Accepted",
  passed: "Passed",
  shortlisted: "Shortlisted",
  rejected: "Rejected",
  neutral: "In review",
};

const OUTCOME_COLOR: Record<PhaseOutcome, string> = {
  accepted: "var(--color-chart-1)",
  passed: "var(--color-chart-2)",
  shortlisted: "var(--color-chart-4)",
  rejected: "var(--color-chart-5)",
  neutral: "var(--color-chart-3)",
};

export function tallyByOutcome<T extends { pipeline_phase?: string | null }>(
  applications: T[],
): OutcomeSlice[] {
  const counts: Record<PhaseOutcome, number> = {
    accepted: 0,
    passed: 0,
    shortlisted: 0,
    rejected: 0,
    neutral: 0,
  };
  for (const application of applications) {
    counts[phaseOutcome(application.pipeline_phase)] += 1;
  }
  return (Object.keys(counts) as PhaseOutcome[])
    .map((outcome) => ({
      outcome,
      label: OUTCOME_LABEL[outcome],
      value: counts[outcome],
      color: OUTCOME_COLOR[outcome],
    }))
    .filter((slice) => slice.value > 0);
}
