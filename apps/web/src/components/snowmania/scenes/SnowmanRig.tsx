"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { useMania } from "../store";
import { CARD_PHASE } from "../config";
import { clamp01 } from "./utils";

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

// ordem das camadas: base < mão esquerda (fica ATRÁS do braço) < braço
// direito < cabeça < fumaça
const PARTS: PartDef[] = [
  { file: "/snowmania/parts/base.png", left: 0, top: 0, width: 1448, height: 1086, ox: 0.5, oy: 0.5, order: 13 },
  { file: "/snowmania/parts/left-hand.png", left: 580, top: 430, width: 120, height: (120 * 434) / 427, ox: 0.45, oy: 0.6, order: 13.05 },
  { file: "/snowmania/parts/right-arm-hand.png", left: 513, top: 415, width: 314, height: (314 * 531) / 784, ox: 0.18, oy: 0.72, order: 13.1 },
  { file: "/snowmania/parts/head.png", left: 95, top: 10, width: 724, height: (724 * 1086) / 1448, ox: 0.64, oy: 0.76, order: 13.2 },
  { file: "/snowmania/parts/smoke.png", left: 1003, top: 312, width: 101, height: (101 * 552) / 288, ox: 0.5, oy: 1, order: 13.25 },
];

const IDX = { base: 0, arm: 1, hand: 2, head: 3, smoke: 4 } as const;

const deg = THREE.MathUtils.degToRad;

/**
 * Coreografia da imagem ao longo da fase dos cards (cardP 0..1). A imagem
 * passeia: começa à direita (título à esquerda) → centro (cresce) → esquerda
 * (dá espaço pro card da direita) → cruza pro lado direito (card da esquerda)
 * → volta ao centro. x em frações da largura (0 = centro, + = direita).
 */
const KF_X: [number, number][] = [
  [0.0, 0.15],
  [0.1, 0.0],
  [0.25, -0.2],
  [0.42, -0.21],
  [0.5, 0.0],
  [0.58, 0.21],
  [0.75, 0.22],
  [0.9, 0.0],
  [1.0, 0.0],
];
/** crescimento sutil (multiplica a escala base). */
const KF_S: [number, number][] = [
  [0.0, 1.0],
  [0.1, 1.1],
  [0.5, 1.12],
  [0.9, 1.05],
  [1.0, 1.0],
];

/** interpola uma tabela de keyframes com suavização (smoothstep) entre eles. */
function kf(stops: [number, number][], x: number): number {
  if (x <= stops[0][0]) return stops[0][1];
  const last = stops[stops.length - 1];
  if (x >= last[0]) return last[1];
  for (let i = 0; i < stops.length - 1; i++) {
    const [ax, av] = stops[i];
    const [bx, bv] = stops[i + 1];
    if (x >= ax && x <= bx) {
      const u = (x - ax) / (bx - ax);
      const e = u * u * (3 - 2 * u); // smoothstep
      return av + (bv - av) * e;
    }
  }
  return last[1];
}

