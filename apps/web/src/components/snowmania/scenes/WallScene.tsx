"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import Matter from "matter-js";
import { useMania } from "../store";
import { mulberry32 } from "./utils";

/** Poses da chuva ("laptop" fica reservada pra cena da bio). */
const POSE_FILES = [
  "tumble",
  "fall-back",
  "cartwheel",
  "laugh",
  "angry",
  "smug",
  "shocked",
  "sleep",
  "jump",
  "skydive",
  "point-up",
  "wave",
  "thumbs-up",
  "run",
  "cry",
  "point-forward",
  "float",
].map((name) => `/snowmania/poses/${name}.webp`);

/** Slots de renderização reciclados (chuva infinita com pool fixo). */
const MAX_POOL = 24;
/** Ritmo da chuva: rápido enquanto enche, depois goteja com calma. */
const SPAWN_FAST = 0.5;
const SPAWN_SLOW = 1.15;
/** Tempo mínimo (s) que um boneco fica em tela antes de poder estourar. */
const MIN_LIFE = 9;
/** Duração do pop de bolha (s): infla e colapsa. */
const POP_S = 0.3;
/** Fração do pop gasta inflando. */
const POP_INFLATE = 0.4;

interface Slot {
  body: Matter.Body | null;
  /** relógio (s) em que estourou; 0 = vivo. anima sem corpo físico. */
  popAt: number;
  /** relógio (s) do nascimento — controla o tempo mínimo em tela. */
  bornAt: number;
  /** ordem de nascimento, pra estourar os mais antigos. */
  seq: number;
  /** altura visual do sprite (px). */
  h: number;
  aspect: number;
  /** última pose conhecida (px/rad) — usada durante o pop. */
  px: number;
  py: number;
  pangle: number;
}

/**
 * Cena 1 — chove boneco de neve: corpos físicos (Matter.js) caem do topo,
 * empilham no chão, podem ser agarrados/arremessados com o mouse. A tela
 * segura ~8-10 por vez; quando o mais antigo já viveu MIN_LIFE segundos,
 * ele estoura como bolha (infla → colapsa) pra chuva continuar. O texto do
 * DOM fica NA FRENTE do canvas (main z-30 > canvas z-20).
 */
