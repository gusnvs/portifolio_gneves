"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import { ScreenTexture } from "./screenTexture";
import { useMania } from "../store";
import { SECTION_START_VH } from "../config";

const MODEL = "/landing/computador_antigo.glb";

// placeholder da telinha — troque por vídeos/sprite-sheets depois
const SCREEN_IMAGES = [
  "/snowmania/chars/cafe.webp",
  "/snowmania/chars/energetico.webp",
  "/snowmania/chars/boneco_de_neve.webp",
  "/snowmania/poses/float.webp",
  "/snowmania/poses/jump.webp",
];

/** posição/tamanho do plano da tela em espaço local do modelo normalizado. */
const SCREEN = {
  x: 0.06,
  y: 0.16,
  z: 0.475,
  rx: -0.02,
  ry: 0.0,
  w: 1.16,
  h: 0.87,
};

interface EnterState {
  phase: "idle" | "entering";
  t: number;
  glitch: number;
}

function ComputerModel({
  enter,
  overlayRef,
}: {
  enter: React.RefObject<EnterState>;
  overlayRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { scene } = useGLTF(MODEL);
  const { camera, gl } = useThree();
  const router = useRouter();
  const spin = useRef<THREE.Group>(null);
  const screenMat = useRef<THREE.MeshBasicMaterial>(null);
  const screenLight = useRef<THREE.PointLight>(null);
  const rimLight = useRef<THREE.PointLight>(null);
  const [hovered, setHovered] = useState(false);
  const hoverV = useRef(0);
  const navigated = useRef(false);
  const camBase = useRef(new THREE.Vector3());

  const screen = useMemo(() => new ScreenTexture(SCREEN_IMAGES), []);
  useEffect(() => () => screen.dispose(), [screen]);

  // normaliza: centraliza na origem e escala pra altura ~1.7
  const { modelScale, center } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const c = box.getCenter(new THREE.Vector3());
    return { modelScale: 1.7 / Math.max(size.x, size.y, size.z), center: c };
  }, [scene]);

  useEffect(() => {
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = false;
        m.receiveShadow = false;
      }
    });
  }, [scene]);

  useEffect(() => {
    camBase.current.copy(camera.position);
  }, [camera]);

  // cursor de "mãozinha" no hover
  useEffect(() => {
    gl.domElement.style.cursor = hovered ? "pointer" : "auto";
  }, [hovered, gl]);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const e = enter.current;

    // hover suave
    const hv = (hoverV.current += ((hovered ? 1 : 0) - hoverV.current) * Math.min(dt * 8, 1));

    // transição "entrar na tela"
    let enterP = 0;
    if (e.phase === "entering") {
      e.t += dt;
      enterP = Math.min(1, e.t / 1.25);
      e.glitch = enterP < 0.35 ? enterP * 0.4 : 0.4 + (enterP - 0.35) * 1.2;
      // dolly: câmera mergulha em direção ao centro da tela
      const target = new THREE.Vector3(
        SCREEN.x * modelScale,
        SCREEN.y * modelScale + 0.02,
        SCREEN.z * modelScale,
      );
      const k = enterP * enterP;
      camera.position.lerpVectors(camBase.current, target, k * 0.92);
      camera.lookAt(target);
      // overlay preto (cobre a troca de rota)
      if (overlayRef.current) {
        overlayRef.current.style.opacity = String(
          Math.max(0, (enterP - 0.4) / 0.6),
        );
      }
      if (enterP >= 0.72 && !navigated.current) {
        navigated.current = true;
        router.push("/system");
      }
    } else {
      e.glitch *= Math.max(0, 1 - dt * 6);
    }

    // giro sutil "vivo" quando parado (respira levemente)
    if (spin.current && e.phase === "idle") {
      spin.current.rotation.y = -0.5 + Math.sin(t * 0.3) * 0.05;
      spin.current.rotation.x = Math.sin(t * 0.24 + 1) * 0.015;
    }

    // desenha a telinha
    screen.update(t, dt, { hover: hv, enter: enterP, glitch: e.glitch });
    if (screenMat.current) {
      screenMat.current.map = screen.texture;
      // pisca/pulsa o brilho pra dar vida
      const pulse = 0.9 + Math.sin(t * 3.1) * 0.06 + Math.random() * 0.04;
      screenMat.current.color.setScalar(pulse);
    }

    // luz que a tela joga no gabinete — cor puxa pro conteúdo, laranja no hover
    if (screenLight.current) {
      const target = new THREE.Color().copy(screen.avgColor);
      if (hv > 0.01) target.lerp(new THREE.Color("#ff6a1a"), hv * 0.85);
      screenLight.current.color.lerp(target, Math.min(dt * 4, 1));
      screenLight.current.intensity =
        (2.4 + Math.sin(t * 3.1) * 0.3 + enterP * 6) * (0.85 + hv * 0.5);
    }
    if (rimLight.current) {
      rimLight.current.color.copy(screenLight.current!.color);
      rimLight.current.intensity = 1.1 + enterP * 3;
    }
  });

  return (
    <group ref={spin} rotation={[0, -0.5, 0]}>
      <primitive
        object={scene}
        position={[
          -center.x * modelScale,
          -center.y * modelScale,
          -center.z * modelScale,
        ]}
        scale={modelScale}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
        onPointerDown={() => {
          if (enter.current.phase === "idle") {
            enter.current.phase = "entering";
            enter.current.t = 0;
          }
        }}
      />

      {/* plano da tela — colado no vidro do CRT, com a textura viva */}
      <mesh
        position={[SCREEN.x * modelScale, SCREEN.y * modelScale, SCREEN.z * modelScale]}
        rotation={[SCREEN.rx, SCREEN.ry, 0]}
      >
        <planeGeometry args={[SCREEN.w * modelScale, SCREEN.h * modelScale]} />
        <meshBasicMaterial
          ref={screenMat}
          map={screen.texture}
          toneMapped={false}
          transparent
        />
      </mesh>

      {/* luz que vaza da tela e reflete no gabinete/teclado */}
      <pointLight
        ref={screenLight}
        position={[0, SCREEN.y * modelScale, SCREEN.z * modelScale + 0.15]}
        intensity={2.4}
        distance={2.2}
        decay={2}
        color="#ffb46a"
      />
      <pointLight
        ref={rimLight}
        position={[0, SCREEN.y * modelScale + 0.1, SCREEN.z * modelScale + 0.02]}
        intensity={1.1}
        distance={1.1}
        decay={2}
        color="#ffb46a"
      />
    </group>
  );
}

