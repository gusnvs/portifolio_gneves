"use client";

import Link from "next/link";
import { SECTION_VH } from "../config";

/**
 * Camada DOM das 4 seções. Cada seção é um trilho alto com conteúdo
 * sticky centralizado — o canvas (z-20) passa por cima do texto (z-10).
 * Todos os textos são placeholders: o Gustavo vai reescrever a bio depois.
 */

export function IntroSection() {
  return (
    <section id="intro" style={{ height: `${SECTION_VH.intro}vh` }} className="relative">
      <div className="sticky top-0 flex h-screen flex-col items-center justify-center px-6">
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
  return (
    <section id="sobre" style={{ height: `${SECTION_VH.fall}vh` }} className="relative">
      <div className="sticky top-0 flex h-screen items-center px-[8vw]">
        <div className="max-w-xl" style={{ color: "#161310" }}>
          <h2 className="mania-title-2 lowercase">sim, a lenda: sou eu!</h2>
          <p className="mania-copy mt-6">
            Sou o Gustavo, desenvolvedor full-stack apaixonado por interfaces
            vivas. Entre um deploy e outro, quem assume o teclado é o boneco de
            neve — com a ajuda do Café e do Energético, a dupla que mantém o
            servidor (e o dev) acordado.
          </p>
        </div>
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
      <div className="sticky top-0 flex h-screen flex-col items-center justify-center gap-8 px-6 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-[-10vw] bottom-0 h-[55vh]"
          style={{
            background:
              "radial-gradient(60% 90% at 50% 100%, rgba(255,138,61,0.2), transparent 70%)",
          }}
        />
        <h2 className="mania-title lowercase" style={{ color: "#f4ece0" }}>
          quer ver o resto? entra no sistema!
        </h2>
        <p className="mania-copy max-w-lg" style={{ color: "#cdc7bb" }}>
          O portfólio completo vive num desktop retrô: projetos, jogos,
          guestbook e um terminal de verdade.
        </p>
        <Link
          href="/system"
          className="mania-pill mania-pill--big pointer-events-auto"
          style={{ color: "#f4ece0" }}
        >
          abrir o terminal
        </Link>
        {/* amigos do boneco — viram sprites da cena noturna depois */}
        <img
          src="/snowmania/chars/toast-cafe.webp"
          alt=""
          aria-hidden
          className="mania-bob pointer-events-none absolute bottom-[-2vh] left-[6vw] w-[clamp(160px,22vw,360px)]"
        />
        <img
          src="/snowmania/chars/toast-energetico.webp"
          alt=""
          aria-hidden
          className="mania-bob pointer-events-none absolute bottom-[-2vh] right-[6vw] w-[clamp(140px,19vw,320px)]"
          style={{ animationDelay: "-2.6s" }}
        />
      </div>
    </section>
  );
}