export function SnowmanRig({ clip }: { clip: THREE.Plane[] }) {
  const { viewport } = useThree();
  // configura cor/anisotropia no carregamento (drei chama onLoad) — evita
  // mutar o retorno do hook num efeito
  const textures = useTexture(
    PARTS.map((p) => p.file),
    (loaded) => {
      const arr = (Array.isArray(loaded) ? loaded : [loaded]) as THREE.Texture[];
      for (const tex of arr) {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 4;
      }
    },
  );
  const root = useRef<THREE.Group>(null);
  const pivots = useRef<(THREE.Group | null)[]>([]);
  const smokeMat = useRef<THREE.MeshBasicMaterial>(null);
  const cursorMat = useRef<THREE.MeshBasicMaterial>(null);
  const cursorMesh = useRef<THREE.Mesh>(null);
  // x/scale suavizados quadro a quadro (lerp) pra ninguém "teleportar"
  const smooth = useRef({ x: 0.15, s: 1, ready: false });

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

  useFrame((state, dt) => {
    const g = root.current;
    if (!g) return;

    const { scrollVh } = useMania.getState();
    const vw = viewport.width;
    const vh = viewport.height;
    const t = state.clock.elapsedTime;
    const sm = smooth.current;

    // enquadramento base
    const isNarrow = vw <= 980;
    const sceneH = isNarrow
      ? Math.min(vh * 0.5, (vw * 0.94) / (DW / DH))
      : Math.min(vh * 0.84, (vw * 0.56) / (DW / DH));
    const k = sceneH / DH;

    // --- coreografia dirigida pelo scroll (fase dos cards) --------------
    const cardP = clamp01(
      (scrollVh - CARD_PHASE.start) / (CARD_PHASE.end - CARD_PHASE.start),
    );
    // no mobile a imagem passeia bem menos (cards ficam ~centralizados)
    const ampX = isNarrow ? 0.4 : 1;
    const targetX = kf(KF_X, cardP) * ampX;
    const targetS = kf(KF_S, cardP);

    // suaviza x/scale (lerp exponencial) — nada de saltos ao mudar de beat
    if (!sm.ready) {
      sm.x = targetX;
      sm.s = targetS;
      sm.ready = true;
    }
    const lerpA = 1 - Math.exp(-6 * Math.min(dt, 0.05));
    sm.x += (targetX - sm.x) * lerpA;
    sm.s += (targetS - sm.s) * lerpA;

    // --- vida orgânica: flutua "ao vento" sempre, mesmo parado ----------
    const floatX =
      (Math.sin(t * 0.31) * 0.6 + Math.sin(t * 0.73 + 1.3) * 0.4) * vw * 0.012;
    const floatY =
      (Math.sin(t * 0.27 + 2.1) * 0.6 + Math.sin(t * 0.61 + 0.5) * 0.4) *
      vh *
      0.016;
    const floatRot =
      (Math.sin(t * 0.23) + Math.sin(t * 0.41 + 1.7) * 0.5) * deg(1.2);

    // --- deformação "amoeba": respira esticando/achatando em oposição ----
    const breathe = Math.sin(t * 0.9) * 0.02 + Math.sin(t * 1.7 + 1.1) * 0.012;
    const sx = 1 + breathe;
    const sy = 1 - breathe * 0.9;

    const baseX = isNarrow ? 0 : 0;
    const baseY = isNarrow ? -vh * 0.21 : -vh * 0.03;
    g.position.set(baseX + sm.x * vw + floatX, baseY + floatY, 60);
    g.rotation.z = floatRot;
    g.scale.set(k * sm.s * sx, k * sm.s * sy, 1);

    const head = pivots.current[IDX.head];
    const arm = pivots.current[IDX.arm];
    const hand = pivots.current[IDX.hand];
    const smoke = pivots.current[IDX.smoke];

    // IMPORTANTE: as animações SOMAM à posição-base do pivô (placed[].pivot),
    // nunca sobrescrevem — senão a peça abandona o encaixe do quebra-cabeça

    // cabeça: concentrado no código — flutua e inclina de leve, bem suave;
    // a cartola estica um tiquinho na vertical (amoeba, "orelha puxando")
    if (head) {
      const w = (1 - Math.cos((t / 3.2) * Math.PI * 2)) * 0.5; // 0..1..0
      head.rotation.z = -deg(8) * w;
      head.position.y = placed[IDX.head].pivot[1] + 4 * w;
      head.scale.set(1 - breathe * 0.7, 1 + breathe * 0.9, 1);
    }

    // braço direito: digitação — oscila rápido no pivô do ombro
    const typePhase = (t / 1.1) * Math.PI * 2;
    if (arm) {
      arm.rotation.z = -deg(3) * Math.sin(typePhase);
      // 0..-4, batidinha
      arm.position.y = placed[IDX.arm].pivot[1] - 2 * (1 - Math.cos(typePhase));
    }

    // mão esquerda: digita alternado com o braço (meio ciclo + delay)
    if (hand) {
      const p2 = typePhase + Math.PI - 0.18 * ((Math.PI * 2) / 1.1);
      hand.rotation.z = deg(2) * Math.sin(p2);
      hand.position.y = placed[IDX.hand].pivot[1] + 3 * Math.sin(p2);
    }

    // fumaça: sobe, balança e esvai — loop com fade nas pontas (sem pop)
    if (smoke && smokeMat.current) {
      const p = (t % 2.7) / 2.7;
      const ease = p * p * (3 - 2 * p);
      smoke.position.y = placed[IDX.smoke].pivot[1] + 24 * ease;
      smoke.position.x = placed[IDX.smoke].pivot[0] + Math.sin(t * 1.6) * 3;
      smoke.scale.setScalar(1 + ease * 0.08);
      const fadeIn = Math.min(p * 7, 1);
      const fadeOut = 1 - THREE.MathUtils.clamp((p - 0.8) / 0.2, 0, 1);
      smokeMat.current.opacity = (0.85 - 0.5 * ease) * fadeIn * fadeOut;
    }

    // cursor do terminal: pisca e inclina levemente no sentido horário
    if (cursorMesh.current) {
      // inclinação base (-2°) + micro-oscilação horária sincronizada ao piscar
      cursorMesh.current.rotation.z = deg(-4) + deg(-4) * Math.sin(t * 1.9 * Math.PI);
    }
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
      <mesh ref={cursorMesh} position={[772 - DW / 2, DH / 2 - 175, 2.6]} renderOrder={13.05}>
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
