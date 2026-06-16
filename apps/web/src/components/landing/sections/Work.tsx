"use client";

import { useState } from "react";
import { Reveal } from "@/components/shared/Reveal";
import { projects } from "@/content/site";

export function Work() {
  const [active, setActive] = useState<string | null>(null);

  return (
    <section id="work" className="relative border-t border-line px-6 py-28 md:px-10 md:py-40">
      <div className="mx-auto max-w-[var(--maxw)]">
        <Reveal className="mb-14 flex items-end justify-between">
          <div>
            <p className="eyebrow mb-4">03 — Trabalhos selecionados</p>
            <h2 className="font-display text-4xl font-extrabold tracking-tight text-fg md:text-6xl">
              Coisas que eu construí
            </h2>
          </div>
          <p className="hidden max-w-[22ch] text-right font-mono text-xs text-faint md:block">
            alguns projetos. o resto mora dentro do sistema &rarr;
          </p>
        </Reveal>

        <ul className="border-t border-line">
          {projects.map((p, i) => {
            const isActive = active === p.slug;
            const Wrapper: React.ElementType = p.link || p.repo ? "a" : "div";
            return (
              <Reveal as="li" key={p.slug} delay={i * 0.04}>
                <Wrapper
                  {...(p.link || p.repo
                    ? {
                        href: p.link ?? p.repo,
                        target: "_blank",
                        rel: "noreferrer",
                        "data-cursor-text": "abrir",
                      }
                    : {})}
                  onMouseEnter={() => setActive(p.slug)}
                  onMouseLeave={() => setActive(null)}
                  className="group relative grid grid-cols-1 items-baseline gap-2 border-b border-line py-7 transition-colors md:grid-cols-[auto_1fr_auto] md:gap-8 md:py-9"
                >
                  <span className="font-mono text-xs text-faint md:text-sm">
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  <div className="flex items-baseline gap-4">
                    <h3
                      className="font-display text-3xl font-extrabold tracking-tight transition-all duration-300 md:text-5xl"
                      style={{ color: isActive ? p.accent : "var(--fg)" }}
                    >
                      {p.title}
                    </h3>
                    <span
                      className="hidden translate-y-[-0.2em] text-2xl opacity-0 transition-all duration-300 group-hover:opacity-100 md:inline"
                      style={{ color: p.accent }}
                    >
                      ↗
                    </span>
                  </div>

                  <div className="flex flex-col items-start gap-2 md:items-end">
                    <p className="font-mono text-xs uppercase tracking-wider text-muted">
                      {p.role} · {p.year}
                    </p>
                    <p className="max-w-[34ch] text-sm text-muted md:text-right">{p.blurb}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5 md:justify-end">
                      {p.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full border border-line px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-faint"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </Wrapper>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
