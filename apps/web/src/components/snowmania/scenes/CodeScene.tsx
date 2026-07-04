"use client";

import { useMemo, useRef, useLayoutEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { useMania } from "../store";
import { clamp01, lerp, easeOutCubic, easeInCubic, mulberry32 } from "./utils";

const CRYSTAL_FILES = Array.from(
  { length: 9 },
  (_, i) => `/snowmania/props/crystal-${i + 1}.webp`,
);

interface CrystalDef {
  /** scrollVh em que o cristal cruza o centro da tela. */
  at: number;
  /** fator de parallax (menor = fundo, mais lento). */
  speed: number;
  x: number;
  height: number;
  rot0: number;
  spin: number;
  tex: number;
  phase: number;
}

/**
 * Cena 2 — o boneco programando no notebook, cercado por cristais e
 * blocos de neve subindo em parallax (o "céu de nuvens" do original,
 * traduzido pra temática de neve).
 */
export function CodeScene() {
  const heroTex = useTexture("/snowmania/chars/coder.webp");
  const crystalTex = useTexture(CRYSTAL_FILES);
  const { viewport } = useThree();
  const group = useRef<THREE.Group>(null);
  const hero = useRef<THREE.Mesh>(null);
  const crystals = useRef<(THREE.Mesh | null)[]>([]);

  useLayoutEffect(() => {
    for (const tex of [heroTex, ...crystalTex]) {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
    }
  }, [heroTex, crystalTex]);

  const defs = useMemo<CrystalDef[]>(() => {
    const rand = mulberry32(777);
    const vw = viewport.width;
    const vh = viewport.height;
    const out: CrystalDef[] = [];
    for (let i = 0; i < 16; i++) {
      // cristais evitam a coluna do texto (à esquerda), preferem bordas/direita
      const side = rand();
      const left = side >= 0.72;
      const x = left
        ? -vw * (0.45 + rand() * 0.1) // borda esquerda, colado no limite
        : vw * (0.08 + rand() * 0.42); // direita
      out.push({
        at: 210 + rand() * 300,
        speed: 0.3 + rand() * 0.45,
        x,
        height: vh * (left ? 0.06 + rand() * 0.08 : 0.07 + rand() * 0.13),
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
    return img ? img.width / img.height : 1;
  }, [heroTex]);

  // em telas estreitas o herói encolhe e desce pro texto respirar
  const narrow = viewport.width <= 980;
  const heroH = narrow
    ? Math.min(viewport.height * 0.45, viewport.width * 0.88)
    : viewport.height * 0.55;

  useFrame((state, dt) => {
    const { scrollVh } = useMania.getState();
    const g = group.current;
    if (!g) return;
    const active = scrollVh > 180 && scrollVh < 540;
    g.visible = active;
    if (!active) return;

    const vw = viewport.width;
    const vh = viewport.height;
    const t = state.clock.elapsedTime;

    // herói: entra de baixo, flutua digitando, sai por cima
    const p = clamp01((scrollVh - 225) / 255);
    const enter = easeOutCubic(clamp01(p / 0.22));
    const exit = easeInCubic(clamp01((p - 0.85) / 0.15));
    const heroMesh = hero.current;
    if (heroMesh) {
      const isNarrow = vw <= 980;
      heroMesh.position.x = isNarrow ? 0 : vw * 0.26;
      const yHold = isNarrow ? -vh * 0.26 : -vh * 0.05;
      heroMesh.position.y =
        lerp(-vh * 0.98, yHold, enter) +
        exit * vh * 1.15 +
        Math.sin(t * 1.4) * vh * 0.012;
      heroMesh.rotation.z = -0.04 + Math.sin(t * 0.8) * 0.05;
    }

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
      <mesh ref={hero} position={[0, -10000, 30]}>
        <planeGeometry args={[heroH * heroAspect, heroH]} />
        <meshBasicMaterial
          map={heroTex}
          transparent
          alphaTest={0.02}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
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
            position={[d.x, -10000, 5 + (i % 5)]}
            rotation={[0, 0, d.rot0]}
          >
            <planeGeometry args={[d.height * aspect, d.height]} />
            <meshBasicMaterial
              map={tex}
              transparent
              alphaTest={0.02}
              depthWrite={false}
              toneMapped={false}
              opacity={0.95}
            />
          </mesh>
        );
      })}
    </group>
  );
}
