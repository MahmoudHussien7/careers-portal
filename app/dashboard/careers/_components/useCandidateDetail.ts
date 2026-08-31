"use client";

import { useEffect, useMemo, useState } from "react";
import * as dal from "@/lib/dal";
import {
  applicationPhaseId,
  phaseSlugFromId,
} from "@/lib/careers/applicationPipeline";
import { extractApiError } from "@/lib/utils";
import { candidateUpdateSchema, zodErrorToFieldMap } from "@/lib/schemas";
import type {
  ApplicationPipelinePhase,
  HrApplication,
  UpdateHrApplicationPayload,
} from "@/types/careers";

interface UseCandidateDetailOptions {
  onSaved: () => void;
  onError: (msg: string) => void;
  applicationPipeline: ApplicationPipelinePhase[];
  /**
   * Called before a phase change is saved. Return an error message to block
   * the PATCH (e.g. when feedback is required for the current stage).
   */
  getPhaseChangeBlockReason?: (
    currentPhaseId: string | undefined,
    nextPhaseId: string | null | undefined,
  ) => string | null;
}

type FieldErrors = Partial<
  Record<keyof UpdateHrApplicationPayload | "_root", string>
>;

function normalizeAssigneeId(value: string | null | undefined): string | null {
  if (!value || !value.trim()) return null;
  return value;
}

function isPendingDirty(
  application: HrApplication,
  pending: UpdateHrApplicationPayload,
  pipeline: ApplicationPipelinePhase[],
): boolean {
  if (pending.phase_id !== undefined) {
    const currentPhaseId = applicationPhaseId(application, pipeline) ?? "";
    const nextPhaseId = pending.phase_id ?? "";
    if (nextPhaseId !== currentPhaseId) return true;
  }
  if (pending.pipeline_phase !== undefined) {
    if ((pending.pipeline_phase || "") !== (application.pipeline_phase || "")) {
      return true;
    }
  }
  if (pending.status_id !== undefined) {
    if ((pending.status_id || "") !== (application.status_id || "")) {
      return true;
    }
  }
  if (pending.assigned_to_user_id !== undefined) {
    const next = normalizeAssigneeId(pending.assigned_to_user_id);
    const current = normalizeAssigneeId(application.assigned_to_user_id);
    if (next !== current) return true;
  }
  if (pending.assignment_source !== undefined) {
    if (
      (pending.assignment_source || "") !==
      (application.assignment_source || "")
    ) {
      return true;
    }
  }
  return false;
}

export function useCandidateDetail({
  onSaved,
  onError,
  applicationPipeline,
  getPhaseChangeBlockReason,
}: UseCandidateDetailOptions) {
  const [application, setApplication] = useState<HrApplication | null>(null);
  const [pending, setPending] = useState<UpdateHrApplicationPayload>({});
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPending({});
    setErrors({});
  }, [application?.id]);

  const open = (target: HrApplication) => {
    setApplication(target);
  };

  const close = () => {
    setApplication(null);
    setPending({});
    setErrors({});
  };

  const updatePending = (
    field: keyof UpdateHrApplicationPayload,
    value: string,
  ) => {
    setPending((prev) => {
      const next = { ...prev };
      if (value === "") {
        if (field === "assigned_to_user_id" || field === "phase_id") {
          next[field] = null;
        } else {
          delete next[field];
        }
      } else {
        next[field] = value;
        if (field === "phase_id") {
          delete next.status_id;
        }
      }
      return next;
    });
    setErrors((prev) => {
      if (!prev[field] && !prev._root) return prev;
      const { [field]: _drop, _root: _drop2, ...rest } = prev;
      return rest as FieldErrors;
    });
  };

  const isDirty = useMemo(
    () =>
      application
        ? isPendingDirty(application, pending, applicationPipeline)
        : false,
    [application, pending, applicationPipeline],
  );

  const validate = (): UpdateHrApplicationPayload | null => {
    const result = candidateUpdateSchema.safeParse(pending);
    if (!result.success) {
      setErrors(zodErrorToFieldMap(result.error) as FieldErrors);
      return null;
    }
    setErrors({});
    return result.data as UpdateHrApplicationPayload;
  };

  const save = async () => {
    if (!application) return;
    const parsed = validate();
    if (!parsed) return;

    const currentPhaseId = applicationPhaseId(application, applicationPipeline);
    const isPhaseChange =
      parsed.phase_id !== undefined &&
      (parsed.phase_id ?? "") !== (currentPhaseId ?? "");

    if (isPhaseChange && getPhaseChangeBlockReason) {
      const blockReason = getPhaseChangeBlockReason(
        currentPhaseId,
        parsed.phase_id,
      );
      if (blockReason) {
        setErrors({ phase_id: blockReason });
        onError(blockReason);
        return;
      }
    }

    setSaving(true);
    try {
      await dal.updateAdminHrApplication(application.id, parsed, {
        pipeline: applicationPipeline,
      });
      setApplication((current) => {
        if (!current) return current;
        const nextAssignedId =
          parsed.assigned_to_user_id !== undefined
            ? parsed.assigned_to_user_id
            : current.assigned_to_user_id;
        const nextPhaseId =
          parsed.phase_id !== undefined
            ? parsed.phase_id
            : applicationPhaseId(current, applicationPipeline) ?? null;
        const nextPhaseSlug =
          nextPhaseId != null
            ? phaseSlugFromId(applicationPipeline, nextPhaseId) ??
              current.pipeline_phase
            : parsed.pipeline_phase ?? current.pipeline_phase;
        return {
          ...current,
          phase_id: nextPhaseId,
          pipeline_phase: nextPhaseSlug,
          status_id:
            parsed.status_id !== undefined
              ? parsed.status_id
              : current.status_id,
          assigned_to_user_id: nextAssignedId,
          assignment_source:
            parsed.assignment_source ?? current.assignment_source,
        };
      });
      setPending({});
      setErrors({});
      onSaved();
    } catch (err) {
      onError(extractApiError(err, "Failed to update application."));
    } finally {
      setSaving(false);
    }
  };

  return {
    application,
    pending,
    errors,
    saving,
    isDirty,
    open,
    close,
    updatePending,
    save,
  };
}
