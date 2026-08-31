"use client";

import { useCallback, useMemo, useState } from "react";
import type {
  HrFormAnswerType,
  HrFormQuestionDraft,
} from "@/types/hrFormBuilder";
import type { ScreeningForm } from "@/types/screeningForm";
import { apiQuestionsToDrafts } from "@/lib/careers/screeningFormHelpers";
import {
  createEmptyQuestion,
  reorderQuestions,
  serializeFormQuestions,
  validateFormQuestions,
  type QuestionFieldErrors,
} from "./formBuilderHelpers";

export function useFormBuilder(initialQuestions: HrFormQuestionDraft[] = []) {
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("Untitled form");
  const [isActive, setIsActive] = useState(true);
  const [formDescription, setFormDescription] = useState("");
  const [questions, setQuestions] = useState<HrFormQuestionDraft[]>(
    initialQuestions,
  );
  const [showPreview, setShowPreview] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, QuestionFieldErrors>
  >({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const payload = useMemo(() => serializeFormQuestions(questions), [questions]);

  const addQuestion = useCallback(() => {
    setQuestions((prev) => [...prev, createEmptyQuestion()]);
    setSuccessMessage(null);
    setSubmitError(null);
  }, []);

  const updateQuestion = useCallback(
    (id: string, patch: Partial<HrFormQuestionDraft>) => {
      setQuestions((prev) =>
        prev.map((q) => (q.id === id ? { ...q, ...patch } : q)),
      );
      setFieldErrors((prev) => {
        if (!prev[id]) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      });
    },
    [],
  );

  const deleteQuestion = useCallback((id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    setFieldErrors((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const duplicateQuestion = useCallback((id: string) => {
    setQuestions((prev) => {
      const index = prev.findIndex((q) => q.id === id);
      if (index === -1) return prev;
      const source = prev[index];
      const copy: HrFormQuestionDraft = {
        ...source,
        id: createEmptyQuestion().id,
        question: source.question ? `${source.question} (copy)` : "",
        options: [...source.options],
      };
      const next = [...prev];
      next.splice(index + 1, 0, copy);
      return next;
    });
  }, []);

  const changeAnswerType = useCallback((id: string, answerType: HrFormAnswerType) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q;
        return {
          ...q,
          answerType,
          options:
            answerType === "string"
              ? q.options
              : q.options.length
                ? q.options
                : [""],
        };
      }),
    );
  }, []);

  const moveQuestion = useCallback((id: string, direction: "up" | "down") => {
    setQuestions((prev) => {
      const index = prev.findIndex((q) => q.id === id);
      if (index === -1) return prev;
      const target = direction === "up" ? index - 1 : index + 1;
      return reorderQuestions(prev, index, target);
    });
  }, []);

  const handleDragStart = useCallback((id: string) => {
    setDraggedId(id);
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const handleDrop = useCallback((targetId: string) => {
    setQuestions((prev) => {
      if (!draggedId || draggedId === targetId) return prev;
      const fromIndex = prev.findIndex((q) => q.id === draggedId);
      const toIndex = prev.findIndex((q) => q.id === targetId);
      return reorderQuestions(prev, fromIndex, toIndex);
    });
    setDraggedId(null);
  }, [draggedId]);

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
  }, []);

  const validate = useCallback(() => {
    const errors = validateFormQuestions(questions);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setSubmitError("Fix the highlighted questions before saving.");
      setSuccessMessage(null);
      return false;
    }
    if (questions.length === 0) {
      setSubmitError("Add at least one question to the form.");
      setSuccessMessage(null);
      return false;
    }
    setSubmitError(null);
    return true;
  }, [questions]);

  const loadFromSavedForm = useCallback((form: ScreeningForm) => {
    setEditingFormId(form.id);
    setFormTitle(form.title);
    setIsActive(form.is_active);
    setFormDescription("");
    setQuestions(apiQuestionsToDrafts(form.questions));
    setFieldErrors({});
    setSubmitError(null);
    setSuccessMessage(null);
    setShowPreview(false);
  }, []);

  const startNewForm = useCallback(() => {
    setEditingFormId(null);
    setFormTitle("Untitled form");
    setIsActive(true);
    setFormDescription("");
    setQuestions([]);
    setFieldErrors({});
    setSubmitError(null);
    setSuccessMessage(null);
    setShowPreview(false);
  }, []);

  const exportPayload = useCallback(() => {
    if (!validate()) return null;
    const json = serializeFormQuestions(questions);
    console.log("[Form Builder] Export payload", {
      title: formTitle,
      description: formDescription,
      questions: json,
    });
    return json;
  }, [formDescription, formTitle, questions, validate]);

  const copyPayloadToClipboard = useCallback(async () => {
    const json = exportPayload();
    if (!json) return false;
    try {
      await navigator.clipboard.writeText(JSON.stringify(json, null, 2));
      setSuccessMessage("Form JSON copied to clipboard.");
      setSubmitError(null);
      return true;
    } catch {
      setSubmitError("Could not copy to clipboard. See console for JSON.");
      return false;
    }
  }, [exportPayload]);

  const loadExample = useCallback(() => {
    setFormTitle("Sample application form");
    setFormDescription("Example questions matching the API schema.");
    setQuestions([
      {
        id: createEmptyQuestion().id,
        question: "What is your gender?",
        answerType: "radio",
        options: ["Male", "Female", "Prefer not to say"],
      },
      {
        id: createEmptyQuestion().id,
        question: "Which programming languages do you know?",
        answerType: "select",
        options: ["JavaScript", "Python", "Java", "C#"],
      },
      {
        id: createEmptyQuestion().id,
        question: "Tell us about yourself.",
        answerType: "string",
        options: [],
      },
    ]);
    setFieldErrors({});
    setSubmitError(null);
    setSuccessMessage("Example form loaded.");
  }, []);

  const resetForm = useCallback(() => {
    startNewForm();
  }, [startNewForm]);

  return {
    editingFormId,
    formTitle,
    setFormTitle,
    isActive,
    setIsActive,
    formDescription,
    setFormDescription,
    questions,
    payload,
    showPreview,
    setShowPreview,
    fieldErrors,
    submitError,
    setSubmitError,
    successMessage,
    setSuccessMessage,
    draggedId,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    duplicateQuestion,
    changeAnswerType,
    moveQuestion,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    validate,
    exportPayload,
    copyPayloadToClipboard,
    loadExample,
    resetForm,
    loadFromSavedForm,
    startNewForm,
  };
}
