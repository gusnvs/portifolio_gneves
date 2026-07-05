"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useMania } from "../store";
import { mulberry32 } from "./utils";
import {
  SECTION_START_VH,
  TOTAL_VH,
  SECTION_PLANE_COLORS,
  BASE_BG,
} from "../config";

/**
 * Planos coloridos que sobem cobrindo a seção anterior — a divisa entre
 * seções do site de referência. A borda superior inclina conforme a
 * velocidade do scroll e assenta na horizontal quando ele para. Cada plano
 * carrega "poças" de creme orgânicas perto da borda.
 */

const DIVIDERS = [
  { start: SECTION_START_VH.fall, color: SECTION_PLANE_COLORS.fall, order: 10 },
  { start: SECTION_START_VH.bio, color: SECTION_PLANE_COLORS.bio, order: 20 },
  { start: SECTION_START_VH.night, color: SECTION_PLANE_COLORS.night, order: 30 },
];

/** Textura de poça orgânica (blob de bordas suaves) desenhada uma vez. */
function makeBlobTexture(seed: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const rand = mulberry32(seed);
  const cx = size / 2;
  const cy = size / 2;
  const base = size * 0.3;
  const lobes = 3 + Math.floor(rand() * 2);
  const phase = rand() * Math.PI * 2;
  const amp = 0.22 + rand() * 0.12;
  const points: [number, number][] = [];
  const steps = 48;
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const r =
      base *
      (1 +
        amp * Math.sin(lobes * a + phase) +
        0.1 * Math.sin((lobes + 2) * a - phase * 1.7));
    points.push([cx + r * Math.cos(a) * 1.35, cy + r * Math.sin(a) * 0.75]);
  }
  ctx.fillStyle = BASE_BG;
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const [x0, y0] = points[i % steps];
    const [x1, y1] = points[(i + 1) % steps];
    if (i === 0) ctx.moveTo((x0 + x1) / 2, (y0 + y1) / 2);
    else ctx.quadraticCurveTo(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
  }
  ctx.closePath();
  ctx.fill();
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function DividersScene() {
  const { viewport } = useThree();
  const groups = useRef<(THREE.Group | null)[]>([]);
  const tilt = useRef(0);

  const blobTextures = useMemo(
    () => [makeBlobTexture(11), makeBlobTexture(47), makeBlobTexture(83)],
    [],
  );

  // poças por divisor: [x relativo à largura, y em vh abaixo da borda, escala]
  const blobLayouts = useMemo(
    () => [
      [
        { x: -0.18, y: 0.55, s: 0.5, tex: 0 },
        { x: 0.3, y: 1.4, s: 0.38, tex: 1 },
      ],
      [
        { x: 0.22, y: 0.6, s: 0.46, tex: 2 },
        { x: -0.3, y: 1.5, s: 0.34, tex: 0 },
      ],
      [
        { x: -0.24, y: 0.7, s: 0.42, tex: 1 },
      ],
    ],
    [],
  );

  useFrame((_, dt) => {
    const { scrollVh, velocity } = useMania.getState();
    const vw = viewport.width;
    const vh = viewport.height;

    // inclinação da borda segue a velocidade do scroll, suavizada
    const target = THREE.MathUtils.clamp(-velocity * 0.00006, -0.09, 0.09);
    tilt.current += (target - tilt.current) * Math.min(dt * 5, 1);

    const scrollPx = (scrollVh / 100) * vh;
    for (let i = 0; i < DIVIDERS.length; i++) {
      const g = groups.current[i];
      if (!g) continue;
      const startPx = (DIVIDERS[i].start / 100) * vh;
      const topEdgeY = vh / 2 - (startPx - scrollPx);
      // só renderiza quando está perto da viewport
      const visible = topEdgeY > -vh * 0.75;
      g.visible = visible;
      if (!visible) continue;
      g.position.y = topEdgeY;
      g.rotation.z = tilt.current * (1 - i * 0.15);
    }
  });

  return (
    <>
      {DIVIDERS.map((d, i) => {
        const vw = viewport.width;
        const vh = viewport.height;
        const planeH = ((TOTAL_VH - d.start + 200) / 100) * vh;
        return (
          <group
            key={i}
            ref={(el) => {
              groups.current[i] = el;
            }}
            visible={false}
          >
            {/* plano colorido — origem na borda superior */}
            <mesh position={[0, -planeH / 2, 40 + i * 10]} renderOrder={d.order}>
              <planeGeometry args={[vw * 1.9, planeH]} />
              <meshBasicMaterial
                color={d.color}
                transparent
                depthWrite={false}
                toneMapped={false}
              />
            </mesh>
            {blobLayouts[i].map((b, j) => {
              const blobW = vw * b.s;
              return (
                <mesh
                  key={j}
                  position={[b.x * vw, -b.y * vh * 0.5 - blobW * 0.14, 41 + i * 10]}
                  renderOrder={d.order + 1}
                >
                  <planeGeometry args={[blobW, blobW * 0.55]} />
                  <meshBasicMaterial
                    map={blobTextures[b.tex]}
                    transparent
                    depthWrite={false}
                    toneMapped={false}
                  />
                </mesh>
              );
            })}
          </group>
        );
      })}
    </>
  );
}
