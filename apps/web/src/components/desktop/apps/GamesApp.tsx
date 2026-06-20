"use client";

import { useState } from "react";
import { AppScroll, AppHeading } from "./ui";
import { SnakeGame } from "./games/SnakeGame";
import { MemoryGame } from "./games/MemoryGame";
import { SimonGame } from "./games/SimonGame";
import { RunnerGame } from "./games/RunnerGame";
import { Leaderboard, type GameId } from "./games/Leaderboard";

const GAMES: { id: GameId; title: string; icon: string; desc: string }[] = [
  { id: "runner", title: "Boneco Runner", icon: "⛄", desc: "Corra, pule e agache — estilo dino." },
  { id: "snake", title: "Cobra do Boneco", icon: "🐍", desc: "Clássico snake gelado." },
  { id: "memory", title: "Memória", icon: "🧠", desc: "Ache os pares." },
  { id: "simon", title: "Simon Says", icon: "🎵", desc: "Repita a sequência." },
];

export function GamesApp() {
  const [active, setActive] = useState<GameId | null>(null);

  if (active) {
    return (
      <div className="flex h-full flex-col bg-[#f5f1e9] font-system text-[13px] text-[#161616]">
        <div className="border-b border-[#9a958a] px-2 py-1.5">
          <button className="btn-95 text-xs" onClick={() => setActive(null)}>
            ← Voltar aos jogos
          </button>
        </div>
        <div className="grid min-h-0 flex-1 place-items-center overflow-y-auto p-4">
          {active === "runner" && <RunnerGame />}
          {active === "snake" && <SnakeGame />}
          {active === "memory" && <MemoryGame />}
          {active === "simon" && <SimonGame />}
        </div>
      </div>
    );
  }

  return (
    <AppScroll>
      <AppHeading sub="escolha um jogo — sua pontuação entra no ranking">Jogos 🕹️</AppHeading>
      <div className="space-y-2">
        {GAMES.map((g) => (
          <button
            key={g.id}
            onClick={() => setActive(g.id)}
            className="inset flex w-full items-center gap-3 p-3 text-left hover:bg-white"
          >
            <span className="text-3xl">{g.icon}</span>
            <span className="min-w-0">
              <span className="block font-display text-lg font-extrabold">{g.title}</span>
              <span className="block text-xs text-[#5a564d]">{g.desc}</span>
            </span>
            <span className="ml-auto text-[#7a2c05]">jogar ▸</span>
          </button>
        ))}
      </div>

      <div className="mt-4">
        <p className="mb-1 font-bold text-[#7a2c05]">Top jogadores</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {GAMES.map((g) => (
            <div key={g.id}>
              <p className="mb-1 text-center text-xs font-bold">
                {g.icon} {g.title}
              </p>
              <Leaderboard game={g.id} />
            </div>
          ))}
        </div>
      </div>
    </AppScroll>
  );
}
