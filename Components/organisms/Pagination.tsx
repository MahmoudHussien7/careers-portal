"use client";

import { Button } from "@/Components/atoms/Button";
import type { PaginationState } from "@/hooks/usePagination";

interface PaginationProps {
  pagination: PaginationState;
  onPageChange: (page: number) => void;
  className?: string;
}

/**
 * Standard prev/next pagination block used by every list page.
 */
export function Pagination({
  pagination,
  onPageChange,
  className,
}: PaginationProps) {
  const { page, totalPages, total } = pagination;
  if (totalPages <= 1) return null;

  return (
    <div
      className={`mt-6 flex justify-center items-center space-x-2 ${className ?? ""}`}
    >
      <Button
        variant="outline"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        Previous
      </Button>
      <span className="text-card-foreground">
        Page {page} of {totalPages} ({total} total)
      </span>
      <Button
        variant="outline"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
      >
        Next
      </Button>
    </div>
  );
}
