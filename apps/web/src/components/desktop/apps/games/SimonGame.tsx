"use client";

import { useRef, useState } from "react";
import { GameOver } from "./Leaderboard";

const PADS = ["#ff6a1a", "#4a6cff", "#1ec07a", "#ffd23f"];
const rand = () => Math.floor(Math.random() * 4);

export function SimonGame() {
  const [sequence, setSequence] = useState<number[]>([]);
  const [phase, setPhase] = useState<"idle" | "watch" | "input" | "over">("idle");
  const [active, setActive] = useState<number | null>(null);
  const inputIndex = useRef(0);
  const points = useRef(0);

  const playSequence = (seq: number[]) => {
    setPhase("watch");
    let i = 0;
    const step = () => {
      if (i >= seq.length) {
        setActive(null);
        inputIndex.current = 0;
        setPhase("input");
        return;
      }
      setActive(seq[i]);
      setTimeout(() => {
        setActive(null);
        setTimeout(() => {
          i++;
          step();
        }, 200);
      }, 450);
    };
    setTimeout(step, 500);
  };

  const start = () => {
    points.current = 0;
    const seq = [rand()];
    setSequence(seq);
    playSequence(seq);
  };

  const press = (pad: number) => {
    if (phase !== "input") return;
    setActive(pad);
    setTimeout(() => setActive(null), 150);
    if (pad === sequence[inputIndex.current]) {
      inputIndex.current++;
      if (inputIndex.current === sequence.length) {
        points.current = sequence.length;
        const next = [...sequence, rand()];
        setSequence(next);
        setPhase("watch");
        setTimeout(() => playSequence(next), 650);
      }
    } else {
      setPhase("over");
    }
  };

  if (phase === "over") {
    return (
      <div className="flex flex-col items-center gap-3">
        <span className="font-bold">🎵 Simon Says</span>
        <GameOver game="simon" points={points.current} onRestart={start} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-full max-w-[220px] items-center justify-between">
        <span className="font-bold">🎵 Simon Says</span>
        <span className="text-[#7a2c05]">Rodada {sequence.length || 0}</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {PADS.map((color, i) => (
          <button
            key={i}
            onClick={() => press(i)}
            disabled={phase !== "input"}
            className="h-24 w-24 rounded border-2 border-[#161616] transition-opacity"
            style={{ background: color, opacity: active === i ? 1 : 0.45 }}
          />
        ))}
      </div>

      <p className="text-center text-[11px] text-[#5a564d]">
        {phase === "idle"
          ? "Repita a sequência que piscar."
          : phase === "watch"
            ? "Observe…"
            : "Sua vez!"}
      </p>

      {phase === "idle" && (
        <button className="btn-95" onClick={start}>
          Começar
        </button>
      )}
    </div>
  );
}
