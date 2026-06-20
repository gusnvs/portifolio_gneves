"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GameOver } from "./Leaderboard";

/* logical canvas resolution (scaled up, rendered pixelated) */
const W = 600;
const H = 200;
const GROUND_Y = 168;

const SM_X = 60;
const RUN_W = 74;
const RUN_H = 74;
const JUMP_W = 74;
const JUMP_H = 80;
const DUCK_W = 88;
const DUCK_H = 52;

const GRAVITY = 2600;
const JUMP_V = -820;

const BASE_SPEED = 240;
const MAX_SPEED = 720;
const ENERGY_STEP = 0.16; // each energy permanently multiplies speed (cumulative)

const ASSET = (n: string) => `/boneco_neve/runner/${n}`;
const SOURCES = {
  run1: ASSET("snowman_run1.png"),
  run2: ASSET("snowman_run2.png"),
  jump: ASSET("snowman_jump.png"),
  duck: ASSET("snowman_duck.png"),
  fire: ASSET("fire.png"),
  cloud: ASSET("cloud.png"),
  energy: ASSET("energy.png"),
  bg: ASSET("bg.png"),
  ground: ASSET("ground.png"),
};

type Obstacle = { kind: "fire" | "cloud"; x: number; w: number; h: number; y: number };
type Power = { x: number; y: number; w: number; h: number };

