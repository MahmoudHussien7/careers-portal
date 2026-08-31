/** Answer type keys as stored in the API payload. */
export type HrFormAnswerType = "string" | "radio" | "select";

export interface HrFormStringValue {
  type: "string";
}

export interface HrFormChoiceValue {
  type: "radio" | "select";
  options: string[];
}

export type HrFormAnswerValue = HrFormStringValue | HrFormChoiceValue;

/** Serialized question — ready to POST as JSON. */
export interface HrFormQuestionPayload {
  question: string;
  value: HrFormAnswerValue;
}

export type HrFormBuilderPayload = HrFormQuestionPayload[];

/** UI-only draft while building a form. */
export interface HrFormQuestionDraft {
  id: string;
  question: string;
  answerType: HrFormAnswerType;
  /** Option labels for radio / select (may include empty rows while editing). */
  options: string[];
}

/** Saved form assigned to a job posting. */
export interface HrJobForm {
  id: string;
  job_id: string;
  title: string;
  description: string;
  questions: HrFormBuilderPayload;
  created_at: string;
  updated_at: string;
  created_by_user_id?: string | null;
}

export interface CreateHrJobFormInput {
  job_id: string;
  title: string;
  description: string;
  questions: HrFormBuilderPayload;
  created_by_user_id?: string | null;
}

export interface UpdateHrJobFormInput {
  job_id?: string;
  title?: string;
  description?: string;
  questions?: HrFormBuilderPayload;
}

/** One answer when a recruiter submits a job form. */
export interface HrJobFormAnswer {
  question: string;
  value: string | string[];
}

export interface HrJobFormResponse {
  id: string;
  form_id: string;
  job_id: string;
  /** Candidate application this questionnaire belongs to. */
  application_id: string;
  answers: HrJobFormAnswer[];
  submitted_by_user_id: string;
  submitted_by_name?: string | null;
  submitted_at: string;
  updated_at: string;
}

export interface SubmitHrJobFormResponseInput {
  form_id: string;
  job_id: string;
  application_id: string;
  answers: HrJobFormAnswer[];
  submitted_by_user_id: string;
  submitted_by_name?: string | null;
}

export const HR_FORM_ANSWER_TYPE_OPTIONS: Array<{
  value: HrFormAnswerType;
  label: string;
  description: string;
}> = [
  {
    value: "string",
    label: "Text",
    description: "Free-text response",
  },
  {
    value: "radio",
    label: "Single choice",
    description: "One option (radio buttons)",
  },
  {
    value: "select",
    label: "Multiple choice",
    description: "Several options (multi-select)",
  },
];
