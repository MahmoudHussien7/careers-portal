"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/Components/ui";
import { phaseBadgeClasses, phaseLabel } from "./pipeline";

interface Props {
  phase?: string | null;
  className?: string;
}

/**
 * Atom — renders the candidate's pipeline phase as a colour-coded chip
 * (green = passed/accepted, amber = shortlisted, red = rejected, neutral = in review).
 */
export function PhaseBadge({ phase, className }: Props) {
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", phaseBadgeClasses(phase), className)}
    >
      {phaseLabel(phase)}
    </Badge>
  );
}
