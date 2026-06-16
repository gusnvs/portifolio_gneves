"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

export function Preloader({ onComplete }: { onComplete: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);
  const [hidden, setHidden] = useState(false);

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const counter = { v: 0 };

      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        onComplete: () => {
          setHidden(true);
          onComplete();
        },
      });

      tl.from(".pl-brand span", {
        yPercent: 120,
        duration: 0.8,
        stagger: 0.04,
      })
        .from(".pl-mascot", { scale: 0.6, autoAlpha: 0, duration: 0.7 }, "-=0.4")
        .to(
          counter,
          {
            v: 100,
            duration: reduce ? 0.4 : 1.8,
            ease: "power1.inOut",
            onUpdate: () => setCount(Math.round(counter.v)),
          },
          "-=0.5",
        )
        .to(".pl-bar-fill", { scaleX: 1, duration: reduce ? 0.4 : 1.8, ease: "power1.inOut" }, "<")
        .to(".pl-content", { autoAlpha: 0, duration: 0.4 }, "+=0.15")
        .to(".pl-panel", {
          yPercent: -100,
          duration: 0.9,
          ease: "power4.inOut",
          stagger: 0.08,
        });
    },
    { scope: root },
  );

  if (hidden) return null;

  return (
    <div ref={root} className="fixed inset-0 z-[90]" aria-hidden>
      <div className="absolute inset-0 flex">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="pl-panel h-full flex-1 bg-bg" />
        ))}
      </div>

      <div className="pl-content scanlines absolute inset-0 flex flex-col justify-between p-6 md:p-10">
        <div className="flex items-start justify-between">
          <p className="pl-brand overflow-hidden font-mono text-xs uppercase tracking-[0.25em] text-muted">
            {"Gustavo Neves".split(" ").map((w, i) => (
              <span key={i} className="mr-2 inline-block">
                {w}
              </span>
            ))}
          </p>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-muted">
            iniciando<span className="text-orange">_</span>
          </p>
        </div>

        <div className="flex flex-col items-center gap-6">
          <div className="pl-mascot relative h-28 w-28 md:h-36 md:w-36">
            <Image src="/mascote.png" alt="" fill priority className="object-contain" />
          </div>
          <div className="h-px w-56 overflow-hidden bg-line md:w-80">
            <div className="pl-bar-fill h-full origin-left scale-x-0 bg-orange" />
          </div>
        </div>

        <div className="flex items-end justify-between">
          <p className="max-w-[16ch] font-mono text-[11px] leading-relaxed text-faint">
            inicializando o runtime do portfólio…
          </p>
          <p className="font-display text-6xl font-extrabold leading-none text-fg md:text-8xl">
            {String(count).padStart(3, "0")}
          </p>
        </div>
      </div>
    </div>
  );
}
