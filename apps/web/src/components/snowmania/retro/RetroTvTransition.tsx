"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

/**
 * Transição "entrar no sistema" — a TV PERDE O SINAL. A tela inteira do
 * usuário vira chuvisco de TV antiga (ruído grosso, RGB fantasma, barras de
 * interferência deslocando, hum-bar de vertical-hold rolando, scanlines),
 * depois a imagem COLAPSA numa linha brilhante e apaga (TV desligando). Ao
 * apagar, navega pro /system — onde o TerminalBootReveal RELIGA a TV (a linha
 * abre revelando o terminal). Efeito 100% DOM/canvas, sobre a seção inteira.
 */
export function RetroTvTransition({ onDone }: { onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // "latest ref" do callback — o loop de rAF chama o valor atual sem re-rodar
  // o efeito (que roda só na montagem)
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // ruído renderizado em baixa resolução (pixel "grosso" retrô) e escalado
    // pra tela cheia com nearest-neighbor — barato e com cara de sinal ruim
    const noise = document.createElement("canvas");
    const nctx = noise.getContext("2d");
    if (!nctx) return;

    let W = 0;
    let H = 0;
    let nW = 0;
    let nH = 0;
    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
      nW = noise.width = Math.max(180, Math.round(W / 6));
      nH = noise.height = Math.max(100, Math.round(H / 6));
    };
    resize();
    window.addEventListener("resize", resize);

    // preenche o offscreen com ruído branco (chuvisco)
    const fillNoise = () => {
      const img = nctx.createImageData(nW, nH);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = Math.random() * 255;
        d[i] = d[i + 1] = d[i + 2] = v;
        d[i + 3] = 255;
      }
      nctx.putImageData(img, 0, 0);
    };

    let raf = 0;
    let start = 0;
    let navigated = false;
    const DUR = 2100; // a interferência CHEGA AOS POUCOS, toma conta, e desliga
    const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

    const draw = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min(1, (ts - start) / DUR);

      // interferência SOBE devagar (ease-in) nos primeiros ~60% — começa quase
      // imperceptível e vai "chegando", como um sinal que se degrada aos poucos
      const rise = clamp01(p / 0.6);
      const creep = rise * rise;

      // TV desligando (colapso vertical) só bem no fim
      const collapseP = clamp01((p - 0.82) / 0.18);
      const collapseEase = collapseP * collapseP;
      const bandH = H * (1 - collapseEase);
      const yTop = (H - bandH) / 2;

      // canvas começa TRANSPARENTE (a seção aparece atrás e vai sumindo) — nada
      // de trocar a tela de uma vez
      ctx.clearRect(0, 0, W, H);

      // o preto só entra DEPOIS que o chuvisco já apareceu (creep > 0.25) e no
      // colapso; assim o começo é só "neve" por cima da imagem, sem escurecer
      const blackA = Math.max(clamp01((creep - 0.25) / 0.75) * 0.9, collapseEase);
      if (blackA > 0.01) {
        ctx.fillStyle = `rgba(4,3,5,${Math.min(1, blackA)})`;
        ctx.fillRect(0, 0, W, H);
      }
      // fora do "tubo" no colapso é sempre preto sólido
      if (collapseEase > 0) {
        ctx.fillStyle = "#040305";
        ctx.fillRect(0, 0, W, yTop);
        ctx.fillRect(0, yTop + bandH, W, H);
      }

      if (bandH > 1 && creep > 0.003) {
        fillNoise();
        ctx.imageSmoothingEnabled = false;

        // chuvisco ambiente — opacidade sobe de ~0 → 1 conforme a interferência
        ctx.globalAlpha = creep;
        ctx.drawImage(noise, 0, 0, nW, nH, 0, yTop, W, bandH);

        // fantasma RGB (só quando o sinal já está bem ruim)
        if (creep > 0.25) {
          const jitter = (2 + Math.random() * 6) * creep;
          ctx.globalCompositeOperation = "lighter";
          ctx.globalAlpha = 0.35 * creep;
          ctx.drawImage(noise, 0, 0, nW, nH, -jitter, yTop, W, bandH);
          ctx.drawImage(noise, 0, 0, nW, nH, jitter, yTop, W, bandH);
          ctx.globalCompositeOperation = "source-over";
        }
        ctx.globalAlpha = 1;

        // barras de interferência — 1 tímida no começo, várias no auge
        const bandCount = Math.round(creep * 6);
        for (let i = 0; i < bandCount; i++) {
          const by = yTop + Math.random() * bandH;
          const bh = Math.min(yTop + bandH - by, 3 + Math.random() * 20);
          if (bh <= 1) continue;
          const dx = (Math.random() - 0.5) * 90 * creep;
          ctx.globalAlpha = 0.45 + 0.55 * creep;
          ctx.drawImage(noise, 0, 0, nW, nH, dx, by, W, bh);
          ctx.globalAlpha = 1;
          ctx.fillStyle =
            Math.random() > 0.5
              ? `rgba(255,150,70,${0.12 * creep})`
              : `rgba(0,0,0,${0.25 * creep})`;
          ctx.fillRect(0, by, W, bh);
        }

        // hum-bar (vertical-hold) rolando — fraca no início, cresce com o creep
        if (creep > 0.04) {
          const barY = yTop + (((-ts * 0.28) % bandH) + bandH) % bandH;
          const bg = ctx.createLinearGradient(0, barY - 50, 0, barY + 50);
          bg.addColorStop(0, "rgba(0,0,0,0)");
          bg.addColorStop(0.5, `rgba(0,0,0,${0.14 + 0.3 * creep})`);
          bg.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = bg;
          ctx.fillRect(0, barY - 50, W, 100);
        }

        // scanlines assentam junto com o chuvisco
        ctx.fillStyle = `rgba(0,0,0,${0.05 + 0.12 * creep})`;
        for (let y = Math.ceil(yTop); y < yTop + bandH; y += 3) ctx.fillRect(0, y, W, 1);

        // flicker quente ocasional (o tubo "esquentando"), bem sutil
        if (creep > 0.4 && Math.random() < 0.05) {
          ctx.fillStyle = `rgba(255,235,210,${0.04 + Math.random() * 0.06})`;
          ctx.fillRect(0, yTop, W, bandH);
        }
      }

      // linha brilhante do colapso (imagem "sugada" pro centro e apagando)
      if (collapseP > 0.12) {
        const lineGlow = Math.min(1, collapseP * 1.25);
        const lh = Math.max(1.5, 9 * (1 - collapseEase) + 1.5);
        const lw = collapseP > 0.85 ? Math.max(0.02, 1 - (collapseP - 0.85) / 0.15) * W : W;
        const lg = ctx.createLinearGradient(0, H / 2 - lh, 0, H / 2 + lh);
        lg.addColorStop(0, "rgba(255,240,215,0)");
        lg.addColorStop(0.5, `rgba(255,252,244,${lineGlow})`);
        lg.addColorStop(1, "rgba(255,240,215,0)");
        ctx.fillStyle = lg;
        ctx.fillRect((W - lw) / 2, H / 2 - lh, lw, lh * 2);
      }

      // navega quando já está quase preto — a linha "religa" no /system
      if (p >= 0.92 && !navigated) {
        navigated = true;
        try {
          sessionStorage.setItem("gneves:boot", "1");
        } catch {
          /* sem sessionStorage */
        }
        doneRef.current();
      }

      if (p < 1) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return createPortal(
    <canvas ref={canvasRef} className="retro-tv-glitch" aria-hidden />,
    document.body,
  );
}
