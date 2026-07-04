"use client";

import { useEffect, useRef } from "react";

/**
 * Mancha laranja suave que segue o mouse com atraso — aparece só enquanto
 * ele se move e desvanece devagar quando para. Desligada em telas de toque.
 */
export function MouseGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(hover: none)").matches) return;
    const el = ref.current;
    if (!el) return;

    const HALF = 280; // metade dos 560px do blob
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let targetX = x;
    let targetY = y;
    let opacity = 0;
    let lastMove = 0;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      lastMove = performance.now();
    };

    const tick = () => {
      x += (targetX - x) * 0.09;
      y += (targetY - y) * 0.09;
      const idleMs = performance.now() - lastMove;
      const target = lastMove > 0 && idleMs < 140 ? 0.65 : 0;
      // sobe devagar, desce mais devagar ainda — sutil e suave
      opacity += (target - opacity) * (target > opacity ? 0.07 : 0.035);
      el.style.transform = `translate3d(${x - HALF}px, ${y - HALF}px, 0)`;
      el.style.opacity = opacity.toFixed(3);
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <div ref={ref} className="mania-glow" aria-hidden />;
}
