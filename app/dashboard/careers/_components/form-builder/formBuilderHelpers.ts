import type {
  HrFormBuilderPayload,
  HrFormQuestionDraft,
  HrFormQuestionPayload,
} from "@/types/hrFormBuilder";

export function createQuestionId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `q-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createEmptyQuestion(): HrFormQuestionDraft {
  return {
    id: createQuestionId(),
    question: "",
    answerType: "string",
    options: [""],
  };
}

export function trimmedOptions(options: string[]): string[] {
  return options.map((o) => o.trim()).filter((o) => o.length > 0);
}

export function serializeFormQuestions(
  questions: HrFormQuestionDraft[],
): HrFormBuilderPayload {
  return questions.map(
    (draft): HrFormQuestionPayload => ({
      question: draft.question.trim(),
      value:
        draft.answerType === "string"
          ? { type: "string" }
          : {
              type: draft.answerType,
              options: trimmedOptions(draft.options),
            },
    }),
  );
}

export function payloadToDrafts(
  questions: HrFormBuilderPayload,
): HrFormQuestionDraft[] {
  return questions.map((item) => ({
    id: createQuestionId(),
    question: item.question,
    answerType: item.value.type,
    options:
      item.value.type === "string"
        ? []
        : item.value.options.length
          ? [...item.value.options]
          : [""],
  }));
}

export type QuestionFieldErrors = {
  question?: string;
  options?: string;
};

export function validateFormQuestions(
  questions: HrFormQuestionDraft[],
): Record<string, QuestionFieldErrors> {
  const errors: Record<string, QuestionFieldErrors> = {};

  questions.forEach((draft) => {
    const fieldErrors: QuestionFieldErrors = {};
    if (!draft.question.trim()) {
      fieldErrors.question = "Question text is required.";
    }
    if (draft.answerType === "radio" || draft.answerType === "select") {
      if (trimmedOptions(draft.options).length === 0) {
        fieldErrors.options = "Add at least one option.";
      }
    }
    if (fieldErrors.question || fieldErrors.options) {
      errors[draft.id] = fieldErrors;
    }
  });

  return errors;
}

export function reorderQuestions(
  questions: HrFormQuestionDraft[],
  fromIndex: number,
  toIndex: number,
): HrFormQuestionDraft[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= questions.length ||
    toIndex >= questions.length
  ) {
    return questions;
  }
  const next = [...questions];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

/** Example payload matching the product spec. */
export const EXAMPLE_FORM_BUILDER_PAYLOAD: HrFormBuilderPayload = [
  {
    question: "What is your gender?",
    value: {
      type: "radio",
      options: ["Male", "Female", "Prefer not to say"],
    },
  },
  {
    question: "Which programming languages do you know?",
    value: {
      type: "select",
      options: ["JavaScript", "Python", "Java", "C#"],
    },
  },
  {
    question: "Tell us about yourself.",
    value: { type: "string" },
  },
];
