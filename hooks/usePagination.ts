"use client";

import { useState } from "react";

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const initialPagination = (limit: number = 20): PaginationState => ({
  page: 1,
  limit,
  total: 0,
  totalPages: 0,
});

/**
 * Stateful pagination helper.
 *
 * Keeps page/limit/total in one place and exposes the same shape
 * the dashboard list pages were duplicating manually.
 */
export function usePagination(limit: number = 20) {
  const [pagination, setPagination] = useState<PaginationState>(
    initialPagination(limit),
  );

  return { pagination, setPagination };
}
