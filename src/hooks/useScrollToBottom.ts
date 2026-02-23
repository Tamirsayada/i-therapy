"use client";

import { useEffect, type RefObject } from "react";

export function useScrollToBottom(
  ref: RefObject<HTMLElement | null>,
  deps: unknown[]
) {
  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTo({
        top: ref.current.scrollHeight,
        behavior: "smooth",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
