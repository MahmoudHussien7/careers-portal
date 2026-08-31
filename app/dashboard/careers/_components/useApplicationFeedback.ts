"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import * as dal from "@/lib/dal";
import { extractApiError } from "@/lib/utils";
import { makeApplicationFeedbackSchema, zodErrorToFieldMap } from "@/lib/schemas";
import type {
  ApplicationFeedbackItem,
  ApplicationPipelinePhase,
  CreateApplicationFeedbackFormValues,
  CreateApplicationFeedbackPayload,
  HrFeedbackConfig,
} from "@/types/careers";

export const initialFeedbackForm = (
  phaseId = "",
): CreateApplicationFeedbackFormValues => ({
  title: "",
  notes: "",
  recommendationId: "",
  phaseId,
  rating: "",
});

type FieldErrors = Partial<
  Record<keyof CreateApplicationFeedbackFormValues | "_root", string>
>;

function feedbackPhaseId(item: ApplicationFeedbackItem): string | null {
  return item.phase?.id ?? item.phase_id ?? null;
}

interface UseApplicationFeedbackOptions {
  applicationId: string | null | undefined;
  currentPhaseId: string;
  applicationPipeline: ApplicationPipelinePhase[];
  enabled?: boolean;
  onError: (msg: string) => void;
  onSaved?: () => void;
}

/**
 * Loads feedback timeline + config for a candidate, and submits new
 * stage feedback (JSON or multipart when files are attached).
 */
export function useApplicationFeedback({
  applicationId,
  currentPhaseId,
  applicationPipeline,
  enabled = true,
  onError,
  onSaved,
}: UseApplicationFeedbackOptions) {
  const [items, setItems] = useState<ApplicationFeedbackItem[]>([]);
  const [config, setConfig] = useState<HrFeedbackConfig>({
    ratingMax: 5,
    requiredBeforePhaseChange: false,
  });
  const [recommendations, setRecommendations] = useState<dal.LookupItem[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CreateApplicationFeedbackFormValues>(
    initialFeedbackForm(currentPhaseId),
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    if (!applicationId || !enabled) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const [feedback, feedbackConfig, recs] = await Promise.all([
        dal.getAdminHrApplicationFeedback(applicationId),
        dal.getAdminHrFeedbackConfig().catch(() => ({
          ratingMax: 5,
          requiredBeforePhaseChange: false,
        })),
        dal.getFeedbackRecommendations().catch(() => [] as dal.LookupItem[]),
      ]);
      setItems(feedback);
      setConfig(feedbackConfig);
      setRecommendations(recs);
    } catch (err) {
      onError(extractApiError(err, "Failed to load candidate feedback."));
    } finally {
      setLoading(false);
    }
  }, [applicationId, enabled, onError]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setForm(initialFeedbackForm(currentPhaseId));
    setErrors({});
    setAttachmentFiles([]);
    setShowForm(false);
  }, [applicationId, currentPhaseId]);

  const setField = <K extends keyof CreateApplicationFeedbackFormValues>(
    key: K,
    value: CreateApplicationFeedbackFormValues[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key] && !prev._root) return prev;
      const { [key]: _drop, _root: _drop2, ...rest } = prev;
      return rest as FieldErrors;
    });
  };

  const openFormForPhase = (phaseId: string) => {
    setForm(initialFeedbackForm(phaseId || currentPhaseId));
    setErrors({});
    setAttachmentFiles([]);
    setShowForm(true);
  };

  const itemsByPhaseId = useMemo(() => {
    const map = new Map<string, ApplicationFeedbackItem[]>();
    for (const item of items) {
      const phaseId = feedbackPhaseId(item) ?? "__unknown__";
      const list = map.get(phaseId) ?? [];
      list.push(item);
      map.set(phaseId, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => {
        const aTime = a.created_at ? Date.parse(a.created_at) : 0;
        const bTime = b.created_at ? Date.parse(b.created_at) : 0;
        return bTime - aTime;
      });
    }
    return map;
  }, [items]);

  const hasFeedbackForPhase = useCallback(
    (phaseId: string | null | undefined) => {
      if (!phaseId) return false;
      return (itemsByPhaseId.get(phaseId)?.length ?? 0) > 0;
    },
    [itemsByPhaseId],
  );

  /** True when config requires feedback and the current phase has none. */
  const blocksPhaseChange = useMemo(() => {
    if (!config.requiredBeforePhaseChange) return false;
    if (!currentPhaseId) return false;
    return !hasFeedbackForPhase(currentPhaseId);
  }, [config.requiredBeforePhaseChange, currentPhaseId, hasFeedbackForPhase]);

  const phaseGroups = useMemo(() => {
    const known = applicationPipeline.map((phase) => ({
      phase,
      items: itemsByPhaseId.get(phase.id) ?? [],
    }));
    const knownIds = new Set(applicationPipeline.map((p) => p.id));
    const extras: Array<{
      phase: { id: string; name: string; slug: string };
      items: ApplicationFeedbackItem[];
    }> = [];
    for (const [phaseId, phaseItems] of itemsByPhaseId) {
      if (phaseId === "__unknown__" || knownIds.has(phaseId)) continue;
      const label =
        phaseItems[0]?.phase?.name ??
        phaseItems[0]?.phase?.slug ??
        "Other stage";
      extras.push({
        phase: { id: phaseId, name: label, slug: phaseId },
        items: phaseItems,
      });
    }
    const unknown = itemsByPhaseId.get("__unknown__");
    if (unknown?.length) {
      extras.push({
        phase: { id: "__unknown__", name: "Unassigned stage", slug: "" },
        items: unknown,
      });
    }
    return [...known, ...extras];
  }, [applicationPipeline, itemsByPhaseId]);

  const submit = async () => {
    if (!applicationId) return;
    const schema = makeApplicationFeedbackSchema(config.ratingMax);
    const result = schema.safeParse(form);
    if (!result.success) {
      setErrors(
        zodErrorToFieldMap(result.error) as FieldErrors,
      );
      return;
    }

    const parsed = result.data;
    setSaving(true);
    try {
      if (attachmentFiles.length > 0) {
        const fd = new FormData();
        fd.append("title", parsed.title);
        fd.append("notes", parsed.notes);
        fd.append("recommendationId", parsed.recommendationId);
        fd.append("phaseId", parsed.phaseId);
        if (parsed.rating) fd.append("rating", parsed.rating);
        for (const file of attachmentFiles) {
          fd.append("attachments", file);
        }
        await dal.createAdminHrApplicationFeedback(applicationId, fd);
      } else {
        const payload: CreateApplicationFeedbackPayload = {
          title: parsed.title,
          notes: parsed.notes,
          recommendationId: parsed.recommendationId,
          phaseId: parsed.phaseId,
        };
        if (parsed.rating) {
          payload.rating = Number(parsed.rating);
        }
        await dal.createAdminHrApplicationFeedback(applicationId, payload);
      }
      setForm(initialFeedbackForm(currentPhaseId));
      setAttachmentFiles([]);
      setErrors({});
      setShowForm(false);
      await load();
      onSaved?.();
    } catch (err) {
      onError(extractApiError(err, "Failed to save feedback."));
    } finally {
      setSaving(false);
    }
  };

  return {
    items,
    config,
    recommendations,
    loading,
    saving,
    form,
    errors,
    attachmentFiles,
    showForm,
    setShowForm,
    setField,
    setAttachmentFiles,
    openFormForPhase,
    phaseGroups,
    hasFeedbackForPhase,
    blocksPhaseChange,
    submit,
    reload: load,
  };
}
