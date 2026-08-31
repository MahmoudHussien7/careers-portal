"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import type { LookupItem } from "@/lib/dal";

interface Props {
  items: LookupItem[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  emptyLabel?: string;
  className?: string;
  size?: "sm" | "default";
}

/**
 * Select bound to lookup rows (`id` + `name`). Use `""` for no selection.
 */
export function ApplicationLookupSelect({
  items,
  value,
  onChange,
  disabled,
  placeholder = "Select…",
  emptyLabel = "—",
  className = "w-[200px]",
  size = "sm",
}: Props) {
  const selectValue = value || "__none__";

  return (
    <Select
      value={selectValue}
      onValueChange={(next) => onChange(next === "__none__" ? "" : next)}
      disabled={disabled}
    >
      <SelectTrigger size={size} className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">{emptyLabel}</SelectItem>
        {items.map((item) => (
          <SelectItem key={item.id} value={item.id}>
            {item.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
