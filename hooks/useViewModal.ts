"use client";

import { useCallback, useState } from "react";

/**
 * Tiny helper for "view" or "detail" modals that hold a selected item.
 *
 * Pages used to manage two pieces of state separately:
 *   const [selected, setSelected] = useState<T | null>(null);
 *   const [show, setShow] = useState(false);
 *
 * Now it's a single hook with `open(item)` / `close()`.
 */
export function useViewModal<T>() {
  const [selected, setSelected] = useState<T | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback((item: T) => {
    setSelected(item);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setSelected(null);
  }, []);

  return { selected, setSelected, isOpen, open, close };
}
