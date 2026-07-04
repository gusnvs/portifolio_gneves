"use client";

import { useEffect, useState } from "react";
import { useMania } from "../store";
import { SECTION_START_VH } from "../config";

const STARTS = [
  SECTION_START_VH.intro,
  SECTION_START_VH.fall,
  SECTION_START_VH.bio,
  SECTION_START_VH.night,
];

export function ProgressDots() {
  const [active, setActive] = useState(0);

  useEffect(
    () =>
      useMania.subscribe((state) => {
        // seção "ativa" = a que ocupa a maior parte da viewport
        const vh = state.scrollVh + 55;
        let idx = 0;
        for (let i = 0; i < STARTS.length; i++) {
          if (vh >= STARTS[i]) idx = i;
        }
        setActive((prev) => (prev === idx ? prev : idx));
      }),
    [],
  );

  return (
    <div
      className="fixed right-5 top-1/2 z-40 flex -translate-y-1/2 flex-col gap-3"
      style={{ color: "var(--mania-ink, #161310)" }}
      aria-hidden
    >
      {STARTS.map((_, i) => (
        <span key={i} className="mania-dot" data-active={i === active} />
      ))}
    </div>
  );
}
