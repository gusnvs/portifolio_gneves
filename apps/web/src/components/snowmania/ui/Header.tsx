"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useMania } from "../store";
import { SECTION_START_VH } from "../config";

export function Header() {
  const pill = useRef<HTMLAnchorElement>(null);

  // esconde a pill "terminal" na seção final (lá o CTA é o próprio computador)
  useEffect(() => {
    const gate = SECTION_START_VH.night - 60;
    return useMania.subscribe((s) => {
      const el = pill.current;
      if (!el) return;
      const hide = s.scrollVh > gate;
      el.style.opacity = hide ? "0" : "1";
      el.style.pointerEvents = hide ? "none" : "auto";
    });
  }, []);

  return (
    <header
      className="fixed inset-x-0 top-0 z-40 flex items-center justify-between px-6 py-5 md:px-10"
      style={{ color: "var(--mania-ink, #161310)" }}
    >
      <Link
        href="/"
        className="font-display text-lg font-extrabold lowercase leading-[0.9]"
      >
        gustavo
        <br />
        neves
      </Link>
      <Link
        ref={pill}
        href="/system"
        className="mania-pill mania-pill--small pointer-events-auto"
        style={{ transition: "opacity 0.4s ease" }}
      >
        terminal
      </Link>
    </header>
  );
}
