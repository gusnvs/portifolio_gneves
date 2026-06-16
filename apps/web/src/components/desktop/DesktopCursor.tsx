"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

type Variant = "default" | "pointer" | "text";

const STROKE = "#161616";
const FILL = "#f5ede0";

function Arrow() {
  return (
    <svg width="20" height="22" viewBox="0 0 20 22" style={{ display: "block" }}>
      <path
        d="M0 0 L0 15.6 L4.5 11.7 L7.3 17.7 L9.9 16.5 L7 10.8 L12.6 10.8 Z"
        fill={FILL}
        stroke={STROKE}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Hand() {
  return (
    <svg width="22" height="24" viewBox="0 0 22 24" style={{ display: "block" }}>
      <path
        d="M7 1.6c-1 0-1.8.8-1.8 1.8V12L3.9 10.8c-.7-.7-1.8-.7-2.5 0s-.7 1.8 0 2.5l3.6 4.1c.8 1.1 2 2.2 3.7 2.2h3.6c2 0 3.7-1.7 3.7-3.7V8.9c0-.9-.8-1.6-1.7-1.6-.3 0-.5 0-.8.1-.1-.8-.8-1.4-1.6-1.4-.3 0-.6.1-.8.2-.2-.7-.9-1.2-1.7-1.2-.3 0-.5 0-.7.1V3.4c0-1-.8-1.8-1.8-1.8z"
        fill={FILL}
        stroke={STROKE}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Beam() {
  const d = "M3 2 H7 M5 2 V18 M3 18 H7";
  return (
    <svg width="10" height="20" viewBox="0 0 10 20" style={{ display: "block" }}>
      <path d={d} stroke={FILL} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d={d} stroke={STROKE} strokeWidth="1.3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

const POINTER_SEL =
  'button, a, [role="button"], .desk-icon, .win-title, .win-btn, .start-btn, .task-btn, .start-menu-item, label, summary, select, [data-pointer]';

export function DesktopCursor() {
  const ref = useRef<HTMLDivElement>(null);
  const [variant, setVariant] = useState<Variant>("default");

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!fine) return;

    document.body.dataset.deskcursor = "on";
    const el = ref.current!;
    const xTo = gsap.quickTo(el, "x", { duration: 0.09, ease: "power3" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.09, ease: "power3" });

    let visible = false;
    const onMove = (e: PointerEvent) => {
      if (!visible) {
        visible = true;
        gsap.to(el, { autoAlpha: 1, duration: 0.2 });
      }
      xTo(e.clientX);
      yTo(e.clientY);
    };
    const onOver = (e: Event) => {
      const t = e.target as HTMLElement | null;
      if (!t?.closest) return;
      if (t.closest('input, textarea, [contenteditable="true"]')) setVariant("text");
      else if (t.closest(POINTER_SEL)) setVariant("pointer");
      else setVariant("default");
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });

    return () => {
      delete document.body.dataset.deskcursor;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
    };
  }, []);

  const hotspot =
    variant === "pointer"
      ? "translate(-7px, -1.5px)"
      : variant === "text"
        ? "translate(-5px, -10px)"
        : "translate(0, 0)";

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[99999] opacity-0 drop-shadow-[0_2px_3px_rgba(0,0,0,0.4)]"
      style={{ willChange: "transform" }}
    >
      <div style={{ transform: hotspot }}>
        {variant === "pointer" ? <Hand /> : variant === "text" ? <Beam /> : <Arrow />}
      </div>
    </div>
  );
}
