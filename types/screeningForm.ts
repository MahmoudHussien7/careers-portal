/** API answer types for screening form questions. */
export type ScreeningAnswerType =
  | "text"
  | "single_choice"
  | "multiple_choice";

export interface ScreeningFormOption {
  id: string;
  option_text: string;
  display_order: number;
}

export interface ScreeningFormQuestion {
  id: string;
  question_text: string;
  answer_type: ScreeningAnswerType;
  display_order: number;
  options: ScreeningFormOption[];
}

export interface ScreeningFormListItem {
  id: string;
  title: string;
  is_active: boolean;
  question_count: number;
  linked_job_count: number;
  created_at: string;
  updated_at: string;
}

export interface ScreeningForm {
  id: string;
  title: string;
  is_active: boolean;
  questions: ScreeningFormQuestion[];
  created_at: string;
  updated_at: string;
}

export interface ScreeningFormsListParams {
  is_active?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ScreeningFormsListResponse {
  status: string;
  data: {
    forms: ScreeningFormListItem[];
    pagination: { total: number };
  };
}

export interface ScreeningFormDetailResponse {
  status: string;
  data: {
    form: ScreeningForm;
  };
}

export interface ScreeningFormQuestionInput {
  id?: string;
  question_text: string;
  answer_type: ScreeningAnswerType;
  display_order: number;
  options?: string[];
}

export interface CreateScreeningFormPayload {
  title: string;
  is_active?: boolean;
  questions: ScreeningFormQuestionInput[];
}

export interface UpdateScreeningFormPayload {
  title?: string;
  is_active?: boolean;
}

export interface ReplaceScreeningFormQuestionsPayload {
  questions: ScreeningFormQuestionInput[];
}

export interface ScreeningSubmissionAnswer {
  question_id: string;
  answer_text?: string | null;
  selected_option_id?: string | null;
  selected_option_text?: string | null;
  selected_option_ids?: string[] | null;
  selected_options?: Array<{ id: string; option_text: string }> | null;
}

export interface ScreeningSubmission {
  id: string;
  filled_by_user_id: string;
  created_at: string;
  updated_at: string;
  answers: ScreeningSubmissionAnswer[];
}

export interface ApplicationScreeningData {
  application_id: string;
  screening_form: ScreeningForm | null;
  submission: ScreeningSubmission | null;
}

export interface ApplicationScreeningResponse {
  status: string;
  data: ApplicationScreeningData;
}

export interface SaveScreeningAnswerInput {
  question_id: string;
  answer_text?: string;
  selected_option_id?: string;
  selected_option_ids?: string[];
}

export interface SaveApplicationScreeningPayload {
  answers: SaveScreeningAnswerInput[];
}
