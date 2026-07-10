"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import { ScreenTexture } from "./screenTexture";
import { useMania } from "../store";
import { SECTION_START_VH } from "../config";

// versão otimizada (meshopt + texturas webp): 27MB → 2.8MB — carrega junto
// com a página e o computador já está lá quando o scroll chega
const MODEL = "/landing/computador.glb";

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
  x: 0.152,
  y: 0.265,
  z: 0.475,
  rx: -0.02,
  ry: 0.0,
  w: 1.32,
  h: 0.95,
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
  const { camera, gl, size } = useThree();
  const router = useRouter();
  const root = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const screenMesh = useRef<THREE.Mesh>(null);
  const screenMat = useRef<THREE.MeshBasicMaterial>(null);
  const screenLight = useRef<THREE.PointLight>(null);
  const rimLight = useRef<THREE.PointLight>(null);
  const [hovered, setHovered] = useState(false);
  const hoverV = useRef(0);
  const navigated = useRef(false);
  // posição de descanso da câmera — CONSTANTE (não capturada da câmera, que
  // pode estar "suja" de um mergulho anterior/HMR); o idle reimpõe todo frame
  const camHome = useMemo(() => new THREE.Vector3(0, 0.15, 3.6), []);
  const vScreen = useMemo(() => new THREE.Vector3(), []);
  const vLook = useMemo(() => new THREE.Vector3(), []);
  const vIdle = useMemo(() => new THREE.Vector3(), []);

  const screen = useMemo(() => new ScreenTexture(SCREEN_IMAGES), []);
  useEffect(() => () => screen.dispose(), [screen]);

  // normaliza: centraliza na origem e escala pra uma altura contida
  const { modelScale, center } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const s = box.getSize(new THREE.Vector3());
    const c = box.getCenter(new THREE.Vector3());
    return { modelScale: 1.26 / Math.max(s.x, s.y, s.z), center: c };
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

  // cursor de "mãozinha" no hover
  useEffect(() => {
    gl.domElement.style.cursor = hovered ? "pointer" : "auto";
  }, [hovered, gl]);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const e = enter.current;

    // computador vive à direita (desktop) / centralizado (mobile). Posição
    // DIRETA (sem lerp) — senão ele "desliza" de tamanho/lugar no primeiro
    // segundo depois de montar
    if (root.current && e.phase === "idle") {
      root.current.position.x = size.width <= 900 ? 0 : 0.5;
    }

    // hover suave
    const hv = (hoverV.current += ((hovered ? 1 : 0) - hoverV.current) * Math.min(dt * 8, 1));

    // transição "entrar na tela" (mais lenta e cadenciada)
    let enterP = 0;
    if (e.phase === "entering") {
      const DUR = 2.1;
      e.t += dt;
      enterP = Math.min(1, e.t / DUR);
      // glitch sobe e segura no fim (a tela escurece por baixo) — contido
      e.glitch =
        enterP < 0.4 ? enterP * 0.6 : Math.min(0.75, 0.24 + (enterP - 0.4) * 1.1);
      // dolly acelera (easeIn) mergulhando até a posição REAL da tela no mundo
      if (screenMesh.current) screenMesh.current.getWorldPosition(vScreen);
      const dive = enterP * enterP;
      camera.position.lerpVectors(camHome, vScreen, dive * 0.94);
      // olhar interpola do frontal (mesma direção do idle) até a tela —
      // sem isso a câmera "salta" no início da transição
      vIdle.set(camHome.x, camHome.y, 0);
      vLook.lerpVectors(vIdle, vScreen, Math.min(1, enterP * 1.35));
      camera.lookAt(vLook);
      // overlay preto entra só no finalzinho (a tela já escureceu antes)
      if (overlayRef.current) {
        overlayRef.current.style.opacity = String(
          Math.max(0, (enterP - 0.62) / 0.28),
        );
      }
      if (enterP >= 0.86 && !navigated.current) {
        navigated.current = true;
        try {
          sessionStorage.setItem("gneves:boot", "1");
        } catch {}
        router.push("/system");
      }
    } else {
      e.glitch *= Math.max(0, 1 - dt * 6);
      // idle REIMPÕE a câmera de descanso todo frame — nenhum resto de
      // mergulho anterior (ou HMR) pode deixar o enquadramento deslocado
      camera.position.copy(camHome);
      camera.quaternion.identity();
    }

    // giro sutil "vivo" quando parado (respira levemente)
    const dbg = window as unknown as { __alignDebug?: boolean; __alignHide?: boolean };
    const debugging = dbg.__alignDebug || dbg.__alignHide;
    if (spin.current && e.phase === "idle") {
      // calibração exige pose congelada (o balanço mudaria entre as fotos)
      spin.current.rotation.y = debugging ? -0.5 : -0.5 + Math.sin(t * 0.3) * 0.05;
      spin.current.rotation.x = debugging ? 0 : Math.sin(t * 0.24 + 1) * 0.015;
    }

    // desenha a telinha
    screen.update(t, dt, { hover: hv, enter: enterP, glitch: e.glitch });
    if (screenMesh.current) screenMesh.current.visible = !dbg.__alignHide;
    if (screenMat.current) {
      if (dbg.__alignDebug) {
        // DEBUG: magenta escuro (sem bloom) p/ medir o bbox do plano
        if (screenMat.current.map) {
          screenMat.current.map = null;
          screenMat.current.needsUpdate = true;
        }
        screenMat.current.color.set("#7a007a");
      } else {
        if (!screenMat.current.map) {
          screenMat.current.map = screen.texture;
          screenMat.current.needsUpdate = true;
        }
        // pisca/pulsa o brilho pra dar vida
        const pulse = 0.9 + Math.sin(t * 3.1) * 0.06 + Math.random() * 0.04;
        screenMat.current.color.setScalar(pulse);
      }
    }

    // luz que a tela joga no gabinete — cor puxa pro conteúdo, laranja no hover
    if (screenLight.current) {
      const target = new THREE.Color().copy(screen.avgColor);
      if (hv > 0.01) target.lerp(new THREE.Color("#ff6a1a"), hv * 0.85);
      screenLight.current.color.lerp(target, Math.min(dt * 4, 1));
      screenLight.current.intensity = debugging
        ? 0 // iluminação determinística durante a calibração
        : (2.4 + Math.sin(t * 3.1) * 0.3 + enterP * 6) * (0.85 + hv * 0.5);
    }
    if (rimLight.current) {
      rimLight.current.color.copy(screenLight.current!.color);
      rimLight.current.intensity = debugging ? 0 : 1.1 + enterP * 3;
    }
  });

  return (
    <group ref={root}>
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
          ref={screenMesh}
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
  // o canvas monta JUNTO com a página (o GLB de 2.8MB carrega atrás do
  // preloader — useProgress é global) e NUNCA desmonta: o computador está
  // sempre pronto, como qualquer outro elemento. Longe da seção final só o
  // loop de render pausa (frameloop="never") pra não custar GPU à toa.
  const [running, setRunning] = useState(false);

  useEffect(() => {
    setMounted(true);
    const runGate = SECTION_START_VH.night - 300;
    const apply = (scrollVh: number) =>
      setRunning((prev) => {
        const on = scrollVh > runGate;
        return prev === on ? prev : on;
      });
    apply(useMania.getState().scrollVh);
    return useMania.subscribe((s) => apply(s.scrollVh));
  }, []);

  return (
    <div className="retro-stage">
      {mounted && (
        <Canvas
          frameloop={running ? "always" : "never"}
          camera={{ position: [0, 0.15, 3.6], fov: 34, near: 0.1, far: 20 }}
          gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
          dpr={[1, 1.8]}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[3, 4, 5]} intensity={1.1} />
          <directionalLight position={[-4, 1, 2]} intensity={0.4} color="#8a9bff" />
          <Suspense fallback={null}>
            <ComputerModel enter={enter} overlayRef={overlayRef} />
          </Suspense>
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