export function WallScene() {
  const textures = useTexture(POSE_FILES);
  const { viewport } = useThree();
  const group = useRef<THREE.Group>(null);
  const meshes = useRef<(THREE.Mesh | null)[]>([]);

  const engine = useMemo(() => {
    const eng = Matter.Engine.create({ enableSleeping: true });
    eng.gravity.y = 1;
    return eng;
  }, []);

  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1), []);

  const { slots, materials } = useMemo(() => {
    const rand = mulberry32(987654);
    const slotsOut: Slot[] = [];
    const matsOut: THREE.MeshBasicMaterial[] = [];
    for (let i = 0; i < MAX_POOL; i++) {
      const texIdx = Math.floor(rand() * textures.length);
      const tex = textures[texIdx];
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      const img = tex.image as HTMLImageElement | undefined;
      matsOut.push(
        new THREE.MeshBasicMaterial({
          map: tex,
          transparent: true,
          alphaTest: 0.02,
          depthWrite: false,
          toneMapped: false,
        }),
      );
      slotsOut.push({
        body: null,
        popAt: 0,
        bornAt: 0,
        seq: 0,
        h: 1,
        aspect: img ? img.width / img.height : 1,
        px: 0,
        py: 0,
        pangle: 0,
      });
    }
    return { slots: slotsOut, materials: matsOut };
  }, [textures]);

  // estado mutável fora do React
  const sim = useRef({
    rand: mulberry32(13371337),
    spawnAcc: 0,
    physAcc: 0,
    seq: 1,
    groupOffset: 0,
    statics: [] as Matter.Body[],
    drag: null as null | {
      constraint: Matter.Constraint;
      body: Matter.Body;
      pointerId: number;
    },
  });

  // chão e paredes acompanham o tamanho da viewport
  useEffect(() => {
    const vw = viewport.width;
    const vh = viewport.height;
    const s = sim.current;
    if (s.statics.length) {
      Matter.World.remove(engine.world, s.statics);
    }
    const opts = { isStatic: true, friction: 0.8 };
    s.statics = [
      Matter.Bodies.rectangle(vw / 2, vh + 100, vw * 1.6, 200, opts), // chão
      Matter.Bodies.rectangle(-60, vh / 2 - vh, 120, vh * 4, opts), // esquerda
      Matter.Bodies.rectangle(vw + 60, vh / 2 - vh, 120, vh * 4, opts), // direita
    ];
    Matter.World.add(engine.world, s.statics);
  }, [engine, viewport.width, viewport.height]);

  // limpeza do motor
  useEffect(() => {
    return () => {
      Matter.World.clear(engine.world, false);
      Matter.Engine.clear(engine);
      geometry.dispose();
      for (const m of materials) m.dispose();
    };
  }, [engine, geometry, materials]);

  // drag & throw — listeners na window (o canvas é pointer-events: none)
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".snowmania");
    const s = sim.current;

    const toMatter = (e: PointerEvent) => ({
      x: e.clientX,
      y: e.clientY + s.groupOffset,
    });

    const liveBodies = () =>
      slots.filter((sl) => sl.body).map((sl) => sl.body!) as Matter.Body[];

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        typeof target.closest === "function" &&
        target.closest("a, button, input, textarea")
      ) {
        return;
      }
      const { scrollVh } = useMania.getState();
      if (scrollVh > 220) return;
      const point = toMatter(e);
      const hit = Matter.Query.point(liveBodies(), point)[0];
      if (!hit) return;
      e.preventDefault();
      Matter.Sleeping.set(hit, false);
      const constraint = Matter.Constraint.create({
        pointA: point,
        bodyB: hit,
        pointB: {
          x: point.x - hit.position.x,
          y: point.y - hit.position.y,
        },
        stiffness: 0.12,
        damping: 0.08,
        length: 0,
      });
      Matter.World.add(engine.world, constraint);
      s.drag = { constraint, body: hit, pointerId: e.pointerId };
      if (root) root.style.cursor = "grabbing";
    };

    const onMove = (e: PointerEvent) => {
      if (s.drag && e.pointerId === s.drag.pointerId) {
        s.drag.constraint.pointA = toMatter(e);
        Matter.Sleeping.set(s.drag.body, false);
        return;
      }
      if (e.pointerType !== "mouse" || !root) return;
      const { scrollVh } = useMania.getState();
      if (scrollVh > 220) {
        if (root.style.cursor === "grab") root.style.cursor = "";
        return;
      }
      const hit = Matter.Query.point(liveBodies(), toMatter(e))[0];
      const want = hit ? "grab" : "";
      if (root.style.cursor !== want && root.style.cursor !== "grabbing") {
        root.style.cursor = want;
      }
    };

    const onUp = (e: PointerEvent) => {
      if (!s.drag || e.pointerId !== s.drag.pointerId) return;
      Matter.World.remove(engine.world, s.drag.constraint);
      s.drag = null;
      if (root) root.style.cursor = "";
    };

    window.addEventListener("pointerdown", onDown, { passive: false });
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      if (root) root.style.cursor = "";
    };
  }, [engine, slots]);

  useFrame((state, dt) => {
    const { scrollVh, ready } = useMania.getState();
    const g = group.current;
    if (!g) return;

    const vw = viewport.width;
    const vh = viewport.height;
    const unit = Math.min(vh, vw * 1.15);
    const s = sim.current;
    const now = state.clock.elapsedTime;

    // a pilha inteira sobe junto com o scroll e sai de cena
    const scrollPx = (scrollVh / 100) * vh;
    const offset = scrollPx * 1.15;
    g.position.y = offset;
    s.groupOffset = offset;

    const active = scrollVh < 300;
    g.visible = active;
    if (!active) return;

    // física em passo fixo (independe do refresh rate)
    s.physAcc = Math.min(s.physAcc + dt, 0.12);
    let steps = 0;
    while (s.physAcc >= 1 / 60 && steps < 4) {
      Matter.Engine.update(engine, 1000 / 60);
      s.physAcc -= 1 / 60;
      steps++;
    }

    // chuva calma: enche rápido até o limite (~8-10), depois goteja — e só
    // estoura um antigo (bolha) quando ele já viveu MIN_LIFE segundos
    const cap = Math.max(6, Math.min(10, Math.round((vw * vh) / 125000)));
    if (ready && scrollVh < 150) {
      const alive = slots.filter((sl) => sl.body);
      const interval = alive.length < cap * 0.7 ? SPAWN_FAST : SPAWN_SLOW;
      s.spawnAcc += dt;
      if (s.spawnAcc >= interval) {
        s.spawnAcc = 0;
        let maySpawn = alive.length < cap;
        if (!maySpawn) {
          // no limite: procura o mais antigo elegível pra estourar
          let oldest: Slot | null = null;
          for (const sl of alive) {
            if (s.drag && sl.body === s.drag.body) continue;
            if (now - sl.bornAt < MIN_LIFE) continue;
            if (!oldest || sl.seq < oldest.seq) oldest = sl;
          }
          if (oldest) {
            // estoura: remove a física na hora, o pop é só visual
            Matter.World.remove(engine.world, oldest.body!);
            oldest.body = null;
            oldest.popAt = now;
            maySpawn = true;
          }
        }
        const free = slots.findIndex(
          (sl) => sl.body === null && sl.popAt === 0,
        );
        if (maySpawn && free !== -1) {
          const sl = slots[free];
          const rnd = s.rand;
          const h = unit * (0.3 + rnd() * 0.17);
          const w = h * sl.aspect;
          const body = Matter.Bodies.rectangle(
            vw * (0.06 + rnd() * 0.88),
            -h * (0.6 + rnd() * 0.8),
            w * 0.82,
            h * 0.88,
            {
              chamfer: { radius: Math.min(w, h) * 0.3 },
              friction: 0.55,
              frictionStatic: 0.9,
              restitution: 0.12,
              density: 0.0012,
              angle: rnd() * Math.PI * 2,
            },
          );
          Matter.Body.setAngularVelocity(body, (rnd() - 0.5) * 0.28);
          Matter.Body.setVelocity(body, { x: (rnd() - 0.5) * 2.4, y: 2 });
          Matter.World.add(engine.world, body);
          sl.body = body;
          sl.popAt = 0;
          sl.bornAt = now;
          sl.seq = s.seq++;
          sl.h = h;
          materials[free].opacity = 1;
        }
      }
    }

    // sincroniza corpos → sprites (+ pop de bolha nos que estouraram)
    for (let i = 0; i < slots.length; i++) {
      const sl = slots[i];
      const mesh = meshes.current[i];
      if (!mesh) continue;

      if (sl.body) {
        // vivo: segue a física e memoriza a pose (usada se estourar)
        const body = sl.body;
        sl.px = body.position.x;
        sl.py = body.position.y;
        sl.pangle = body.angle;
        mesh.visible = true;
        materials[i].opacity = 1;
        mesh.position.set(sl.px - vw / 2, vh / 2 - sl.py, (i % 10) * 0.5);
        mesh.rotation.z = -body.angle;
        mesh.scale.set(sl.h * sl.aspect, sl.h, 1);
        continue;
      }

      if (sl.popAt > 0) {
        // bolha estourando: infla rápido e colapsa até sumir
        const k = (now - sl.popAt) / POP_S;
        if (k >= 1) {
          sl.popAt = 0;
          mesh.visible = false;
          continue;
        }
        let scale: number;
        if (k < POP_INFLATE) {
          scale = 1 + 0.3 * (k / POP_INFLATE);
        } else {
          const c = (k - POP_INFLATE) / (1 - POP_INFLATE);
          scale = 1.3 * (1 - c) * (1 - c);
          materials[i].opacity = 1 - c * 0.5;
        }
        mesh.visible = true;
        mesh.position.set(sl.px - vw / 2, vh / 2 - sl.py, (i % 10) * 0.5);
        mesh.rotation.z = -sl.pangle + (k > POP_INFLATE ? (k - POP_INFLATE) * 0.6 : 0);
        mesh.scale.set(sl.h * sl.aspect * scale, sl.h * scale, 1);
        continue;
      }

      mesh.visible = false;
    }
  });

  return (
    <group ref={group}>
      {slots.map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            meshes.current[i] = el;
          }}
          geometry={geometry}
          material={materials[i]}
          visible={false}
        />
      ))}
    </group>
  );
}
