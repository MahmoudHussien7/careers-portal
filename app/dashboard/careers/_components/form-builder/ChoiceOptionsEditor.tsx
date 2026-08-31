"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/Components/atoms/Button";
import { FieldError } from "@/Components/atoms/FieldError";
import type { QuestionFieldErrors } from "./formBuilderHelpers";

interface ChoiceOptionsEditorProps {
  options: string[];
  onChange: (options: string[]) => void;
  errors?: QuestionFieldErrors;
  choiceLabel?: string;
}

export function ChoiceOptionsEditor({
  options,
  onChange,
  errors,
  choiceLabel = "Option",
}: ChoiceOptionsEditorProps) {
  const updateOption = (index: number, value: string) => {
    const next = [...options];
    next[index] = value;
    onChange(next);
  };

  const addOption = () => {
    onChange([...options, ""]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 1) {
      onChange([""]);
      return;
    }
    onChange(options.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-card-foreground">Options</p>
      <ul className="space-y-2">
        {options.map((option, index) => (
          <li key={index} className="flex items-center gap-2">
            <span className="w-5 text-sm text-muted-foreground">{index + 1}.</span>
            <input
              type="text"
              value={option}
              onChange={(e) => updateOption(index, e.target.value)}
              placeholder={`${choiceLabel} ${index + 1}`}
              className="flex-1 rounded-md border border-border-color px-3 py-2 text-sm focus:border-gi-primary focus:outline-none focus:ring-gi-primary"
              aria-invalid={!!errors?.options}
            />
            <button
              type="button"
              onClick={() => removeOption(index)}
              className="rounded p-2 text-muted-foreground hover:bg-muted-background hover:text-red-600"
              aria-label={`Remove option ${index + 1}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
      <Button type="button" variant="outline" size="sm" onClick={addOption}>
        <Plus className="mr-1 h-4 w-4" />
        Add option
      </Button>
      <FieldError message={errors?.options} />
    </div>
  );
}
