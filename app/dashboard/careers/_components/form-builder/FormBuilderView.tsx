"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ClipboardCopy,
  Eye,
  FileJson,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Wrench,
} from "lucide-react";
import { Button } from "@/Components/atoms/Button";
import { ErrorBanner } from "@/Components/organisms/ErrorBanner";
import { LoadingSection } from "@/Components/organisms/LoadingSection";
import * as dal from "@/lib/dal";
import { draftsToApiQuestions } from "@/lib/careers/screeningFormHelpers";
import { extractApiError } from "@/lib/utils";
import { useCareersStore } from "../CareersDataProvider";
import { FormBuilderList } from "./FormBuilderList";
import { FormPreview } from "./FormPreview";
import { FormQuestionCard } from "./FormQuestionCard";
import { useFormBuilder } from "./useFormBuilder";
import { useJobForms } from "./useJobForms";

type ViewMode = "list" | "editor";

export function FormBuilderView() {
  const { careers } = useCareersStore();
  const jobForms = useJobForms();
  const builder = useFormBuilder();
  const [mode, setMode] = useState<ViewMode>("list");
  const [showJson, setShowJson] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingEditor, setLoadingEditor] = useState(false);

  if (!careers.permissions.canManageHrDirectory) {
    return (
      <div className="rounded-lg border border-border-color bg-card-background p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Only HR Admins can create and edit screening forms.
        </p>
      </div>
    );
  }

  const openCreate = () => {
    builder.startNewForm();
    setMode("editor");
    setShowJson(false);
  };

  const openEdit = async (formId: string) => {
    setLoadingEditor(true);
    builder.setSubmitError(null);
    try {
      const form = await jobForms.loadFormDetail(formId);
      builder.loadFromSavedForm(form);
      setMode("editor");
      setShowJson(false);
    } catch (err) {
      builder.setSubmitError(
        extractApiError(err, "Failed to load screening form."),
      );
    } finally {
      setLoadingEditor(false);
    }
  };

  const handleDelete = async (formId: string) => {
    if (
      !window.confirm(
        "Delete this screening form? This fails if the form is still linked to job postings.",
      )
    ) {
      return;
    }
    try {
      await jobForms.deleteForm(formId);
      if (builder.editingFormId === formId) {
        setMode("list");
        builder.startNewForm();
      }
    } catch (err) {
      builder.setSubmitError(
        extractApiError(err, "Failed to delete screening form."),
      );
    }
  };

  const handleSave = async () => {
    if (!builder.validate()) return;
    const apiQuestions = draftsToApiQuestions(builder.questions);
    if (!apiQuestions.length) return;

    setSaving(true);
    builder.setSubmitError(null);
    try {
      if (builder.editingFormId) {
        await dal.updateAdminScreeningForm(builder.editingFormId, {
          title: builder.formTitle.trim(),
          is_active: builder.isActive,
        });
        await dal.replaceAdminScreeningFormQuestions(builder.editingFormId, {
          questions: apiQuestions,
        });
      } else {
        await dal.createAdminScreeningForm({
          title: builder.formTitle.trim(),
          is_active: builder.isActive,
          questions: apiQuestions,
        });
      }

      await jobForms.refresh();
      builder.setSuccessMessage(
        "Screening form saved. Assign it to jobs from the Jobs tab when creating or editing a posting.",
      );
      setMode("list");
      builder.startNewForm();
    } catch (err: unknown) {
      builder.setSubmitError(
        extractApiError(err, "Failed to save screening form."),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    if (builder.validate()) {
      builder.setSuccessMessage("Questions are valid — see API payload below.");
      setShowJson(true);
    }
  };

  if (mode === "list") {
    return (
      <div className="space-y-4">
        <ErrorBanner
          message={builder.submitError || jobForms.error}
          onDismiss={() => builder.setSubmitError(null)}
        />
        {builder.successMessage && (
          <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {builder.successMessage}
          </div>
        )}
        <FormBuilderList
          forms={jobForms.forms}
          loading={jobForms.loading}
          onCreate={openCreate}
          onEdit={(formId) => void openEdit(formId)}
          onDelete={(formId) => void handleDelete(formId)}
        />
      </div>
    );
  }

  if (loadingEditor) {
    return <LoadingSection />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setMode("list");
              builder.setSubmitError(null);
            }}
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to forms
          </Button>
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {builder.editingFormId ? "Edit screening form" : "Create screening form"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Build a reusable questionnaire template. Link it to one or more
              jobs from the job create / edit screen.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={builder.showPreview ? "primary" : "outline"}
            size="sm"
            onClick={() => builder.setShowPreview(!builder.showPreview)}
          >
            {builder.showPreview ? (
              <>
                <Wrench className="mr-1.5 h-4 w-4" />
                Edit
              </>
            ) : (
              <>
                <Eye className="mr-1.5 h-4 w-4" />
                Preview
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={builder.loadExample}
          >
            <Sparkles className="mr-1.5 h-4 w-4" />
            Load example
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={builder.resetForm}
          >
            <RotateCcw className="mr-1.5 h-4 w-4" />
            Reset
          </Button>
          <Button type="button" size="sm" onClick={() => void handleSave()} disabled={saving}>
            <Save className="mr-1.5 h-4 w-4" />
            {saving ? "Saving…" : "Save form"}
          </Button>
        </div>
      </div>

      <ErrorBanner
        message={builder.submitError}
        onDismiss={() => builder.setSubmitError(null)}
      />

      <label className="flex items-center gap-2 text-sm text-card-foreground">
        <input
          type="checkbox"
          checked={builder.isActive}
          onChange={(event) => builder.setIsActive(event.target.checked)}
          className="h-4 w-4 rounded"
        />
        Active (available when assigning to job postings)
      </label>

      {!builder.showPreview ? (
        <>
          <div className="rounded-lg border border-gi-primary/25 bg-card-background p-6 shadow-sm">
            <input
              type="text"
              value={builder.formTitle}
              onChange={(e) => builder.setFormTitle(e.target.value)}
              placeholder="Form title"
              className="w-full border-0 bg-transparent text-2xl font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0"
            />
          </div>

          <div className="space-y-4">
            {builder.questions.map((question, index) => (
              <FormQuestionCard
                key={question.id}
                index={index}
                total={builder.questions.length}
                question={question}
                errors={builder.fieldErrors[question.id]}
                isDragging={builder.draggedId === question.id}
                onQuestionChange={(text) =>
                  builder.updateQuestion(question.id, { question: text })
                }
                onAnswerTypeChange={(answerType) =>
                  builder.changeAnswerType(question.id, answerType)
                }
                onOptionsChange={(options) =>
                  builder.updateQuestion(question.id, { options })
                }
                onDelete={() => builder.deleteQuestion(question.id)}
                onDuplicate={() => builder.duplicateQuestion(question.id)}
                onMoveUp={() => builder.moveQuestion(question.id, "up")}
                onMoveDown={() => builder.moveQuestion(question.id, "down")}
                onDragStart={() => builder.handleDragStart(question.id)}
                onDragOver={builder.handleDragOver}
                onDrop={() => builder.handleDrop(question.id)}
                onDragEnd={builder.handleDragEnd}
              />
            ))}
          </div>

          <div className="flex justify-center">
            <Button type="button" onClick={builder.addQuestion} size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Add question
            </Button>
          </div>
        </>
      ) : (
        <FormPreview
          title={builder.formTitle}
          description=""
          questions={builder.questions}
        />
      )}

      <div className="rounded-lg border border-border-color bg-muted-background/30 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-medium text-card-foreground">
            <FileJson className="h-4 w-4" />
            API payload preview
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleExport}>
              Validate &amp; show JSON
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void builder.copyPayloadToClipboard()}
            >
              <ClipboardCopy className="mr-1.5 h-4 w-4" />
              Copy JSON
            </Button>
          </div>
        </div>
        {showJson && (
          <pre className="max-h-80 overflow-auto rounded-md border border-border-color bg-card-background p-3 text-xs text-card-foreground">
            {JSON.stringify(draftsToApiQuestions(builder.questions), null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
