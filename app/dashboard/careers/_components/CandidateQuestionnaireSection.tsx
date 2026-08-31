"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  ClipboardList,
  Search,
  X,
} from "lucide-react";
import { LoadingSection } from "@/Components/organisms/LoadingSection";
import { cn, formatDate } from "@/lib/utils";
import * as dal from "@/lib/dal";
import { formatScreeningAnswerDisplay } from "@/lib/careers/screeningFormHelpers";
import type {
  ApplicationScreeningData,
  ScreeningFormQuestion,
  ScreeningSubmissionAnswer,
} from "@/types/screeningForm";

interface CandidateQuestionnaireSectionProps {
  applicationId: string;
  enabled?: boolean;
  refreshKey?: string | null;
  onLoaded?: (hasSubmission: boolean) => void;
}

const SEARCH_MIN_QUESTIONS = 6;
const JUMP_NAV_MIN_QUESTIONS = 8;
const LONG_ANSWER_CHARS = 200;

function answerTypeLabel(type: ScreeningFormQuestion["answer_type"]): string {
  switch (type) {
    case "single_choice":
      return "Single choice";
    case "multiple_choice":
      return "Multiple choice";
    default:
      return "Text";
  }
}

function isAnswerEmpty(
  question: ScreeningFormQuestion,
  answer: ScreeningSubmissionAnswer | undefined,
): boolean {
  return formatScreeningAnswerDisplay(question, answer) === "—";
}

