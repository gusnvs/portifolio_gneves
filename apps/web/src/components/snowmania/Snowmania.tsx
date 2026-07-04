"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SmoothScroll } from "@/components/shared/SmoothScroll";
import { Stage } from "./Stage";
import { Header } from "./ui/Header";
import { ProgressDots } from "./ui/ProgressDots";
import { Preloader } from "./ui/Preloader";
import { MouseGlow } from "./ui/MouseGlow";
import {
  IntroSection,
  FallSection,
  BioSection,
  NightSection,
} from "./sections/Sections";
import { useMania } from "./store";
import {
  BG_STOPS,
  SCROLL_VH,
  INK_DARK,
  INK_LIGHT,
  NIGHT_INK_SWITCH_VH,
} from "./config";

function bgColorAt(scrollVh: number): string {
  for (let i = 0; i < BG_STOPS.length - 1; i++) {
    const [a, colorA] = BG_STOPS[i];
    const [b, colorB] = BG_STOPS[i + 1];
    if (scrollVh <= b) {
      const t = gsap.utils.clamp(0, 1, (scrollVh - a) / (b - a));
      return gsap.utils.interpolate(colorA, colorB)(t);
    }
  }
  return BG_STOPS[BG_STOPS.length - 1][1];
}

export function Snowmania() {
  const rootRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const trigger = ScrollTrigger.create({
      trigger: rootRef.current,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        const scrollVh = self.progress * SCROLL_VH;
        useMania.setState({ progress: self.progress, scrollVh });
        if (bgRef.current) {
          bgRef.current.style.backgroundColor = bgColorAt(scrollVh);
        }
        const night = scrollVh > NIGHT_INK_SWITCH_VH;
        rootRef.current?.style.setProperty(
          "--mania-ink",
          night ? INK_LIGHT : INK_DARK,
        );
        rootRef.current?.style.setProperty(
          "--mania-paper",
          night ? "#0e0c10" : "#f5eddb",
        );
      },
    });
    return () => trigger.kill();
  }, []);

  return (
    <SmoothScroll>
      <div ref={rootRef} className="snowmania relative">
        {/* filtros SVG do efeito "linha fervendo" dos botões */}
        <svg width="0" height="0" aria-hidden className="absolute">
          <defs>
            <filter id="mania-wobble-1">
              <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="3" result="n" />
              <feDisplacementMap in="SourceGraphic" in2="n" scale="4" />
            </filter>
            <filter id="mania-wobble-2">
              <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="11" result="n" />
              <feDisplacementMap in="SourceGraphic" in2="n" scale="4" />
            </filter>
            <filter id="mania-wobble-3">
              <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="27" result="n" />
              <feDisplacementMap in="SourceGraphic" in2="n" scale="4" />
            </filter>
          </defs>
        </svg>
        <div
          ref={bgRef}
          className="fixed inset-0 z-0"
          style={{ backgroundColor: BG_STOPS[0][1] }}
        />
        <MouseGlow />
        <Stage />
        <Header />
        <ProgressDots />
        <Preloader />
        {/* texto NA FRENTE do canvas (z-30 > z-20), como no site de referência */}
        <main className="relative z-30">
          <IntroSection />
          <FallSection />
          <BioSection />
          <NightSection />
        </main>
      </div>
    </SmoothScroll>
  );
}
