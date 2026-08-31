"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import { errorRingClass } from "@/Components/atoms/FieldError";
import { cn } from "@/lib/utils";
import type { HrDirectoryUser } from "@/types/careers";

interface Props {
  users: HrDirectoryUser[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  invalid?: boolean;
}

/**
 * Assignee picker for applications. Uses the same Radix Select as other
 * modal fields so it works inside the candidate detail overlay.
 */
export function HrAssigneeSelect({
  users,
  value,
  onChange,
  disabled,
  placeholder = "Select assignee…",
  className,
  invalid,
}: Props) {
  const selectValue = value || "__none__";

  return (
    <Select
      value={selectValue}
      onValueChange={(next) => onChange(next === "__none__" ? "" : next)}
      disabled={disabled}
    >
      <SelectTrigger
        size="default"
        className={cn("w-full", errorRingClass(!!invalid), className)}
        aria-invalid={invalid}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="z-60">
        <SelectItem value="__none__">Unassigned</SelectItem>
        {users.map((person) => (
          <SelectItem key={person.id} value={person.id}>
            {person.first_name} {person.last_name}
            {(person.role_name || person.role_slug) && (
              <> · {person.role_name || person.role_slug}</>
            )}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
