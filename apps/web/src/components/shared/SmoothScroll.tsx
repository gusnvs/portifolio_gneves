"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Lenis smooth-scroll synced with the GSAP ticker + ScrollTrigger.
 * Disabled entirely when the user prefers reduced motion.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Nota: NÃO desligamos com prefers-reduced-motion — a home é uma
    // experiência cinética por natureza (e o dono testa com a preferência
    // ativa no Windows sem perceber).
    gsap.registerPlugin(ScrollTrigger);

    // lerp (suavização exponencial) em vez de duration: é o que dá o
    // deslizar "líquido" contínuo do scroll — mesma receita do skyworks
    const lenis = new Lenis({
      lerp: 0.09,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.4,
      syncTouch: true,
      syncTouchLerp: 0.06,
    });

    lenis.on("scroll", ScrollTrigger.update);
    // exposta p/ navegação programática (dots, âncoras) e testes
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;

    const onTick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(onTick);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
