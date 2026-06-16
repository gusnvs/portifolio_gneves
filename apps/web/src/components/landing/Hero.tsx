"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { profile } from "@/content/site";

const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false });

function SplitWord({ word }: { word: string }) {
  return (
    <span className="inline-block overflow-hidden align-bottom">
      <span className="hero-char inline-block">{word}</span>
    </span>
  );
}

export function Hero({ started }: { started: boolean }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        gsap.set([".hero-char", ".hero-reveal", ".hero-canvas"], { clearProps: "all" });
        gsap.set([".hero-char", ".hero-reveal", ".hero-canvas"], { autoAlpha: 1, y: 0, yPercent: 0 });
        return;
      }
      if (!started) {
        gsap.set(".hero-char", { yPercent: 120 });
        gsap.set(".hero-reveal", { autoAlpha: 0, y: 24 });
        return;
      }
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
      tl.to(".hero-char", { yPercent: 0, duration: 1.1, stagger: 0.06 })
        .to(".hero-reveal", { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.12 }, "-=0.7")
        .from(".hero-canvas", { autoAlpha: 0, duration: 1.4 }, 0);
    },
    { dependencies: [started], scope: root },
  );

  return (
    <section
      ref={root}
      id="intro"
      className="scanlines relative flex min-h-[100svh] flex-col justify-center overflow-hidden px-6 pt-24 md:px-10"
    >
      {/* 3D background */}
      <div className="hero-canvas pointer-events-none absolute inset-0 -z-10">
        <HeroScene />
      </div>
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_40%,rgba(255,106,26,0.10),transparent_70%)]" />

      <div className="mx-auto w-full max-w-[var(--maxw)]">
        <p className="hero-reveal eyebrow mb-6 flex items-center gap-3">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-orange" />
          {profile.availableLabel}
        </p>

        <h1 className="display-xxl text-fg">
          <span className="block">
            <SplitWord word="GUSTAVO" />
          </span>
          <span className="block text-orange">
            <SplitWord word="NEVES" />
          </span>
        </h1>

        <div className="mt-8 flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <p className="hero-reveal max-w-md text-balance text-lg leading-relaxed text-fg-soft">
            {profile.bio}
          </p>

          <div className="hero-reveal flex flex-wrap items-center gap-4">
            <Link
              href="/system"
              data-cursor-text="entrar"
              className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-orange px-7 py-4 font-mono text-sm font-semibold uppercase tracking-wider text-[#120a04] transition-transform hover:scale-[1.03]"
            >
              <span className="relative z-10">Entrar no sistema</span>
              <span className="relative z-10 transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
            <a
              href="#work"
              className="link-underline font-mono text-sm uppercase tracking-wider text-muted hover:text-fg"
            >
              Ver trabalhos
            </a>
          </div>
        </div>
      </div>

      {/* mascot peeking + scroll hint */}
      <div className="hero-reveal pointer-events-none absolute bottom-6 right-6 hidden h-24 w-24 opacity-90 md:block lg:h-32 lg:w-32">
        <Image src="/mascote.png" alt="Mascote boneco de neve do Gustavo" fill className="object-contain" />
      </div>
      <div className="hero-reveal absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-faint">role</span>
        <span className="h-10 w-px animate-pulse bg-gradient-to-b from-orange to-transparent" />
      </div>
    </section>
  );
}
