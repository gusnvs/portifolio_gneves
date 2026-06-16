"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const COLS = 16;
const ROWS = 16;
const CELL = 16;

type P = { x: number; y: number };

export function GamesApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const snake = useRef<P[]>([{ x: 5, y: 8 }]);
  const dir = useRef<P>({ x: 1, y: 0 });
  const nextDir = useRef<P>({ x: 1, y: 0 });
  const food = useRef<P>({ x: 10, y: 8 });
  const loop = useRef<ReturnType<typeof setInterval> | null>(null);

  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [status, setStatus] = useState<"idle" | "running" | "over">("idle");

  useEffect(() => {
    setBest(Number(localStorage.getItem("gn:snake:best") ?? 0));
  }, []);

  const placeFood = useCallback(() => {
    let p: P;
    do {
      p = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
    } while (snake.current.some((s) => s.x === p.x && s.y === p.y));
    food.current = p;
  }, []);

  const draw = useCallback(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#0b0a0c";
    ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL);
    // grid
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    for (let i = 0; i <= COLS; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL, 0);
      ctx.lineTo(i * CELL, ROWS * CELL);
      ctx.stroke();
    }
    for (let i = 0; i <= ROWS; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * CELL);
      ctx.lineTo(COLS * CELL, i * CELL);
      ctx.stroke();
    }
    // food (snowflake)
    ctx.fillStyle = "#eaf2ff";
    ctx.font = `${CELL}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("❄", food.current.x * CELL + CELL / 2, food.current.y * CELL + CELL / 2 + 1);
    // snake
    snake.current.forEach((s, i) => {
      ctx.fillStyle = i === 0 ? "#ff8a3d" : "#ff6a1a";
      ctx.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2);
    });
  }, []);

  const stop = useCallback(() => {
    if (loop.current) clearInterval(loop.current);
    loop.current = null;
  }, []);

  const tick = useCallback(() => {
    dir.current = nextDir.current;
    const head = {
      x: snake.current[0].x + dir.current.x,
      y: snake.current[0].y + dir.current.y,
    };
    const hitWall = head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS;
    const hitSelf = snake.current.some((s) => s.x === head.x && s.y === head.y);
    if (hitWall || hitSelf) {
      stop();
      setStatus("over");
      setScore((sc) => {
        setBest((b) => {
          const nb = Math.max(b, sc);
          localStorage.setItem("gn:snake:best", String(nb));
          return nb;
        });
        return sc;
      });
      return;
    }
    const ate = head.x === food.current.x && head.y === food.current.y;
    const body = [head, ...snake.current];
    if (!ate) body.pop();
    else {
      setScore((s) => s + 1);
      placeFood();
    }
    snake.current = body;
    draw();
  }, [draw, placeFood, stop]);

  const start = useCallback(() => {
    snake.current = [{ x: 5, y: 8 }];
    dir.current = { x: 1, y: 0 };
    nextDir.current = { x: 1, y: 0 };
    setScore(0);
    placeFood();
    draw();
    setStatus("running");
    stop();
    loop.current = setInterval(tick, 130);
  }, [draw, placeFood, stop, tick]);

  useEffect(() => {
    draw();
    return () => stop();
  }, [draw, stop]);

  const onKey = (e: React.KeyboardEvent) => {
    const k = e.key.toLowerCase();
    const map: Record<string, P> = {
      arrowup: { x: 0, y: -1 },
      w: { x: 0, y: -1 },
      arrowdown: { x: 0, y: 1 },
      s: { x: 0, y: 1 },
      arrowleft: { x: -1, y: 0 },
      a: { x: -1, y: 0 },
      arrowright: { x: 1, y: 0 },
      d: { x: 1, y: 0 },
    };
    const nd = map[k];
    if (!nd) return;
    e.preventDefault();
    // disallow reversing
    if (nd.x === -dir.current.x && nd.y === -dir.current.y) return;
    nextDir.current = nd;
  };

  return (
    <div className="flex h-full flex-col items-center gap-3 bg-[#f5f1e9] p-4 font-system text-[13px] text-[#161616]">
      <div className="flex w-full max-w-[256px] items-center justify-between">
        <span className="font-bold">🐍 Cobra do Boneco</span>
        <span className="text-[#7a2c05]">
          Pontos {score} · Recorde {best}
        </span>
      </div>

      <div
        tabIndex={0}
        onKeyDown={onKey}
        className="relative border-2 border-[#161616] outline-none"
        style={{ width: COLS * CELL, height: ROWS * CELL }}
      >
        <canvas ref={canvasRef} width={COLS * CELL} height={ROWS * CELL} className="block" />
        {status !== "running" && (
          <div className="absolute inset-0 grid place-items-center bg-black/60 text-center text-white">
            <div>
              {status === "over" && (
                <p className="mb-2 font-display text-lg font-extrabold">Fim de Jogo</p>
              )}
              <button className="btn-95 text-black" onClick={start}>
                {status === "over" ? "Jogar de novo" : "Começar"}
              </button>
              <p className="mt-2 text-[11px] text-white/70">setas / WASD</p>
            </div>
          </div>
        )}
      </div>
      <p className="text-[11px] text-[#5a564d]">Clique no tabuleiro e use as setas.</p>
    </div>
  );
}
