"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

/**
 * Custom cursor: a precise dot + a trailing ring that grows and labels itself
 * over interactive elements. Only active on fine-pointer devices.
 */
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState("");
  const [variant, setVariant] = useState<"idle" | "hover" | "view">("idle");

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!fine) return;

    document.body.dataset.cursor = "on";
    const dot = dotRef.current!;
    const ring = ringRef.current!;

    const xDot = gsap.quickTo(dot, "x", { duration: 0.15, ease: "power3" });
    const yDot = gsap.quickTo(dot, "y", { duration: 0.15, ease: "power3" });
    const xRing = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3" });
    const yRing = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3" });

    let visible = false;
    const onMove = (e: PointerEvent) => {
      if (!visible) {
        visible = true;
        gsap.to([dot, ring], { autoAlpha: 1, duration: 0.3 });
      }
      xDot(e.clientX);
      yDot(e.clientY);
      xRing(e.clientX);
      yRing(e.clientY);
    };

    const onOver = (e: Event) => {
      const el = (e.target as HTMLElement)?.closest<HTMLElement>(
        "a, button, [data-cursor], input, textarea, [role='button']",
      );
      if (!el) {
        setVariant("idle");
        setLabel("");
        return;
      }
      const text = el.dataset.cursorText;
      if (text) {
        setVariant("view");
        setLabel(text);
      } else {
        setVariant("hover");
        setLabel("");
      }
    };

    const onDown = () => gsap.to(ring, { scale: 0.8, duration: 0.2 });
    const onUp = () => gsap.to(ring, { scale: 1, duration: 0.3 });

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);

    return () => {
      delete document.body.dataset.cursor;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  return (
    <>
      <div
        ref={dotRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[100] h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange opacity-0"
        style={{ mixBlendMode: "difference" }}
      />
      <div
        ref={ringRef}
        aria-hidden
        className={`pointer-events-none fixed left-0 top-0 z-[100] flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full opacity-0 transition-[width,height,background-color,border-color] duration-300 ease-out ${
          variant === "view"
            ? "h-16 w-16 bg-orange text-[#120a04]"
            : variant === "hover"
              ? "h-12 w-12 border border-orange/80 bg-orange/10"
              : "h-9 w-9 border border-fg/40"
        }`}
      >
        {label && (
          <span className="font-mono text-[10px] font-semibold uppercase tracking-wider">
            {label}
          </span>
        )}
      </div>
    </>
  );
}
