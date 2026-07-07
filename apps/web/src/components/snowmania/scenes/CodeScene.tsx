"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { useMania } from "../store";
import { SECTION_START_VH, BASE_BG } from "../config";
import { mulberry32, makeBlobTexture, sharedFx } from "./utils";
import { SnowmanRig } from "./SnowmanRig";

/** Início da seção do código, em vh rolados. */
const START = SECTION_START_VH.fall;

const CRYSTAL_FILES = Array.from(
  { length: 9 },
  (_, i) => `/snowmania/props/crystal-${i + 1}.webp`,
);

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
 * Cena 2 — o boneco programando na cartola como peça central (rig de
 * camadas animadas), nuvens de creme subindo sozinhas (atrás e na frente
 * dele) e cristais em parallax.
 */
export function CodeScene() {
  const crystalTex = useTexture(CRYSTAL_FILES);
  const { viewport } = useThree();

  const group = useRef<THREE.Group>(null);
  const crystals = useRef<(THREE.Mesh | null)[]>([]);
  const cloudMeshes = useRef<(THREE.Mesh | null)[]>([]);

  // estado mutável: molas dos satélites, nuvens, mouse
  const sim = useRef({
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
    for (const tex of crystalTex) {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
    }
  }, [crystalTex]);

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
      <SnowmanRig clip={clip} />
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
