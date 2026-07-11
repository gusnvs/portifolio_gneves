"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useMania } from "../store";
import { makeBlobTexture, sharedFx } from "./utils";
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


export function DividersScene() {
  const { viewport } = useThree();
  const groups = useRef<(THREE.Group | null)[]>([]);
  const tilt = useRef(0);

  const blobTextures = useMemo(
    () => [
      makeBlobTexture(11, BASE_BG),
      makeBlobTexture(47, BASE_BG),
      makeBlobTexture(83, BASE_BG),
    ],
    [],
  );

  // poças por divisor: [x relativo à largura, y em vh abaixo da borda, escala]
  // (seção 2 fica SEM poças no plano — lá as nuvens sobem sozinhas no CodeScene)
  const blobLayouts = useMemo<
    { x: number; y: number; s: number; tex: number }[][]
  >(
    () => [
      [],
      [
        { x: 0.22, y: 0.6, s: 0.46, tex: 2 },
        { x: -0.3, y: 1.5, s: 0.34, tex: 0 },
      ],
      // seção final (noite): sem poça — só o computador retrô
      [],
    ],
    [],
  );

  useFrame((_, dt) => {
    const { scrollVh, velocity } = useMania.getState();
    const vh = viewport.height;

    // inclinação da borda segue a velocidade do scroll, suavizada
    const target = THREE.MathUtils.clamp(-velocity * 0.00006, -0.09, 0.09);
    tilt.current += (target - tilt.current) * Math.min(dt * 5, 1);
    sharedFx.tilt = tilt.current;

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
