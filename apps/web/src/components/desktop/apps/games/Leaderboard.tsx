"use client";

import { useEffect, useState } from "react";

export type GameId = "snake" | "memory" | "simon" | "runner";

export function Leaderboard({ game, refreshKey }: { game: GameId; refreshKey?: number }) {
  const [scores, setScores] = useState<{ name: string; points: number }[]>([]);
  const [offline, setOffline] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/scores?game=${game}`)
      .then((r) => r.json())
      .then((d) => {
        setScores(d.scores ?? []);
        setOffline(Boolean(d.dbDisabled));
      })
      .catch(() => setOffline(true))
      .finally(() => setLoading(false));
  }, [game, refreshKey]);

  return (
    <div className="inset p-2 text-left">
      <p className="mb-1 font-bold text-[#7a2c05]">🏆 Ranking</p>
      {loading ? (
        <p className="text-[#9a958a]">Carregando…</p>
      ) : offline ? (
        <p className="text-[#9a958a]">Ranking offline (sem banco).</p>
      ) : scores.length === 0 ? (
        <p className="text-[#9a958a]">Seja o primeiro! ❄️</p>
      ) : (
        <ol className="space-y-0.5">
          {scores.map((s, i) => (
            <li key={i} className="flex justify-between gap-2">
              <span className="truncate">
                {i + 1}. {s.name}
              </span>
              <span className="font-bold">{s.points}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function GameOver({
  game,
  points,
  onRestart,
}: {
  game: GameId;
  points: number;
  onRestart: () => void;
}) {
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);

  const submit = async () => {
    if (!name.trim()) return;
    setBusy(true);
    await fetch("/api/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ game, name: name.trim(), points }),
    }).catch(() => {});
    setSubmitted(true);
    setRefresh((x) => x + 1);
    setBusy(false);
  };

  return (
    <div className="w-full max-w-[280px] space-y-2 text-center">
      <p className="font-display text-lg font-extrabold">Fim de jogo — {points} pts</p>
      {!submitted && points > 0 && (
        <div className="flex justify-center gap-1.5">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Seu nome"
            maxLength={20}
            className="inset min-w-0 flex-1 bg-white px-2 py-1 outline-none"
          />
          <button className="btn-95" onClick={submit} disabled={busy}>
            Salvar
          </button>
        </div>
      )}
      {submitted && <p className="text-sm text-[#1e8a3b]">Pontuação salva! ✅</p>}
      <Leaderboard game={game} refreshKey={refresh} />
      <button className="btn-95" onClick={onRestart}>
        Jogar de novo
      </button>
    </div>
  );
}
