"use client";

import { useEffect, useRef } from "react";
import { useMania } from "../store";
import { CARD_PHASE } from "../config";

/*
 * Cards de projeto da seção "sim, a lenda" — camada DOM na frente do canvas.
 * A imagem central (rig) passeia de lado a lado (ver SnowmanRig) e estes
 * cards entram/saem pelas laterais no mesmo compasso, tudo dirigido pelo
 * scroll. Cada card tem uma janela em cardP (0..1): entra deslizando de fora,
 * segura, e sai de volta pro mesmo lado.
 *
 * PLACEHOLDER: troque PROJECTS pelos seus projetos reais (título, papel,
 * descrição, tags e link). A mecânica não depende do conteúdo.
 */

interface Project {
  index: string;
  title: string;
  role: string;
  description: string;
  tags: string[];
  href: string;
  /** "right" entra/sai pela direita; "left" pela esquerda */
  side: "right" | "left";
  /** cartão escuro ou creme */
  theme: "ink" | "cream";
  /** janela de aparição em cardP: [entra0, entra1, sai0, sai1] */
  window: [number, number, number, number];
}

const PROJECTS: Project[] = [
  {
    index: "01",
    title: "projeto um",
    role: "web · interativo",
    description:
      "Um recorte do que eu construo: interfaces vivas, animação dirigida por scroll e um capricho obsessivo nos detalhes. Troque este texto pelo seu projeto real.",
    tags: ["Next.js", "WebGL", "GSAP"],
    href: "#",
    side: "right",
    theme: "ink",
    window: [0.06, 0.16, 0.34, 0.44],
  },
  {
    index: "02",
    title: "projeto dois",
    role: "full-stack · produto",
    description:
      "Outro trabalho recente — da API ao pixel. Aqui vai a descrição curta do que ele resolve e da sua parte nele. Este é um texto de exemplo.",
    tags: ["React", "Node", "Postgres"],
    href: "#",
    side: "left",
    theme: "cream",
    window: [0.56, 0.66, 0.84, 0.94],
  },
];

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smooth = (u: number) => u * u * (3 - 2 * u);

export function ProjectCards() {
  const cardRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const apply = (scrollVh: number) => {
      const cardP = clamp01(
        (scrollVh - CARD_PHASE.start) / (CARD_PHASE.end - CARD_PHASE.start),
      );
      for (let i = 0; i < PROJECTS.length; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;
        const p = PROJECTS[i];
        const [e0, e1, x0, x1] = p.window;
        const enter = smooth(clamp01((cardP - e0) / (e1 - e0)));
        const exit = smooth(clamp01((cardP - x0) / (x1 - x0)));
        const vis = enter * (1 - exit);
        const dir = p.side === "right" ? 1 : -1;
        // desliza de fora (135% da própria largura) na entrada e na saída
        const tx = dir * ((1 - enter) * 135 + exit * 135);
        const rot = dir * -1.5 + dir * ((1 - enter) * 7 - exit * 5);
        const scale = 0.92 + 0.08 * vis;
        el.style.transform = `translate(${tx}%, -50%) rotate(${rot}deg) scale(${scale})`;
        el.style.opacity = String(vis);
        el.style.visibility = vis < 0.01 ? "hidden" : "visible";
        el.style.setProperty("--enter", String(enter));
      }
    };

    apply(useMania.getState().scrollVh);
    return useMania.subscribe((s) => apply(s.scrollVh));
  }, []);

  return (
    <div className="mania-cards" aria-hidden={false}>
      {PROJECTS.map((p, i) => (
        <article
          key={p.index}
          ref={(el) => {
            cardRefs.current[i] = el;
          }}
          className={`mania-pcard mania-pcard--${p.side} mania-pcard--${p.theme}`}
        >
          <div className="mania-pcard__inner">
            <span className="mania-pcard__index">{p.index}</span>
            <span className="mania-pcard__role">{p.role}</span>
            <h3 className="mania-pcard__title">{p.title}</h3>
            <p className="mania-pcard__text">{p.description}</p>
            <ul className="mania-pcard__tags">
              {p.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
            <a
              className="mania-pcard__link"
              href={p.href}
              target={p.href.startsWith("http") ? "_blank" : undefined}
              rel="noreferrer"
            >
              ver projeto
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>
        </article>
      ))}
    </div>
  );
}
