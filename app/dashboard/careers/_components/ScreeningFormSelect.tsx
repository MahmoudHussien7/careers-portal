"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import { FieldError, errorRingClass } from "@/Components/atoms/FieldError";
import { cn } from "@/lib/utils";
import type { ScreeningFormListItem } from "@/types/screeningForm";

const NONE = "__none__";

interface ScreeningFormSelectProps {
  forms: ScreeningFormListItem[];
  value: string;
  onChange: (formId: string) => void;
  error?: string;
  disabled?: boolean;
}

export function ScreeningFormSelect({
  forms,
  value,
  onChange,
  error,
  disabled,
}: ScreeningFormSelectProps) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-card-foreground">
        Screening questionnaire
      </label>
      <Select
        value={value || NONE}
        onValueChange={(next) => onChange(next === NONE ? "" : next)}
        disabled={disabled}
      >
        <SelectTrigger
          className={cn("w-full", errorRingClass(!!error))}
          aria-invalid={!!error}
        >
          <SelectValue placeholder="No screening form" />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          <SelectItem value={NONE}>No screening form</SelectItem>
          {forms.length === 0 ? (
            <SelectItem value="__empty__" disabled>
              No screening forms created yet
            </SelectItem>
          ) : (
            forms.map((form) => {
              const inactive = !form.is_active && form.id !== value;
              return (
                <SelectItem key={form.id} value={form.id} disabled={inactive}>
                  {form.title}
                  {!form.is_active ? " (inactive)" : ""}
                </SelectItem>
              );
            })
          )}
        </SelectContent>
      </Select>
      <p className="mt-1 text-xs text-muted-foreground">
        Optional. Recruiters fill this questionnaire for each candidate
        interviewed for this role. The same form can be used on multiple jobs.
      </p>
      <FieldError message={error} />
    </div>
  );
}