function QuestionAnswerRow({
  index,
  question,
  answer,
  expanded,
  onToggleExpand,
  rowRef,
}: {
  index: number;
  question: ScreeningFormQuestion;
  answer: ScreeningSubmissionAnswer | undefined;
  expanded: boolean;
  onToggleExpand: () => void;
  rowRef: (node: HTMLDivElement | null) => void;
}) {
  const answerText = formatScreeningAnswerDisplay(question, answer);
  const unanswered = isAnswerEmpty(question, answer);
  const isLong = answerText.length > LONG_ANSWER_CHARS;

  return (
    <div
      ref={rowRef}
      id={`questionnaire-q-${question.id}`}
      className={cn(
        "scroll-mt-3 px-4 py-3 transition-colors",
        unanswered ? "bg-amber-50/40" : "hover:bg-muted-background/50",
      )}
    >
      <div className="flex gap-3">
        <div
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold",
            unanswered
              ? "bg-amber-100 text-amber-800"
              : "bg-gi-primary/10 text-gi-primary",
          )}
          aria-hidden
        >
          {String(index + 1).padStart(2, "0")}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium leading-snug text-foreground">
              {question.question_text}
            </p>
            <span className="rounded bg-muted-background px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {answerTypeLabel(question.answer_type)}
            </span>
          </div>

          <div
            className={cn(
              "mt-2 border-l-2 pl-3",
              unanswered ? "border-amber-300" : "border-gi-primary/30",
            )}
          >
            {unanswered ? (
              <p className="text-sm italic text-muted-foreground">No answer</p>
            ) : (
              <>
                <p
                  className={cn(
                    "whitespace-pre-wrap text-sm leading-relaxed text-foreground",
                    isLong && !expanded && "line-clamp-3",
                  )}
                >
                  {answerText}
                </p>
                {isLong && (
                  <button
                    type="button"
                    onClick={onToggleExpand}
                    className="mt-1 inline-flex items-center gap-0.5 text-xs font-medium text-gi-primary hover:underline"
                  >
                    {expanded ? (
                      <>
                        Show less
                        <ChevronUp className="h-3.5 w-3.5" />
                      </>
                    ) : (
                      <>
                        Show full answer
                        <ChevronDown className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CandidateQuestionnaireSection({
  applicationId,
  enabled = true,
  refreshKey = null,
  onLoaded,
}: CandidateQuestionnaireSectionProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [screening, setScreening] = useState<ApplicationScreeningData | null>(
    null,
  );
  const [search, setSearch] = useState("");
  const [showUnansweredOnly, setShowUnansweredOnly] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);

  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const listRef = useRef<HTMLDivElement>(null);
  const onLoadedRef = useRef(onLoaded);
  onLoadedRef.current = onLoaded;

  useEffect(() => {
    if (!enabled || !applicationId) {
      setScreening(null);
      setError(null);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      setSearch("");
      setShowUnansweredOnly(false);
      setExpandedIds(new Set());
      setActiveQuestionId(null);
      try {
        const response = await dal.getAdminApplicationScreening(applicationId);
        if (cancelled) return;
        const data = response?.data ?? null;
        setScreening(data);
        onLoadedRef.current?.(!!data?.submission);
      } catch {
        if (cancelled) return;
        setScreening(null);
        setError("Failed to load questionnaire answers.");
        onLoadedRef.current?.(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [applicationId, enabled, refreshKey]);

  const questions = useMemo(() => {
    if (!screening?.screening_form) return [];
    return [...screening.screening_form.questions].sort(
      (a, b) => a.display_order - b.display_order,
    );
  }, [screening]);

  const answersByQuestion = useMemo(() => {
    const answers = screening?.submission?.answers ?? [];
    return new Map(answers.map((answer) => [answer.question_id, answer]));
  }, [screening]);

  const stats = useMemo(() => {
    let answered = 0;
    for (const question of questions) {
      if (!isAnswerEmpty(question, answersByQuestion.get(question.id))) {
        answered += 1;
      }
    }
    return { total: questions.length, answered, unanswered: questions.length - answered };
  }, [questions, answersByQuestion]);

  const filteredQuestions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return questions.filter((question) => {
      const answer = answersByQuestion.get(question.id);
      const unanswered = isAnswerEmpty(question, answer);
      if (showUnansweredOnly && !unanswered) return false;
      if (!query) return true;
      const answerText = formatScreeningAnswerDisplay(question, answer).toLowerCase();
      return (
        question.question_text.toLowerCase().includes(query) ||
        answerText.includes(query)
      );
    });
  }, [questions, answersByQuestion, search, showUnansweredOnly]);

  const scrollToQuestion = useCallback((questionId: string) => {
    setActiveQuestionId(questionId);
    const node =
      rowRefs.current.get(questionId) ??
      document.getElementById(`questionnaire-q-${questionId}`);
    node?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);

  const toggleExpand = useCallback((questionId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  }, []);

  const setRowRef = useCallback(
    (questionId: string) => (node: HTMLDivElement | null) => {
      if (node) rowRefs.current.set(questionId, node);
      else rowRefs.current.delete(questionId);
    },
    [],
  );

  if (!enabled) return null;

  const hasSubmission = !!screening?.submission;
  const showSearch = questions.length >= SEARCH_MIN_QUESTIONS;
  const showJumpNav = questions.length >= JUMP_NAV_MIN_QUESTIONS;

  return (
    <section className="overflow-hidden rounded-lg border border-border-color bg-card-background">
      {/* Header — always visible */}
      <div className="border-b border-border-color bg-muted-background/40 px-4 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <ClipboardList className="mt-0.5 h-5 w-5 shrink-0 text-gi-primary" />
            <div>
              <h3 className="text-base font-semibold text-gi-primary">
                Interview questionnaire
              </h3>
              {screening?.screening_form?.title && (
                <p className="text-xs text-muted-foreground">
                  {screening.screening_form.title}
                </p>
              )}
            </div>
          </div>

          {hasSubmission && questions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-full border border-border-color bg-card-background px-2.5 py-1 font-medium text-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-gi-primary" />
                {stats.answered}/{stats.total} answered
              </span>
              {stats.unanswered > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 font-medium text-amber-800">
                  <Circle className="h-3 w-3 fill-current" />
                  {stats.unanswered} unanswered
                </span>
              )}
              {screening?.submission?.updated_at && (
                <span className="text-muted-foreground">
                  Updated {formatDate(screening.submission.updated_at)}
                </span>
              )}
            </div>
          )}
        </div>

        {hasSubmission && showSearch && (
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search questions or answers…"
                className="w-full rounded-md border border-border-color bg-card-background py-2 pl-9 pr-8 text-sm focus:border-gi-primary focus:outline-none focus:ring-2 focus:ring-gi-primary/20"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {stats.unanswered > 0 && (
              <label className="inline-flex shrink-0 cursor-pointer items-center gap-2 text-xs font-medium text-muted-foreground">
                <input
                  type="checkbox"
                  checked={showUnansweredOnly}
                  onChange={(e) => setShowUnansweredOnly(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-border-color text-gi-primary focus:ring-gi-primary"
                />
                Unanswered only
              </label>
            )}
          </div>
        )}

        {hasSubmission && showJumpNav && (
          <div className="mt-3 -mx-1 overflow-x-auto px-1 pb-1">
            <div className="flex w-max gap-1.5">
              {questions.map((question, index) => {
                const unanswered = isAnswerEmpty(
                  question,
                  answersByQuestion.get(question.id),
                );
                const isActive = activeQuestionId === question.id;
                return (
                  <button
                    key={question.id}
                    type="button"
                    onClick={() => scrollToQuestion(question.id)}
                    className={cn(
                      "shrink-0 rounded-md border px-2 py-1 text-xs font-semibold transition-colors",
                      isActive
                        ? "border-gi-primary bg-gi-primary text-white"
                        : unanswered
                          ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                          : "border-border-color bg-card-background text-muted-foreground hover:border-gi-primary/30 hover:text-gi-primary",
                    )}
                    title={question.question_text}
                  >
                    Q{index + 1}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Scrollable body */}
      <div
        ref={listRef}
        className="max-h-[min(28rem,55vh)] overflow-y-auto overscroll-contain"
      >
        {loading ? (
          <div className="p-6">
            <LoadingSection />
          </div>
        ) : error ? (
          <p className="p-4 text-sm text-red-600">{error}</p>
        ) : !screening?.screening_form ? (
          <p className="p-4 text-sm text-muted-foreground">
            No screening questionnaire is linked to this job posting.
          </p>
        ) : !hasSubmission ? (
          <p className="m-4 rounded-lg border border-dashed border-border-color p-4 text-sm text-muted-foreground">
            No questionnaire has been filled for this candidate yet.
          </p>
        ) : filteredQuestions.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            No questions match your search.
            {(search || showUnansweredOnly) && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setShowUnansweredOnly(false);
                }}
                className="ml-1 font-medium text-gi-primary hover:underline"
              >
                Clear filters
              </button>
            )}
          </p>
        ) : (
          <div className="divide-y divide-border-color">
            {filteredQuestions.map((question) => {
              const index = questions.findIndex((q) => q.id === question.id);
              return (
                <QuestionAnswerRow
                  key={question.id}
                  index={index}
                  question={question}
                  answer={answersByQuestion.get(question.id)}
                  expanded={expandedIds.has(question.id)}
                  onToggleExpand={() => toggleExpand(question.id)}
                  rowRef={setRowRef(question.id)}
                />
              );
            })}
          </div>
        )}
      </div>

      {hasSubmission && filteredQuestions.length > 0 && questions.length > 5 && (
        <div className="border-t border-border-color bg-muted-background/30 px-4 py-2 text-center text-xs text-muted-foreground">
          Showing {filteredQuestions.length} of {questions.length} questions
          {(search || showUnansweredOnly) && " (filtered)"}
        </div>
      )}
    </section>
  );
}
