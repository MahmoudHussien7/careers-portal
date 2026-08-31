"use client";

import {
  ChevronDown,
  ChevronUp,
  Copy,
  GripVertical,
  Trash2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import { FieldError, errorRingClass } from "@/Components/atoms/FieldError";
import { cn } from "@/lib/utils";
import {
  HR_FORM_ANSWER_TYPE_OPTIONS,
  type HrFormAnswerType,
  type HrFormQuestionDraft,
} from "@/types/hrFormBuilder";
import type { QuestionFieldErrors } from "./formBuilderHelpers";
import { ChoiceOptionsEditor } from "./ChoiceOptionsEditor";

interface FormQuestionCardProps {
  index: number;
  total: number;
  question: HrFormQuestionDraft;
  errors?: QuestionFieldErrors;
  isDragging?: boolean;
  onQuestionChange: (text: string) => void;
  onAnswerTypeChange: (type: HrFormAnswerType) => void;
  onOptionsChange: (options: string[]) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDragStart: () => void;
  onDragOver: (event: React.DragEvent) => void;
  onDrop: () => void;
  onDragEnd: () => void;
}

export function FormQuestionCard({
  index,
  total,
  question,
  errors,
  isDragging,
  onQuestionChange,
  onAnswerTypeChange,
  onOptionsChange,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: FormQuestionCardProps) {
  const isChoice =
    question.answerType === "radio" || question.answerType === "select";

  return (
    <article
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={cn(
        "rounded-lg border border-border-color bg-card-background shadow-sm transition-opacity",
        isDragging && "opacity-50",
        errors && "border-red-300 ring-1 ring-red-200",
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border-color bg-muted-background/40 px-4 py-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <GripVertical
            className="h-4 w-4 cursor-grab active:cursor-grabbing"
            aria-hidden
          />
          <span className="font-medium text-card-foreground">
            Question {index + 1}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            className="rounded p-1.5 text-muted-foreground hover:bg-muted-background disabled:opacity-30"
            aria-label="Move question up"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="rounded p-1.5 text-muted-foreground hover:bg-muted-background disabled:opacity-30"
            aria-label="Move question down"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onDuplicate}
            className="rounded p-1.5 text-muted-foreground hover:bg-muted-background"
            aria-label="Duplicate question"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded p-1.5 text-muted-foreground hover:bg-muted-background hover:text-red-600"
            aria-label="Delete question"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div>
          <label
            htmlFor={`question-${question.id}`}
            className="mb-1 block text-sm font-medium text-card-foreground"
          >
            Question
          </label>
          <textarea
            id={`question-${question.id}`}
            value={question.question}
            onChange={(e) => onQuestionChange(e.target.value)}
            rows={2}
            placeholder="Enter your question"
            aria-invalid={!!errors?.question}
            className={cn(
              "w-full rounded-md border border-border-color px-3 py-2 text-sm focus:border-gi-primary focus:outline-none focus:ring-gi-primary",
              errorRingClass(!!errors?.question),
            )}
          />
          <FieldError message={errors?.question} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-card-foreground">
            Answer type
          </label>
          <Select
            value={question.answerType}
            onValueChange={(value) =>
              onAnswerTypeChange(value as HrFormAnswerType)
            }
          >
            <SelectTrigger className="w-full max-w-md">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HR_FORM_ANSWER_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label} — {opt.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isChoice && (
          <ChoiceOptionsEditor
            options={question.options}
            onChange={onOptionsChange}
            errors={errors}
          />
        )}

        {question.answerType === "string" && (
          <p className="text-xs text-muted-foreground">
            Respondents will see a free-text field.
          </p>
        )}
      </div>
    </article>
  );
}
