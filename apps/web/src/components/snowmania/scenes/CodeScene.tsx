"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { useMania } from "../store";
import { SECTION_START_VH, BASE_BG } from "../config";
import { mulberry32, makeBlobTexture, sharedFx } from "./utils";

/** Início da seção do código, em vh rolados. */
const START = SECTION_START_VH.fall;

const CRYSTAL_FILES = Array.from(
  { length: 9 },
  (_, i) => `/snowmania/props/crystal-${i + 1}.webp`,
);

/**
 * Satélites do rig: partes soltas que se movem com fases independentes ao
 * redor do boneco pensador (balão de código, tufos, cafés, energético,
 * chips) — juntas dão o ar de personagem "vivo", estilo Lottie.
 * Posições relativas ao centro do herói, em unidades da altura dele.
 */
const SATELLITES = [
  { file: "bubble-code", x: 0.34, y: 0.66, size: 0.52, bobAmp: 0.02, bobFreq: 1.1, rotAmp: 0.05, rotFreq: 0.7 },
  { file: "puff-l", x: 0.17, y: 0.4, size: 0.13, bobAmp: 0.014, bobFreq: 1.4, rotAmp: 0.08, rotFreq: 0.9 },
  { file: "puff-m", x: 0.08, y: 0.27, size: 0.09, bobAmp: 0.012, bobFreq: 1.7, rotAmp: 0.1, rotFreq: 1.2 },
  { file: "mug", x: -0.5, y: 0.14, size: 0.2, bobAmp: 0.025, bobFreq: 0.8, rotAmp: 0.12, rotFreq: 0.55 },
  { file: "espresso", x: 0.52, y: -0.12, size: 0.17, bobAmp: 0.02, bobFreq: 1.0, rotAmp: 0.1, rotFreq: 0.7 },
  { file: "can", x: -0.44, y: 0.52, size: 0.19, bobAmp: 0.028, bobFreq: 0.65, rotAmp: 0.14, rotFreq: 0.5 },
  { file: "chip-code", x: 0.68, y: 0.9, size: 0.15, bobAmp: 0.022, bobFreq: 0.9, rotAmp: 0.16, rotFreq: 0.8 },
  { file: "chip-braces", x: -0.16, y: 0.8, size: 0.13, bobAmp: 0.018, bobFreq: 1.25, rotAmp: 0.15, rotFreq: 1.0 },
  { file: "chip-semi", x: 0.64, y: 0.28, size: 0.1, bobAmp: 0.016, bobFreq: 1.5, rotAmp: 0.18, rotFreq: 1.15 },
].map((s) => ({ ...s, phase: (s.x * 13.7 + s.y * 7.3) % (Math.PI * 2) }));

const SATELLITE_FILES = SATELLITES.map((s) => `/snowmania/props/${s.file}.webp`);

interface CrystalDef {
  at: number;
  speed: number;
  x: number;
  height: number;
  rot0: number;
  spin: number;
  tex: number;
  phase: number;
}

interface CloudDef {
  /** posição x relativa à largura (-0.5..0.5) */
  x: number;
  /** velocidade de subida em frações de vh por segundo */
  speed: number;
  /** largura relativa à vh */
  w: number;
  tex: number;
  driftPhase: number;
  front: boolean;
}

/**
 * Cena 2 — o boneco pensando em código: rig multi-partes com hover reativo,
 * nuvens de creme subindo SOZINHAS (independentes do scroll, atrás e na
 * frente do personagem) e cristais em parallax de scroll.
 */
