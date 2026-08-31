"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import {
  PIPELINE_PHASES,
  PipelinePhase,
  nextPhaseOptions,
  phaseLabel,
} from "./pipeline";

interface Props {
  current?: string | null;
  onChange: (phase: PipelinePhase) => void;
  disabled?: boolean;
  size?: "sm" | "default";
  placeholder?: string;
}

/**
 * Molecule — shadcn Select that only offers the *legal* next phases for
 * the candidate's current state in the pipeline state machine.
 *
 * The currently-selected phase is rendered first (as the value), then a
 * "Move to" group lists the allowed transitions.
 */
export function PhaseStatusSelect({
  current,
  onChange,
  disabled,
  size = "sm",
  placeholder = "Set phase…",
}: Props) {
  const options = nextPhaseOptions(current);
  const isTerminal = options.length === 0;
  const value = current && current in PIPELINE_PHASES ? current : "";

  return (
    <Select
      value={value || undefined}
      onValueChange={(next) => onChange(next as PipelinePhase)}
      disabled={disabled || isTerminal}
    >
      <SelectTrigger size={size} className="w-[220px]">
        <SelectValue placeholder={placeholder}>
          {phaseLabel(value || current)}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.length > 0 ? (
          <SelectGroup>
            <SelectLabel>Move to</SelectLabel>
            {options.map((phase) => (
              <SelectItem key={phase} value={phase}>
                {phaseLabel(phase)}
              </SelectItem>
            ))}
          </SelectGroup>
        ) : (
          <SelectGroup>
            <SelectLabel>Terminal phase — no further moves</SelectLabel>
          </SelectGroup>
        )}
      </SelectContent>
    </Select>
  );
}
