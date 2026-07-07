"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

/**
 * A ilustração central da seção "sim, a lenda" — o boneco de neve
 * programando dentro da cartola — montada como quebra-cabeça de camadas
 * (mesma mecânica do ponpon-mania/about#team): a base fica parada e cada
 * peça (cabeça, braço, mão, fumaça) anima em loop no próprio pivô.
 *
 * Coordenadas no espaço de design 1448x1086 (o mesmo do example.png);
 * o grupo raiz escala tudo pro tamanho de tela.
 */

const DW = 1448;
const DH = 1086;

interface PartDef {
  file: string;
  left: number;
  top: number;
  width: number;
  height: number;
  /** transform-origin relativo (0..1) — pivô das animações */
  ox: number;
  oy: number;
  order: number;
}

// ordem das camadas: base < braço direito < mão esquerda < cabeça < fumaça
const PARTS: PartDef[] = [
  { file: "/snowmania/parts/base.png", left: 0, top: 0, width: 1448, height: 1086, ox: 0.5, oy: 0.5, order: 13 },
  { file: "/snowmania/parts/right-arm-hand.png", left: 513, top: 415, width: 314, height: (314 * 531) / 784, ox: 0.18, oy: 0.72, order: 13.1 },
  { file: "/snowmania/parts/left-hand.png", left: 590, top: 452, width: 120, height: (120 * 434) / 427, ox: 0.45, oy: 0.6, order: 13.15 },
  { file: "/snowmania/parts/head.png", left: 117, top: -6, width: 724, height: (724 * 1086) / 1448, ox: 0.64, oy: 0.76, order: 13.2 },
  { file: "/snowmania/parts/smoke.png", left: 1003, top: 312, width: 101, height: (101 * 552) / 288, ox: 0.5, oy: 1, order: 13.25 },
];

const IDX = { base: 0, arm: 1, hand: 2, head: 3, smoke: 4 } as const;

const deg = THREE.MathUtils.degToRad;

export function SnowmanRig({ clip }: { clip: THREE.Plane[] }) {
  const { viewport } = useThree();
  const textures = useTexture(PARTS.map((p) => p.file));
  const root = useRef<THREE.Group>(null);
  const pivots = useRef<(THREE.Group | null)[]>([]);
  const smokeMat = useRef<THREE.MeshBasicMaterial>(null);
  const cursorMat = useRef<THREE.MeshBasicMaterial>(null);

  useEffect(() => {
    for (const tex of textures) {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
    }
  }, [textures]);

  // pivô e offset do mesh em coordenadas de design centradas (y pra cima)
  const placed = useMemo(
    () =>
      PARTS.map((p) => {
        const cx = p.left + p.width / 2;
        const cy = p.top + p.height / 2;
        const px = p.left + p.width * p.ox;
        const py = p.top + p.height * p.oy;
        return {
          pivot: [px - DW / 2, DH / 2 - py] as const,
          offset: [cx - px, py - cy] as const,
        };
      }),
    [],
  );

  useFrame((state) => {
    const g = root.current;
    if (!g) return;

    const vw = viewport.width;
    const vh = viewport.height;
    const t = state.clock.elapsedTime;

    // enquadramento: central, um pouco à direita (o título fica à esquerda)
    const isNarrow = vw <= 980;
    const sceneH = isNarrow
      ? Math.min(vh * 0.5, (vw * 0.94) / (DW / DH))
      : Math.min(vh * 0.84, (vw * 0.56) / (DW / DH));
    const k = sceneH / DH;
    g.scale.set(k, k, 1);
    g.position.set(isNarrow ? 0 : vw * 0.15, isNarrow ? -vh * 0.21 : -vh * 0.03, 60);

    const head = pivots.current[IDX.head];
    const arm = pivots.current[IDX.arm];
    const hand = pivots.current[IDX.hand];
    const smoke = pivots.current[IDX.smoke];

    // cabeça: concentrado no código — flutua e inclina de leve, bem suave
    if (head) {
      const w = (1 - Math.cos((t / 3.2) * Math.PI * 2)) * 0.5; // 0..1..0
      head.rotation.z = -deg(8) * w;
      head.position.y = 4 * w;
    }

    // braço direito: digitação — oscila rápido no pivô do ombro
    const typePhase = (t / 1.1) * Math.PI * 2;
    if (arm) {
      arm.rotation.z = -deg(3) * Math.sin(typePhase);
      arm.position.y = -2 * (1 - Math.cos(typePhase)); // 0..-4, batidinha
    }

    // mão esquerda: digita alternado com o braço (meio ciclo + delay)
    if (hand) {
      const p2 = typePhase + Math.PI - 0.18 * ((Math.PI * 2) / 1.1);
      hand.rotation.z = deg(2) * Math.sin(p2);
      hand.position.y = 3 * Math.sin(p2);
    }

    // fumaça: sobe, balança e esvai — loop com fade nas pontas (sem pop)
    if (smoke && smokeMat.current) {
      const p = (t % 2.7) / 2.7;
      const ease = p * p * (3 - 2 * p);
      smoke.position.y = 24 * ease;
      smoke.position.x = Math.sin(t * 1.6) * 3;
      smoke.scale.setScalar(1 + ease * 0.08);
      const fadeIn = Math.min(p * 7, 1);
      const fadeOut = 1 - THREE.MathUtils.clamp((p - 0.8) / 0.2, 0, 1);
      smokeMat.current.opacity = (0.85 - 0.5 * ease) * fadeIn * fadeOut;
    }

    // cursor do terminal piscando ao lado do prompt ">_"
    if (cursorMat.current) {
      cursorMat.current.opacity = (t * 1.9) % 2 < 1 ? 0.85 : 0;
    }
  });

  return (
    <group ref={root}>
      {PARTS.map((p, i) => (
        <group
          key={p.file}
          ref={(el) => {
            pivots.current[i] = el;
          }}
          position={[placed[i].pivot[0], placed[i].pivot[1], i * 0.5]}
        >
          <mesh
            position={[placed[i].offset[0], placed[i].offset[1], 0]}
            renderOrder={p.order}
          >
            <planeGeometry args={[p.width, p.height]} />
            <meshBasicMaterial
              ref={i === IDX.smoke ? smokeMat : undefined}
              map={textures[i]}
              transparent
              depthWrite={false}
              toneMapped={false}
              clippingPlanes={clip}
            />
          </mesh>
        </group>
      ))}
      {/* cursor piscando na tela do monitor (logo após o ">_" da arte) */}
      <mesh position={[772 - DW / 2, DH / 2 - 174, 2.6]} rotation={[0, 0, deg(-2)]} renderOrder={13.05}>
        <planeGeometry args={[17, 5.5]} />
        <meshBasicMaterial
          ref={cursorMat}
          color="#efe4cf"
          transparent
          opacity={0}
          depthWrite={false}
          toneMapped={false}
          clippingPlanes={clip}
        />
      </mesh>
    </group>
  );
}

useTexture.preload(PARTS.map((p) => p.file));
