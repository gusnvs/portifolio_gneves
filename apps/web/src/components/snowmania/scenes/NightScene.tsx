"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useMania } from "../store";
import { clamp01, mulberry32 } from "./utils";

/** Textura procedural de círculo suave (estrelas/vagalumes). */
function makeGlowTexture(): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.35, "rgba(255,255,255,0.8)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

interface FireflyDef {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  fx: number;
  fy: number;
  phase: number;
  size: number;
}

/**
 * Cena 4 — céu noturno: estrelas piscando + vagalumes laranja
 * vagando em curvas lentas.
 */
export function NightScene() {
  const { viewport } = useThree();
  const group = useRef<THREE.Group>(null);
  const starMatA = useRef<THREE.PointsMaterial>(null);
  const starMatB = useRef<THREE.PointsMaterial>(null);
  const fireflies = useRef<(THREE.Mesh | null)[]>([]);
  const fireflyMats = useRef<(THREE.MeshBasicMaterial | null)[]>([]);

  const glowTex = useMemo(() => makeGlowTexture(), []);

  const { starsA, starsB, flies } = useMemo(() => {
    const rand = mulberry32(4242);
    const vw = viewport.width;
    const vh = viewport.height;
    const make = (count: number) => {
      const arr = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        arr[i * 3] = (rand() - 0.5) * vw * 1.05;
        arr[i * 3 + 1] = (rand() - 0.5) * vh * 1.05;
        arr[i * 3 + 2] = 1;
      }
      return arr;
    };
    const fliesOut: FireflyDef[] = [];
    for (let i = 0; i < 11; i++) {
      fliesOut.push({
        cx: (rand() - 0.5) * vw * 0.85,
        cy: (rand() - 0.35) * vh * 0.75,
        rx: vw * (0.04 + rand() * 0.09),
        ry: vh * (0.03 + rand() * 0.08),
        fx: 0.15 + rand() * 0.3,
        fy: 0.12 + rand() * 0.28,
        phase: rand() * Math.PI * 2,
        size: vh * (0.008 + rand() * 0.012),
      });
    }
    return { starsA: make(70), starsB: make(55), flies: fliesOut };
  }, [viewport.width, viewport.height]);

  useFrame((state) => {
    const { scrollVh } = useMania.getState();
    const g = group.current;
    if (!g) return;
    const nightP = clamp01((scrollVh - 600) / 90);
    g.visible = nightP > 0.01;
    if (!g.visible) return;

    const t = state.clock.elapsedTime;
    if (starMatA.current) {
      starMatA.current.opacity = nightP * (0.55 + 0.45 * Math.sin(t * 1.1));
    }
    if (starMatB.current) {
      starMatB.current.opacity = nightP * (0.55 + 0.45 * Math.sin(t * 1.6 + 2.1));
    }
    for (let i = 0; i < flies.length; i++) {
      const mesh = fireflies.current[i];
      const mat = fireflyMats.current[i];
      const d = flies[i];
      if (!mesh || !mat) continue;
      mesh.position.x = d.cx + Math.sin(t * d.fx + d.phase) * d.rx;
      mesh.position.y = d.cy + Math.cos(t * d.fy + d.phase) * d.ry;
      mat.opacity = nightP * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 1.8 + d.phase)));
    }
  });

  return (
    <group ref={group} visible={false}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[starsA, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={starMatA}
          map={glowTex}
          color="#f4ece0"
          size={3.5}
          sizeAttenuation={false}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[starsB, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={starMatB}
          map={glowTex}
          color="#ffd9b8"
          size={5}
          sizeAttenuation={false}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      {flies.map((d, i) => (
        <mesh
          key={i}
          ref={(el) => {
            fireflies.current[i] = el;
          }}
          position={[d.cx, d.cy, 2]}
        >
          <planeGeometry args={[d.size * 2.4, d.size * 2.4]} />
          <meshBasicMaterial
            ref={(el) => {
              fireflyMats.current[i] = el;
            }}
            map={glowTex}
            color="#ff8a3d"
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}
