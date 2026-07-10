"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Continuação da transição "entrar na tela" do computador retrô da home.
 * A home termina com a TV DESLIGANDO (imagem colapsa numa linha branca);
 * aqui a TV RELIGA: do preto, uma linha brilhante acende no centro e abre
 * verticalmente revelando o terminal, com chuvisco e scanlines assentando.
 * Visita direta a /system NÃO dispara (fica instantâneo).
 */
export function TerminalBootReveal() {
  const [show, setShow] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // NÃO remove o flag aqui: o StrictMode em dev monta→desmonta→monta, e se
    // consumíssemos na 1ª montagem (descartada) a 2ª não veria mais nada.
    // A remoção acontece quando a animação de fato começa (efeito de baixo).
    let armed = false;
    try {
      armed = sessionStorage.getItem("gneves:boot") === "1";
    } catch {
      /* sem sessionStorage */
    }
    if (armed) setShow(true);
  }, []);

  useEffect(() => {
    if (!show) return;
    // agora sim consome o flag (a animação vai rodar)
    try {
      sessionStorage.removeItem("gneves:boot");
    } catch {
      /* noop */
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    let start = 0;
    const DUR = 1600;

    const draw = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min(1, (ts - start) / DUR);
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // fases da TV ligando:
      // 0..0.14  linha brilhante cresce do centro na horizontal
      // 0.14..0.62 a "janela" abre na vertical revelando o terminal
      // 0.62..1  chuvisco/scanlines/flicker assentam
      const pLine = Math.min(1, p / 0.14);
      const pOpen = Math.min(1, Math.max(0, (p - 0.14) / 0.48));
      const openEase = pOpen * pOpen * (3 - 2 * pOpen);
      const settle = Math.max(0, 1 - Math.max(0, (p - 0.62) / 0.38)); // 1→0

      const winH = (h / 2) * openEase; // meia-altura da janela aberta
      const yTop = h / 2 - winH;
      const yBot = h / 2 + winH;

      // fora da janela: preto (a tela ainda "fria")
      ctx.fillStyle = "#030205";
      ctx.fillRect(0, 0, w, yTop);
      ctx.fillRect(0, yBot, w, h - yBot);

      // bordas da janela: fósforo aceso (linha que abre), esvai no fim
      const edgeGlow = pOpen < 1 ? 0.85 : settle * 0.5;
      if (edgeGlow > 0.02) {
        for (const ey of [yTop, yBot]) {
          const eg = ctx.createLinearGradient(0, ey - 9, 0, ey + 9);
          eg.addColorStop(0, "rgba(255,240,215,0)");
          eg.addColorStop(0.5, `rgba(255,250,238,${edgeGlow})`);
          eg.addColorStop(1, "rgba(255,240,215,0)");
          ctx.fillStyle = eg;
          ctx.fillRect(0, ey - 9, w, 18);
        }
      }

      // fase 1: só a linha central acendendo (cresce do centro pras pontas)
      if (pOpen === 0) {
        const lw = w * pLine;
        const lx = (w - lw) / 2;
        ctx.fillStyle = "#030205";
        ctx.fillRect(0, 0, w, h); // tudo preto por cima
        const lg = ctx.createLinearGradient(0, h / 2 - 7, 0, h / 2 + 7);
        lg.addColorStop(0, "rgba(255,240,215,0)");
        lg.addColorStop(0.5, `rgba(255,252,244,${0.55 + 0.45 * pLine})`);
        lg.addColorStop(1, "rgba(255,240,215,0)");
        ctx.fillStyle = lg;
        ctx.fillRect(lx, h / 2 - 7, lw, 14);
      }

      // chuvisco dentro da janela aberta, assentando
      if (winH > 2 && settle > 0.02) {
        const grains = Math.floor(320 * settle);
        for (let i = 0; i < grains; i++) {
          const gx = Math.random() * w;
          const gy = yTop + Math.random() * (yBot - yTop);
          const lum = Math.random() > 0.5 ? 255 : 20;
          ctx.fillStyle = `rgba(${lum},${lum},${lum},${0.08 + Math.random() * 0.16 * settle})`;
          ctx.fillRect(gx, gy, 1.5 + Math.random() * 2, 1.5 + Math.random() * 2);
        }
        // scanlines suaves dentro da janela
        ctx.fillStyle = `rgba(0,0,0,${0.1 * settle})`;
        for (let y = Math.ceil(yTop); y < yBot; y += 3) ctx.fillRect(0, y, w, 1);
        // flicker quente ocasional (fósforo esquentando)
        if (Math.random() < 0.2 * settle) {
          ctx.fillStyle = "rgba(255,190,120,0.05)";
          ctx.fillRect(0, yTop, w, yBot - yTop);
        }
      }

      if (p < 1) raf = requestAnimationFrame(draw);
      else setShow(false);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [show]);

  if (!show) return null;
  return <canvas ref={canvasRef} className="boot-reveal" aria-hidden />;
}