function rectsHit(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

export function RunnerGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgs = useRef<Record<string, HTMLImageElement>>({});
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<"idle" | "running" | "over">("idle");
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(0);

  const raf = useRef<number>(0);
  const levelShown = useRef(0);
  const game = useRef({
    y: GROUND_Y,
    vy: 0,
    onGround: true,
    ducking: false,
    frame: 0,
    frameT: 0,
    speed: BASE_SPEED,
    dist: 0,
    scoreF: 0,
    energyBonus: 0,
    speedMult: 1,
    energyLevel: 0,
    obstacles: [] as Obstacle[],
    powers: [] as Power[],
    spawnT: 0.8,
    powerT: 4,
    bgX: 0,
    groundX: 0,
    over: false,
  });

  /* preload assets */
  useEffect(() => {
    let done = 0;
    const entries = Object.entries(SOURCES);
    entries.forEach(([k, src]) => {
      const im = new Image();
      im.onload = () => {
        done++;
        if (done === entries.length) setReady(true);
      };
      im.onerror = () => {
        done++;
        if (done === entries.length) setReady(true);
      };
      im.src = src;
      imgs.current[k] = im;
    });
  }, []);

  const reset = () => {
    game.current = {
      ...game.current,
      y: GROUND_Y,
      vy: 0,
      onGround: true,
      ducking: false,
      frame: 0,
      frameT: 0,
      speed: BASE_SPEED,
      dist: 0,
      scoreF: 0,
      energyBonus: 0,
      speedMult: 1,
      energyLevel: 0,
      obstacles: [],
      powers: [],
      spawnT: 0.9,
      powerT: 4,
      over: false,
    };
    setScore(0);
    setLevel(0);
  };

  const jump = useCallback(() => {
    const g = game.current;
    if (g.over) return;
    if (g.onGround) {
      g.vy = JUMP_V;
      g.onGround = false;
    }
  }, []);

  const loop = useCallback((ctx: CanvasRenderingContext2D, last: number) => {
    const g = game.current;
    const now = performance.now();
    let dt = (now - last) / 1000;
    if (dt > 0.05) dt = 0.05; // clamp
    const I = imgs.current;

    // speed = distance ramp × permanent cumulative energy multiplier
    const ramp = BASE_SPEED + g.dist / 90;
    g.speed = Math.min(MAX_SPEED, ramp * g.speedMult);
    if (g.energyLevel !== levelShown.current) {
      levelShown.current = g.energyLevel;
      setLevel(g.energyLevel);
    }

    const move = g.speed * dt;
    g.dist += move;

    // physics — ducking while airborne = fast-fall (cancel the rise + heavy gravity)
    if (!g.onGround && g.ducking) {
      if (g.vy < 0) g.vy = 0;
      g.vy += GRAVITY * 2.8 * dt;
    } else {
      g.vy += GRAVITY * dt;
    }
    g.y += g.vy * dt;
    if (g.y >= GROUND_Y) {
      g.y = GROUND_Y;
      g.vy = 0;
      g.onGround = true;
    }

    // run frame anim
    if (g.onGround && !g.ducking) {
      g.frameT += dt;
      if (g.frameT > 0.1) {
        g.frameT = 0;
        g.frame = g.frame ? 0 : 1;
      }
    }

    // spawn obstacles (gap kept ~constant in distance)
    g.spawnT -= dt;
    if (g.spawnT <= 0) {
      const highChance = Math.random() < 0.4;
      if (highChance) {
        g.obstacles.push({ kind: "cloud", x: W + 20, w: 58, h: 34, y: 70 });
      } else {
        const big = Math.random() < 0.3;
        g.obstacles.push({
          kind: "fire",
          x: W + 20,
          w: big ? 56 : 42,
          h: big ? 66 : 52,
          y: GROUND_Y + 12,
        });
      }
      const gapPx = 270 + Math.random() * 260;
      g.spawnT = gapPx / g.speed;
    }

    // spawn energy occasionally
    g.powerT -= dt;
    if (g.powerT <= 0) {
      g.powers.push({ x: W + 30, y: GROUND_Y - 72, w: 38, h: 58 });
      g.powerT = 6 + Math.random() * 6;
    }

    // move + cull
    g.obstacles.forEach((o) => (o.x -= move));
    g.powers.forEach((p) => (p.x -= move));
    g.obstacles = g.obstacles.filter((o) => o.x + o.w > -10);
    g.powers = g.powers.filter((p) => p.x + p.w > -10);

    // snowman box
    const sw = g.ducking ? DUCK_W : g.onGround ? RUN_W : JUMP_W;
    const sh = g.ducking ? DUCK_H : g.onGround ? RUN_H : JUMP_H;
    const sx = SM_X;
    const sy = g.y - sh;
    // forgiving hitbox
    const pad = 0.18;
    const hbx = sx + sw * pad;
    const hby = sy + sh * pad;
    const hbw = sw * (1 - pad * 2);
    const hbh = sh * (1 - pad * 2);

    // collisions
    for (const o of g.obstacles) {
      const op = 0.14;
      if (
        rectsHit(
          hbx,
          hby,
          hbw,
          hbh,
          o.x + o.w * op,
          o.y - o.h + o.h * op,
          o.w * (1 - op * 2),
          o.h * (1 - op * 2),
        )
      ) {
        g.over = true;
      }
    }
    // energy pickup
    g.powers = g.powers.filter((p) => {
      if (rectsHit(hbx, hby, hbw, hbh, p.x, p.y, p.w, p.h)) {
        g.energyLevel += 1;
        g.speedMult += ENERGY_STEP; // permanent + cumulative
        g.energyBonus += 30;
        return false;
      }
      return true;
    });

    // score
    g.scoreF = g.dist / 11 + g.energyBonus;
    setScore(Math.floor(g.scoreF));

    // parallax scroll
    g.bgX = (g.bgX - move * 0.25) % W;
    g.groundX = (g.groundX - move) % 120;

    /* ---- draw ---- */
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, W, H);
    // sky base
    ctx.fillStyle = "#d9ecf5";
    ctx.fillRect(0, 0, W, H);
    // background tiled
    const bg = I.bg;
    if (bg && bg.width) {
      const bw = (bg.width / bg.height) * H;
      for (let x = g.bgX; x < W; x += bw) ctx.drawImage(bg, x, 0, bw, H);
    }
    // ground tiled
    const gr = I.ground;
    const gh = H - GROUND_Y + 12;
    if (gr && gr.width) {
      const gw = (gr.width / gr.height) * gh;
      for (let x = g.groundX; x < W; x += gw) ctx.drawImage(gr, x, GROUND_Y - 6, gw, gh);
    } else {
      ctx.fillStyle = "#eaf4fb";
      ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
    }

    // powers
    const en = I.energy;
    for (const p of g.powers) if (en) ctx.drawImage(en, p.x, p.y, p.w, p.h);

    // obstacles
    for (const o of g.obstacles) {
      const im = o.kind === "fire" ? I.fire : I.cloud;
      if (im) ctx.drawImage(im, o.x, o.y - o.h, o.w, o.h);
    }

    // snowman
    let sprite = g.frame ? I.run2 : I.run1;
    if (!g.onGround) sprite = g.ducking ? I.duck : I.jump;
    else if (g.ducking) sprite = I.duck;
    if (sprite) {
      // speed trail — one faint after-image per energy collected, fading back
      const ghosts = Math.min(g.energyLevel, 6);
      for (let k = ghosts; k >= 1; k--) {
        ctx.save();
        ctx.globalAlpha = 0.34 * Math.pow(0.62, k - 1);
        ctx.drawImage(sprite, sx - k * 12, sy + 1, sw, sh);
        ctx.restore();
      }
      ctx.drawImage(sprite, sx, sy, sw, sh);
    }

    if (g.over) {
      stop();
      setStatus("over");
      return;
    }
    raf.current = requestAnimationFrame(() => loop(ctx, now));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stop = useCallback(() => {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = 0;
  }, []);

  const start = useCallback(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    reset();
    setStatus("running");
    stop();
    raf.current = requestAnimationFrame(() => loop(ctx, performance.now()));
  }, [loop, stop]);

  // input
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (["Space", "ArrowUp", "ArrowDown", "KeyW", "KeyS"].includes(e.code)) e.preventDefault();
      if (status !== "running") {
        if (e.code === "Space" || e.code === "ArrowUp") {
          if (ready && status === "idle") start();
        }
        return;
      }
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") jump();
      if (e.code === "ArrowDown" || e.code === "KeyS") game.current.ducking = true;
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "ArrowDown" || e.code === "KeyS") game.current.ducking = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [status, ready, start, jump]);

  useEffect(() => () => stop(), [stop]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-full max-w-[520px] items-center justify-between">
        <span className="font-bold">⛄ Boneco Runner</span>
        <span className="text-[#7a2c05]">
          {level > 0 && <span className="mr-2 text-[#1e8a3b]">⚡ x{level}</span>}Pontos {score}
        </span>
      </div>

      <div
        className="relative w-full max-w-[520px] overflow-hidden rounded border-2 border-[#161616]"
        style={{ imageRendering: "pixelated" }}
        onPointerDown={() => {
          if (status === "running") jump();
          else if (status === "idle" && ready) start();
        }}
      >
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="block w-full"
          style={{ imageRendering: "pixelated" }}
        />

        {status === "idle" && (
          <div className="absolute inset-0 grid place-items-center bg-black/55 p-3 text-center text-white">
            <div>
              <button className="btn-95 text-black" onClick={start} disabled={!ready}>
                {ready ? "Começar" : "Carregando…"}
              </button>
              <p className="mt-2 text-[11px] text-white/80">
                Espaço/↑ pula · ↓ agacha · pegue o ⚡ energético
              </p>
            </div>
          </div>
        )}

        {status === "over" && (
          <div className="absolute inset-0 grid place-items-center bg-black/65">
            <span className="font-display text-4xl font-extrabold uppercase tracking-tight text-white drop-shadow-[3px_3px_0_#db4f06] sm:text-6xl">
              Game Over
            </span>
          </div>
        )}
      </div>

      {status === "over" ? (
        <GameOver game="runner" points={score} onRestart={start} />
      ) : (
        <p className="text-[11px] text-[#5a564d]">
          Pule os foguinhos, agache nas nuvens e pegue energéticos pra acelerar.
        </p>
      )}
    </div>
  );
}
