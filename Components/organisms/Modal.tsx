"use client";

import { ReactNode, useEffect } from "react";
import { cn } from "@/lib/utils";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "5xl";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  header?: ReactNode;
  size?: ModalSize;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  footerClassName?: string;
  /** Remove default outer/body padding for custom layouts. */
  flush?: boolean;
  /** Set to false to keep the modal open when clicking the backdrop. */
  closeOnBackdrop?: boolean;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "5xl": "max-w-5xl",
};

/**
 * Generic modal used for view/edit/create flows.
 * Behaviour matches the inline modals the dashboard pages had:
 *  - fixed positioning, dark backdrop, rounded card.
 *  - close on Escape and (optionally) backdrop click.
 */
export function Modal({
  open,
  onClose,
  title,
  header,
  size = "3xl",
  footer,
  children,
  className,
  contentClassName,
  footerClassName,
  flush = false,
  closeOnBackdrop = true,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex h-full w-full items-start justify-center overflow-y-auto bg-gi-primary/30 py-8 backdrop-blur-sm"
      onClick={() => closeOnBackdrop && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cn(
          "relative mx-auto flex w-full flex-col overflow-hidden rounded-lg border border-border-color bg-card-background shadow-2xl",
          flush ? "p-0" : "p-5",
          sizeClasses[size],
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {header ??
          (title ? (
            <div className="mb-4 flex items-start justify-between">
              <h3 className="text-lg font-medium text-foreground">{title}</h3>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-card-foreground"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          ) : null)}
        <div className={cn(!flush && "space-y-4", contentClassName)}>
          {children}
        </div>
        {footer && (
          <div
            className={cn(
              flush
                ? "border-t border-border-color"
                : "mt-4 flex justify-end space-x-3 border-t pt-4",
              footerClassName,
            )}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
