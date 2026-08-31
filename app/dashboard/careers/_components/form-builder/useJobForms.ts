"use client";

import { useCallback, useEffect, useState } from "react";
import * as dal from "@/lib/dal";
import { extractApiError } from "@/lib/utils";
import type {
  ScreeningForm,
  ScreeningFormListItem,
} from "@/types/screeningForm";

export function useJobForms() {
  const [forms, setForms] = useState<ScreeningFormListItem[]>([]);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await dal.getAdminScreeningForms({ limit: 100 });
      setForms(response?.data?.forms ?? []);
    } catch (err) {
      setError(extractApiError(err, "Failed to load screening forms."));
      setForms([]);
    } finally {
      setLoading(false);
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const loadFormDetail = useCallback(
    async (id: string): Promise<ScreeningForm> => {
      const response = await dal.getAdminScreeningFormById(id);
      const form = response?.data?.form;
      if (!form) throw new Error("Screening form not found.");
      return form;
    },
    [],
  );

  const deleteForm = useCallback(
    async (id: string) => {
      await dal.deleteAdminScreeningForm(id);
      await refresh();
    },
    [refresh],
  );

  return {
    forms,
    ready,
    loading,
    error,
    refresh,
    loadFormDetail,
    deleteForm,
  };
}
