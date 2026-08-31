import type {
  ScreeningAnswerType,
  ScreeningFormQuestion,
  ScreeningFormQuestionInput,
  ScreeningSubmissionAnswer,
  SaveScreeningAnswerInput,
} from "@/types/screeningForm";
import type { HrFormAnswerType, HrFormQuestionDraft } from "@/types/hrFormBuilder";

function trimmedOptions(options: string[]): string[] {
  return options.map((option) => option.trim()).filter((option) => option.length > 0);
}

export function uiAnswerTypeToApi(type: HrFormAnswerType): ScreeningAnswerType {
  switch (type) {
    case "radio":
      return "single_choice";
    case "select":
      return "multiple_choice";
    default:
      return "text";
  }
}

export function apiAnswerTypeToUi(type: ScreeningAnswerType): HrFormAnswerType {
  switch (type) {
    case "single_choice":
      return "radio";
    case "multiple_choice":
      return "select";
    default:
      return "string";
  }
}

export function apiQuestionsToDrafts(
  questions: ScreeningFormQuestion[],
): HrFormQuestionDraft[] {
  return [...questions]
    .sort((a, b) => a.display_order - b.display_order)
    .map((item) => ({
      id: item.id,
      question: item.question_text,
      answerType: apiAnswerTypeToUi(item.answer_type),
      options:
        item.answer_type === "text"
          ? []
          : item.options.length
            ? item.options
                .sort((a, b) => a.display_order - b.display_order)
                .map((option) => option.option_text)
            : [""],
    }));
}

export function draftsToApiQuestions(
  drafts: HrFormQuestionDraft[],
): ScreeningFormQuestionInput[] {
  return drafts.map((draft, index) => {
    const answer_type = uiAnswerTypeToApi(draft.answerType);
    const input: ScreeningFormQuestionInput = {
      question_text: draft.question.trim(),
      answer_type,
      display_order: index,
    };
    if (draft.id && !draft.id.startsWith("q-")) {
      input.id = draft.id;
    }
    if (answer_type !== "text") {
      input.options = trimmedOptions(draft.options);
    }
    return input;
  });
}

export type ScreeningAnswerDraft = {
  answer_text?: string;
  selected_option_id?: string;
  selected_option_ids?: string[];
};

export function submissionAnswersToDrafts(
  questions: ScreeningFormQuestion[],
  answers: ScreeningSubmissionAnswer[],
): Record<string, ScreeningAnswerDraft> {
  const byQuestion = new Map(answers.map((answer) => [answer.question_id, answer]));
  const result: Record<string, ScreeningAnswerDraft> = {};

  for (const question of questions) {
    const saved = byQuestion.get(question.id);
    if (!saved) {
      result[question.id] =
        question.answer_type === "multiple_choice"
          ? { selected_option_ids: [] }
          : question.answer_type === "single_choice"
            ? {}
            : { answer_text: "" };
      continue;
    }

    if (question.answer_type === "text") {
      result[question.id] = { answer_text: saved.answer_text ?? "" };
    } else if (question.answer_type === "single_choice") {
      result[question.id] = {
        selected_option_id: saved.selected_option_id ?? undefined,
      };
    } else {
      result[question.id] = {
        selected_option_ids:
          saved.selected_option_ids ??
          saved.selected_options?.map((option) => option.id) ??
          [],
      };
    }
  }

  return result;
}

export function formatScreeningAnswerDisplay(
  question: ScreeningFormQuestion,
  answer: ScreeningSubmissionAnswer | undefined,
): string {
  if (!answer) return "—";

  if (question.answer_type === "text") {
    const text = answer.answer_text?.trim();
    return text || "—";
  }

  if (question.answer_type === "single_choice") {
    if (answer.selected_option_text?.trim()) {
      return answer.selected_option_text.trim();
    }
    if (answer.selected_option_id) {
      const option = question.options.find(
        (item) => item.id === answer.selected_option_id,
      );
      return option?.option_text?.trim() || "—";
    }
    return "—";
  }

  const fromNested =
    answer.selected_options
      ?.map((option) => option.option_text.trim())
      .filter(Boolean) ?? [];
  if (fromNested.length > 0) {
    return fromNested.join(", ");
  }

  const optionIds = answer.selected_option_ids ?? [];
  if (optionIds.length === 0) return "—";

  const labels = optionIds
    .map((id) => question.options.find((option) => option.id === id)?.option_text)
    .filter((label): label is string => !!label?.trim())
    .map((label) => label.trim());

  return labels.length > 0 ? labels.join(", ") : "—";
}

export function draftsToSavePayload(
  questions: ScreeningFormQuestion[],
  answers: Record<string, ScreeningAnswerDraft>,
): SaveScreeningAnswerInput[] {
  return questions.map((question) => {
    const value = answers[question.id] ?? {};
    if (question.answer_type === "text") {
      return {
        question_id: question.id,
        answer_text: value.answer_text?.trim() ?? "",
      };
    }
    if (question.answer_type === "single_choice") {
      return {
        question_id: question.id,
        selected_option_id: value.selected_option_id,
      };
    }
    return {
      question_id: question.id,
      selected_option_ids: value.selected_option_ids ?? [],
    };
  });
}
