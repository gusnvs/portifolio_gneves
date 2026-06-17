"use client";

import { useEffect, useMemo, useState } from "react";
import { GameOver } from "./Leaderboard";

const SYMBOLS = ["❄️", "⛄", "🧊", "🎩", "🥕", "🧣"];

function shuffled() {
  const deck = [...SYMBOLS, ...SYMBOLS].map((emoji, i) => ({ id: i, emoji }));
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function MemoryGame() {
  const [round, setRound] = useState(0);
  const deck = useMemo(() => shuffled(), [round]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [moves, setMoves] = useState(0);
  const [lock, setLock] = useState(false);

  const won = matched.size === deck.length;
  const points = won ? Math.max(50, 1000 - moves * 25) : 0;

  useEffect(() => {
    if (flipped.length !== 2) return;
    setLock(true);
    setMoves((m) => m + 1);
    const [a, b] = flipped;
    if (deck[a].emoji === deck[b].emoji) {
      setMatched((prev) => new Set(prev).add(a).add(b));
      setFlipped([]);
      setLock(false);
    } else {
      const t = setTimeout(() => {
        setFlipped([]);
        setLock(false);
      }, 750);
      return () => clearTimeout(t);
    }
  }, [flipped, deck]);

  const click = (i: number) => {
    if (lock || flipped.includes(i) || matched.has(i)) return;
    setFlipped((f) => (f.length < 2 ? [...f, i] : f));
  };

  const restart = () => {
    setFlipped([]);
    setMatched(new Set());
    setMoves(0);
    setLock(false);
    setRound((r) => r + 1);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-full max-w-[268px] items-center justify-between">
        <span className="font-bold">🧠 Memória</span>
        <span className="text-[#7a2c05]">Jogadas {moves}</span>
      </div>

      {won ? (
        <GameOver game="memory" points={points} onRestart={restart} />
      ) : (
        <>
          <div className="grid grid-cols-4 gap-1.5">
            {deck.map((card, i) => {
              const show = flipped.includes(i) || matched.has(i);
              return (
                <button
                  key={card.id}
                  onClick={() => click(i)}
                  className={`grid h-14 w-14 place-items-center border-2 border-[#161616] text-2xl ${
                    show ? "bg-white" : "bg-[#7a2c05] text-transparent"
                  } ${matched.has(i) ? "opacity-60" : ""}`}
                >
                  {show ? card.emoji : "❄"}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-[#5a564d]">Ache os pares com o menor número de jogadas.</p>
        </>
      )}
    </div>
  );
}