export function CodeScene() {
  const heroTex = useTexture("/snowmania/chars/thinker.webp");
  const satTex = useTexture(SATELLITE_FILES);
  const crystalTex = useTexture(CRYSTAL_FILES);
  const { viewport } = useThree();

  const group = useRef<THREE.Group>(null);
  const hero = useRef<THREE.Mesh>(null);
  const satMeshes = useRef<(THREE.Mesh | null)[]>([]);
  const crystals = useRef<(THREE.Mesh | null)[]>([]);
  const cloudMeshes = useRef<(THREE.Mesh | null)[]>([]);

  // estado mutável: molas dos satélites, nuvens, mouse
  const sim = useRef({
    sats: SATELLITES.map(() => ({ ox: 0, oy: 0, vx: 0, vy: 0 })),
    cloudY: [] as number[],
    clouds: [] as { ox: number; oy: number; vx: number; vy: number }[],
    speedFactor: 1,
    mouse: { x: 0, y: 0, has: false },
  });

  // tudo da cena é cortado na borda da divisa — nada vaza pra hero acima
  const clipPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, -1, 0), 0), []);
  const clip = useMemo(() => [clipPlane], [clipPlane]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const m = sim.current.mouse;
      m.x = e.clientX;
      m.y = e.clientY;
      m.has = e.pointerType === "mouse";
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useEffect(() => {
    for (const tex of [heroTex, ...satTex, ...crystalTex]) {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
    }
  }, [heroTex, satTex, crystalTex]);

  const cloudTextures = useMemo(
    () => [
      makeBlobTexture(101, BASE_BG),
      makeBlobTexture(202, BASE_BG),
      makeBlobTexture(303, BASE_BG),
    ],
    [],
  );

  const clouds = useMemo<CloudDef[]>(() => {
    const rand = mulberry32(556677);
    const out: CloudDef[] = [];
    for (let i = 0; i < 7; i++) {
      const front = i >= 4; // 4 atrás, 3 na frente
      out.push({
        x: (rand() - 0.5) * 0.92,
        // 4x a velocidade original
        speed: front ? 0.22 + rand() * 0.18 : 0.12 + rand() * 0.12,
        w: front ? 0.38 + rand() * 0.24 : 0.3 + rand() * 0.2,
        tex: Math.floor(rand() * cloudTextures.length),
        driftPhase: rand() * Math.PI * 2,
        front,
      });
    }
    return out;
  }, [cloudTextures.length]);

  const defs = useMemo<CrystalDef[]>(() => {
    const rand = mulberry32(777);
    const vw = viewport.width;
    const vh = viewport.height;
    const out: CrystalDef[] = [];
    for (let i = 0; i < 16; i++) {
      const side = rand();
      const x =
        side < 0.55
          ? vw * (0.08 + rand() * 0.42)
          : -vw * (0.28 + rand() * 0.24);
      out.push({
        at: START - 70 + rand() * 300,
        speed: 0.3 + rand() * 0.45,
        x,
        height: vh * (0.07 + rand() * 0.13),
        rot0: rand() * Math.PI * 2,
        spin: (rand() < 0.5 ? -1 : 1) * (0.08 + rand() * 0.28),
        tex: Math.floor(rand() * CRYSTAL_FILES.length),
        phase: rand() * Math.PI * 2,
      });
    }
    return out;
  }, [viewport.width, viewport.height]);

  const heroAspect = useMemo(() => {
    const img = heroTex.image as HTMLImageElement | undefined;
    return img ? img.width / img.height : 0.56;
  }, [heroTex]);

  const narrow = viewport.width <= 980;
  const heroH = narrow
    ? Math.min(viewport.height * 0.42, viewport.width * 0.8)
    : viewport.height * 0.52;

  useFrame((state, dt) => {
    const { scrollVh, velocity } = useMania.getState();
    const g = group.current;
    if (!g) return;
    const active = scrollVh > START - 100 && scrollVh < START + 260;
    g.visible = active;
    if (!active) return;

    const vw = viewport.width;
    const vh = viewport.height;
    const t = state.clock.elapsedTime;
    const s = sim.current;
    const springDt = Math.min(dt, 0.033);

    // plano de corte acompanha a borda inclinada da divisa desta seção
    const scrollPxClip = (scrollVh / 100) * vh;
    const startPxClip = (START / 100) * vh;
    const edgeY = vh / 2 - (startPxClip - scrollPxClip);
    const tilt = sharedFx.tilt;
    clipPlane.normal.set(Math.sin(tilt), -Math.cos(tilt), 0);
    clipPlane.constant = Math.cos(tilt) * edgeY;

    // herói FIXO no lugar: a divisa que sobe o DESCOBRE (clipping) e o
    // plano da próxima seção o COBRE — ele nunca se desloca, só flutua
    const isNarrow = vw <= 980;
    const heroX = isNarrow ? 0 : vw * 0.26;
    const yHold = isNarrow ? -vh * 0.28 : -vh * 0.08;
    const heroY = yHold + Math.sin(t * 1.1) * vh * 0.01;

    // mouse em coordenadas do mundo
    const mx = s.mouse.x - vw / 2;
    const my = vh / 2 - s.mouse.y;

    const heroMesh = hero.current;
    if (heroMesh) {
      heroMesh.position.x = heroX;
      heroMesh.position.y = heroY;
      // balanço de "pensando" + inclina de leve na direção do mouse
      const lean = s.mouse.has
        ? THREE.MathUtils.clamp((mx - heroX) / vw, -0.5, 0.5) * 0.05
        : 0;
      heroMesh.rotation.z = -0.03 + Math.sin(t * 0.8) * 0.04 + lean;
    }

    // satélites: bob/rotação com fases próprias + repulsão do mouse com mola
    for (let i = 0; i < SATELLITES.length; i++) {
      const def = SATELLITES[i];
      const mesh = satMeshes.current[i];
      const st = s.sats[i];
      if (!mesh) continue;

      const baseX = heroX + def.x * heroH;
      const baseY =
        heroY + def.y * heroH + Math.sin(t * def.bobFreq + def.phase) * heroH * def.bobAmp;

      if (s.mouse.has) {
        const dx = baseX + st.ox - mx;
        const dy = baseY + st.oy - my;
        const dist = Math.hypot(dx, dy);
        const R = heroH * 0.42;
        if (dist < R && dist > 1) {
          const push = (1 - dist / R) * 1400 * springDt;
          st.vx += (dx / dist) * push;
          st.vy += (dy / dist) * push;
        }
      }
      // mola de volta pra posição do rig
      st.vx += (-70 * st.ox - 7.5 * st.vx) * springDt;
      st.vy += (-70 * st.oy - 7.5 * st.vy) * springDt;
      st.ox += st.vx * springDt;
      st.oy += st.vy * springDt;

      mesh.position.set(baseX + st.ox, baseY + st.oy, mesh.position.z);
      mesh.rotation.z =
        Math.sin(t * def.rotFreq + def.phase) * def.rotAmp +
        st.ox * 0.0016;
    }

    // nuvens: sobem SOZINHAS, sempre — e o scroll acopla na velocidade:
    // rolar pra baixo (a favor) acelera, rolar pra cima (contra) freia
    const speedTarget = THREE.MathUtils.clamp(1 + velocity * 0.0009, 0.12, 3.4);
    s.speedFactor += (speedTarget - s.speedFactor) * Math.min(dt * 4, 1);
    for (let i = 0; i < clouds.length; i++) {
      const c = clouds[i];
      const mesh = cloudMeshes.current[i];
      if (!mesh) continue;
      if (s.cloudY[i] === undefined) {
        s.cloudY[i] = (i / clouds.length - 0.5) * vh * 1.5;
      }
      if (!s.clouds[i]) s.clouds[i] = { ox: 0, oy: 0, vx: 0, vy: 0 };
      s.cloudY[i] += c.speed * vh * dt * s.speedFactor;
      const h = c.w * vh * 0.55;
      if (s.cloudY[i] - h > vh * 0.75) {
        s.cloudY[i] = -vh * 0.75 - h;
      }

      // repulsão suave ao mouse (nuvem é preguiçosa: mola mole)
      const st = s.clouds[i];
      const baseX = c.x * vw + Math.sin(t * 0.25 + c.driftPhase) * vw * 0.015;
      if (s.mouse.has) {
        const mx = s.mouse.x - vw / 2;
        const my = vh / 2 - s.mouse.y;
        const dx = baseX + st.ox - mx;
        const dy = s.cloudY[i] + st.oy - my;
        const dist = Math.hypot(dx, dy);
        const R = c.w * vh * 0.62;
        if (dist < R && dist > 1) {
          const push = (1 - dist / R) * 620 * springDt;
          st.vx += (dx / dist) * push;
          st.vy += (dy / dist) * push;
        }
      }
      st.vx += (-22 * st.ox - 4.5 * st.vx) * springDt;
      st.vy += (-22 * st.oy - 4.5 * st.vy) * springDt;
      st.ox += st.vx * springDt;
      st.oy += st.vy * springDt;

      mesh.position.set(baseX + st.ox, s.cloudY[i] + st.oy, mesh.position.z);
    }

    // cristais: parallax de scroll (mantido)
    for (let i = 0; i < defs.length; i++) {
      const mesh = crystals.current[i];
      if (!mesh) continue;
      const d = defs[i];
      mesh.position.y = ((scrollVh - d.at) / 100) * vh * d.speed;
      mesh.position.x = d.x + Math.sin(t * 0.6 + d.phase) * vh * 0.012;
      mesh.rotation.z += d.spin * dt;
    }
  });

  return (
    <group ref={group} visible={false}>
      {/* nuvens de trás (sobem sozinhas, atrás do boneco) */}
      {clouds.map((c, i) =>
        c.front ? null : (
          <mesh
            key={`b${i}`}
            ref={(el) => {
              cloudMeshes.current[i] = el;
            }}
            position={[c.x * viewport.width, -10000, 52]}
            renderOrder={11}
          >
            <planeGeometry args={[c.w * viewport.height * 1.6, c.w * viewport.height * 0.9]} />
            <meshBasicMaterial
              map={cloudTextures[c.tex]}
              transparent
              depthWrite={false}
              toneMapped={false}
              clippingPlanes={clip}
            />
          </mesh>
        ),
      )}
      {defs.map((d, i) => {
        const tex = crystalTex[d.tex];
        const img = tex.image as HTMLImageElement | undefined;
        const aspect = img ? img.width / img.height : 1;
        return (
          <mesh
            key={i}
            ref={(el) => {
              crystals.current[i] = el;
            }}
            position={[d.x, -10000, 55 + (i % 5)]}
            rotation={[0, 0, d.rot0]}
            renderOrder={12}
          >
            <planeGeometry args={[d.height * aspect, d.height]} />
            <meshBasicMaterial
              map={tex}
              transparent
              alphaTest={0.02}
              depthWrite={false}
              toneMapped={false}
              opacity={0.95}
              clippingPlanes={clip}
            />
          </mesh>
        );
      })}
      <mesh ref={hero} position={[0, -10000, 60]} renderOrder={14}>
        <planeGeometry args={[heroH * heroAspect, heroH]} />
        <meshBasicMaterial
          map={heroTex}
          transparent
          alphaTest={0.02}
          depthWrite={false}
          toneMapped={false}
          clippingPlanes={clip}
        />
      </mesh>
      {/* satélites do rig (partes soltas por cima do corpo) */}
      {SATELLITES.map((def, i) => {
        const tex = satTex[i];
        const img = tex.image as HTMLImageElement | undefined;
        const aspect = img ? img.width / img.height : 1;
        const h = def.size * viewport.height * 0.52;
        return (
          <mesh
            key={def.file}
            ref={(el) => {
              satMeshes.current[i] = el;
            }}
            position={[0, -10000, 62 + i * 0.3]}
            renderOrder={15}
          >
            <planeGeometry args={[h * aspect, h]} />
            <meshBasicMaterial
              map={tex}
              transparent
              alphaTest={0.02}
              depthWrite={false}
              toneMapped={false}
              clippingPlanes={clip}
            />
          </mesh>
        );
      })}
      {/* nuvens da frente (passam por cima de tudo, subindo sozinhas) */}
      {clouds.map((c, i) =>
        c.front ? (
          <mesh
            key={`f${i}`}
            ref={(el) => {
              cloudMeshes.current[i] = el;
            }}
            position={[c.x * viewport.width, -10000, 72]}
            renderOrder={16}
          >
            <planeGeometry args={[c.w * viewport.height * 1.6, c.w * viewport.height * 0.9]} />
            <meshBasicMaterial
              map={cloudTextures[c.tex]}
              transparent
              depthWrite={false}
              toneMapped={false}
              clippingPlanes={clip}
            />
          </mesh>
        ) : null,
      )}
    </group>
  );
}
