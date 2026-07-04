"use client";

import { create } from "zustand";

interface ManiaState {
  /** Progresso global do scroll, 0..1. */
  progress: number;
  /** Scroll em unidades de vh rolados (0..SCROLL_VH). */
  scrollVh: number;
  /** true quando o preloader terminou — dispara a chuva de bonecos. */
  ready: boolean;
}

/**
 * Atualizado a cada frame pelo ScrollTrigger raiz (ver Snowmania.tsx).
 * Cenas 3D leem via useMania.getState() dentro de useFrame — sem re-render.
 */
export const useMania = create<ManiaState>(() => ({
  progress: 0,
  scrollVh: 0,
  ready: false,
}));
