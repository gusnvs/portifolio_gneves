"use client";

import { useEffect, useState } from "react";
import { useProgress } from "@react-three/drei";
import { useMania } from "../store";

/**
 * Overlay de carregamento: cabeça do boneco balançando + barra de progresso.
 * useProgress observa o DefaultLoadingManager do three (texturas do canvas).
 */
export function Preloader() {
  const { progress, active } = useProgress();
  const [minTimePassed, setMinTimePassed] = useState(false);
  const [gone, setGone] = useState(false);

  const done = minTimePassed && (progress >= 100 || !active);

  useEffect(() => {
    const t = setTimeout(() => setMinTimePassed(true), 900);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!done) return;
    // libera a chuva de bonecos enquanto o overlay ainda desvanece
    useMania.setState({ ready: true });
    const t = setTimeout(() => setGone(true), 700);
    return () => clearTimeout(t);
  }, [done]);

  if (gone) return null;

  const pct = Math.round(Math.min(100, Math.max(progress, active ? progress : 100)));

  return (
    <div className={`mania-preloader${done ? " mania-preloader--done" : ""}`}>
      <img
        src="/snowmania/chars/cabeca.webp"
        alt=""
        className="mania-preloader__head"
      />
      <div className="mania-preloader__bar">
        <span style={{ width: `${pct}%` }} />
      </div>
      <span className="mania-preloader__pct">{pct}%</span>
    </div>
  );
}
