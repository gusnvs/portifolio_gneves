"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, type Variants } from "motion/react";
import { SECTION_VH, SECTION_START_VH } from "../config";
import { useMania } from "../store";
import { RetroComputer } from "../retro/RetroComputer";

/* Efeito dos textos (replay a cada re-entrada na viewport):
   título = palavras deslizam da esquerda; corpo = blur-in palavra a palavra.
   A SAÍDA também é animada (espelho da entrada) — nada some seco. */

const titleWord: Variants = {
  hidden: { x: -72, opacity: 0, transition: { duration: 0 } },
  show: (i: number) => ({
    x: 0,
    opacity: 1,
    transition: { delay: i * 0.09, duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  }),
  out: (i: number) => ({
    x: -60,
    opacity: 0,
    transition: { delay: i * 0.045, duration: 0.4, ease: [0.55, 0, 0.55, 0.2] },
  }),
};

const bodyWord: Variants = {
  hidden: { filter: "blur(10px)", opacity: 0, y: 6, transition: { duration: 0 } },
  show: (i: number) => ({
    filter: "blur(0px)",
    opacity: 1,
    y: 0,
    transition: { delay: 0.3 + i * 0.016, duration: 0.35 },
  }),
  out: (i: number) => ({
    filter: "blur(9px)",
    opacity: 0,
    y: -5,
    transition: { delay: i * 0.008, duration: 0.28 },
  }),
};

/**
 * Fase do texto dirigida pelo scroll — a saída é ANIMADA nas DUAS direções:
 * descendo, sai animado antes do pin soltar; subindo de volta, também sai
 * animado enquanto ainda está visível. O reset seco (hidden) só acontece
 * quando a seção já está totalmente fora da tela.
 */
function useRevealPhase(enterVh: number, exitVh: number, resetVh: number) {
  const [phase, setPhase] = useState<"hidden" | "show" | "out">("hidden");
  useEffect(
    () =>
      useMania.subscribe((state) => {
        const v = state.scrollVh;
        setPhase((prev) => {
          if (v >= exitVh) return "out";
          if (v >= enterVh) return "show";
          if (v >= resetVh) {
            // zona de transição embaixo: subindo (vinha visível) sai animado;
            // descendo (ainda escondido) espera o gatilho de entrada
            return prev === "show" || prev === "out" ? "out" : "hidden";
          }
          return "hidden";
        });
      }),
    [enterVh, exitVh, resetVh],
  );
  return phase;
}

function SplitWords({
  text,
  variants,
}: {
  text: string;
  variants: Variants;
}) {
  return (
    <>
      {text.split(" ").map((word, i) => (
        <motion.span
          key={i}
          custom={i}
          variants={variants}
          className="inline-block whitespace-pre"
        >
          {word}{" "}
        </motion.span>
      ))}
    </>
  );
}

/**
 * Camada DOM das 4 seções. Cada seção é um trilho alto com conteúdo
 * sticky centralizado — o canvas (z-20) passa por cima do texto (z-10).
 * Todos os textos são placeholders: o Gustavo vai reescrever a bio depois.
 */

export function IntroSection() {
  return (
    <section id="intro" style={{ height: `${SECTION_VH.intro}vh` }} className="relative">
      {/* sem sticky: o título sobe e some no fluxo, os bonecos ficam.
          relative → o hint "role para descobrir" ancora NESTA primeira tela */}
      <div className="relative flex h-screen flex-col items-center justify-center px-6">
        <h1
          className="mania-title mania-outline max-w-6xl text-center lowercase"
          style={{ color: "#161310", "--mania-outline-color": "#f5eddb" } as React.CSSProperties}
        >
          o portfólio interativo de um dev que transforma café em código.
        </h1>
        <div
          className="mania-scroll-hint"
          style={{ color: "#161310", "--mania-outline-color": "#f5eddb" } as React.CSSProperties}
        >
          <span className="mania-outline">role para descobrir</span>
          <svg
            className="mania-scroll-arrow"
            viewBox="0 0 24 34"
            fill="none"
            aria-hidden
          >
            {/* halo na cor do fundo, mesmo truque do contorno do título */}
            <path
              d="M12 2v26M3.5 21.5 12 30l8.5-8.5"
              stroke="var(--mania-outline-color, #f5eddb)"
              strokeWidth="8.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 2v26M3.5 21.5 12 30l8.5-8.5"
              stroke="currentColor"
              strokeWidth="3.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}

export function FallSection() {
  // entra logo depois da divisa subir; sai animado nas duas direções
  const phase = useRevealPhase(
    SECTION_START_VH.fall - 42,
    SECTION_START_VH.fall + 92,
    SECTION_START_VH.fall - 97,
  );

  return (
    <section id="sobre" style={{ height: `${SECTION_VH.fall}vh` }} className="relative">
      <div className="sticky top-0 flex h-screen items-center px-[8vw]">
        <motion.div
          className="max-w-xl"
          style={{ color: "#161310" }}
          initial="hidden"
          animate={phase}
        >
          <h2 className="mania-title-2 lowercase">
            <SplitWords text="sim, a lenda: sou eu!" variants={titleWord} />
          </h2>
          <p className="mania-copy mt-6">
            <SplitWords
              text="Sou o Gustavo, desenvolvedor full-stack apaixonado por interfaces vivas. Entre um deploy e outro, quem assume o teclado é o boneco de neve — com a ajuda do Café e do Energético, a dupla que mantém o servidor (e o dev) acordado."
              variants={bodyWord}
            />
          </p>
        </motion.div>
      </div>
    </section>
  );
}

export function BioSection() {
  return (
    <section id="bastidores" style={{ height: `${SECTION_VH.bio}vh` }} className="relative">
      <div className="sticky top-0 flex h-screen flex-col justify-center px-[8vw]">
        <h2 className="mania-title-2 relative lowercase" style={{ color: "#161310" }}>
          por trás da lenda
        </h2>
        <div className="mt-24 flex flex-wrap gap-6">
          <article className="mania-card relative">
            <div className="mania-balloon" aria-hidden>
              <img src="/snowmania/chars/cabeca.webp" alt="" />
            </div>
            <h3 className="font-display text-2xl font-extrabold lowercase">gus</h3>
            <p className="mania-copy mt-3">
              Desenvolvedor full-stack. Constrói experiências interativas,
              APIs e tudo que houver no meio do caminho.
            </p>
          </article>
          <article className="mania-card relative">
            <div className="mania-balloon" aria-hidden style={{ animationDelay: "-2.1s" }}>
              <img src="/snowmania/chars/cabeca.webp" alt="" style={{ transform: "scaleX(-1)" }} />
            </div>
            <h3 className="font-display text-2xl font-extrabold lowercase">o boneco</h3>
            <p className="mania-copy mt-3">
              Mascote oficial. Supervisiona cada linha de código e nunca
              derrete sob pressão.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}

export function NightSection() {
  return (
    <section id="terminal" style={{ height: `${SECTION_VH.night}vh` }} className="relative">
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* computador retrô 3D — preenche o lado direito (desktop) / fundo (mobile) */}
        <RetroComputer />
        {/* texto por cima, à esquerda; não bloqueia o clique no computador */}
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-center gap-6 px-[8vw]">
          <h2 className="mania-title max-w-xl lowercase" style={{ color: "#f4ece0" }}>
            quer ver o resto? entra no sistema!
          </h2>
          <p className="mania-copy max-w-md" style={{ color: "#cdc7bb" }}>
            O portfólio completo vive num desktop retrô: projetos, jogos,
            guestbook e um terminal de verdade.
          </p>
          <p className="retro-hint">clique no computador para entrar →</p>
          {/* link acessível invisível — o CTA visual é o próprio computador */}
          <Link href="/system" className="sr-only pointer-events-auto">
            abrir o terminal
          </Link>
        </div>
      </div>
    </section>
  );
}