/**
 * Section final — o computador retrô 3D com a tela viva. Hover mostra ENTER,
 * clique mergulha na tela (glitch) e abre /system. Canvas próprio (perspectiva
 * + bloom) sobre o fundo escuro da cena noturna.
 */
export function RetroComputer() {
  const enter = useRef<EnterState>({ phase: "idle", t: 0, glitch: 0 });
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  // só monta o canvas (2º contexto WebGL + bloom) perto da seção final —
  // evita rodar duas cenas pesadas ao mesmo tempo o site inteiro
  const [active, setActive] = useState(false);

  useEffect(() => {
    setMounted(true);
    const gate = SECTION_START_VH.night - 170;
    return useMania.subscribe((s) =>
      setActive((prev) => {
        const on = s.scrollVh > gate;
        return prev === on ? prev : on;
      }),
    );
  }, []);

  return (
    <div className="retro-stage">
      {active && (
        <Canvas
          camera={{ position: [0, 0.15, 3.15], fov: 34, near: 0.1, far: 20 }}
          gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
          dpr={[1, 1.8]}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[3, 4, 5]} intensity={1.1} />
          <directionalLight position={[-4, 1, 2]} intensity={0.4} color="#8a9bff" />
          <ComputerModel enter={enter} overlayRef={overlayRef} />
          <EffectComposer enableNormalPass={false}>
            <Bloom
              intensity={0.9}
              luminanceThreshold={0.35}
              luminanceSmoothing={0.5}
              mipmapBlur
            />
          </EffectComposer>
        </Canvas>
      )}
      {/* overlay de transição (portal p/ body → cobre até o header) */}
      {mounted &&
        createPortal(
          <div ref={overlayRef} className="retro-enter-overlay" aria-hidden />,
          document.body,
        )}
    </div>
  );
}

useGLTF.preload(MODEL);
