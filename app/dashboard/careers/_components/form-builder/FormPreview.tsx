"use client";

import type { HrFormQuestionDraft } from "@/types/hrFormBuilder";
import { trimmedOptions } from "./formBuilderHelpers";

interface FormPreviewProps {
  title: string;
  description: string;
  questions: HrFormQuestionDraft[];
}

export function FormPreview({ title, description, questions }: FormPreviewProps) {
  if (questions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border-color bg-muted-background/30 p-8 text-center text-sm text-muted-foreground">
        Add questions in the builder to preview how applicants will see them.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="rounded-lg border border-gi-primary/30 bg-card-background p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
        {description.trim() && (
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        )}
      </header>

      {questions.map((draft, index) => (
        <section
          key={draft.id}
          className="rounded-lg border border-border-color bg-card-background p-5 shadow-sm"
        >
          <p className="text-base font-medium text-foreground">
            {draft.question.trim() || (
              <span className="italic text-muted-foreground">
                Untitled question {index + 1}
              </span>
            )}
            <span className="ml-1 text-red-500" aria-hidden>
              *
            </span>
          </p>

          {draft.answerType === "string" && (
            <textarea
              disabled
              rows={3}
              placeholder="Your answer"
              className="mt-3 w-full rounded-md border border-border-color bg-muted-background/40 px-3 py-2 text-sm text-muted-foreground"
            />
          )}

          {draft.answerType === "radio" && (
            <ul className="mt-3 space-y-2">
              {trimmedOptions(draft.options).map((option) => (
                <li key={option} className="flex items-center gap-2">
                  <input type="radio" disabled className="h-4 w-4" />
                  <span className="text-sm text-card-foreground">{option}</span>
                </li>
              ))}
              {trimmedOptions(draft.options).length === 0 && (
                <li className="text-sm italic text-muted-foreground">
                  No options yet
                </li>
              )}
            </ul>
          )}

          {draft.answerType === "select" && (
            <ul className="mt-3 space-y-2">
              {trimmedOptions(draft.options).map((option) => (
                <li key={option} className="flex items-center gap-2">
                  <input type="checkbox" disabled className="h-4 w-4 rounded" />
                  <span className="text-sm text-card-foreground">{option}</span>
                </li>
              ))}
              {trimmedOptions(draft.options).length === 0 && (
                <li className="text-sm italic text-muted-foreground">
                  No options yet
                </li>
              )}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
