"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import { ScreenTexture } from "./screenTexture";
import { RetroTvTransition } from "./RetroTvTransition";
import { useMania } from "../store";
import { SECTION_START_VH } from "../config";

// versão otimizada (meshopt + texturas webp): 27MB → 2.8MB — carrega junto
// com a página e o computador já está lá quando o scroll chega
const MODEL = "/landing/computador.glb";

// fallback instantâneo da telinha enquanto os vídeos baixam/decodificam
const SCREEN_IMAGES = [
  "/snowmania/chars/cafe.webp",
  "/snowmania/chars/energetico.webp",
  "/snowmania/chars/boneco_de_neve.webp",
];

// os vídeos reais da telinha — carregam preguiçosamente (warm()) quando o
// usuário se aproxima da seção final, nunca competindo com o load da home
const SCREEN_VIDEOS = [
  "/videos/video_boneco.mp4",
  "/videos/video_cafe.mp4",
  "/videos/video_energetico.mp4",
];

/**
 * Transformação da tela no espaço do modelo + curvatura por lado (pra
 * conformar ao vidro abaulado do CRT). Valores cravados via ajustador ao
 * vivo (window.__placeScreen). c* = quanto cada lado curva pra fora
 * (barril) ou pra dentro; bulge = abaulamento central em direção ao vidro.
 */
const SCREEN = {
  x: -0.024,
  y: 0.267,
  z: 0.163,
  rx: -0.084,
  ry: 0.026,
  w: 0.995,
  h: 0.8,
  cTop: 0.084,
  cBottom: 0.06,
  cLeft: 0.06,
  cRight: 0.036,
  bulge: 0.0,
};

/**
 * Posição/tamanho do CONJUNTO inteiro (computador + tela + luzes) na cena.
 * x/y deslocam, scale multiplica o tamanho. Ajustável ao vivo via
 * window.__placeRig (mesma ideia do ajustador da tela).
 */
const RIG = { x: 0.72, y: 0.18, scale: 1.1 };

function fmtRig(r: typeof RIG): string {
  return `{ x: ${r.x.toFixed(3)}, y: ${r.y.toFixed(3)}, scale: ${r.scale.toFixed(3)} }`;
}

/** formata a config da tela pronta pra colar de volta no SCREEN. */
function fmtScreen(c: typeof SCREEN): string {
  return (
    `{ x: ${c.x.toFixed(3)}, y: ${c.y.toFixed(3)}, z: ${c.z.toFixed(3)}, ` +
    `rx: ${c.rx.toFixed(3)}, ry: ${c.ry.toFixed(3)}, w: ${c.w.toFixed(3)}, h: ${c.h.toFixed(3)}, ` +
    `cTop: ${c.cTop.toFixed(3)}, cBottom: ${c.cBottom.toFixed(3)}, cLeft: ${c.cLeft.toFixed(3)}, ` +
    `cRight: ${c.cRight.toFixed(3)}, bulge: ${c.bulge.toFixed(3)} }`
  );
}

function ComputerModel({ onEnter }: { onEnter: () => void }) {
  const { scene } = useGLTF(MODEL);
  const { camera, gl, size } = useThree();
  const root = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const screenMesh = useRef<THREE.Mesh>(null);
  const screenMat = useRef<THREE.MeshBasicMaterial>(null);
  const screenLight = useRef<THREE.PointLight>(null);
  const rimLight = useRef<THREE.PointLight>(null);
  const [hovered, setHovered] = useState(false);
  const hoverV = useRef(0);
  // posição de descanso da câmera — CONSTANTE; reimposta todo frame pra nenhum
  // resto de HMR deixar o enquadramento deslocado
  const camHome = useMemo(() => new THREE.Vector3(0, 0.15, 3.6), []);
  // config VIVA da tela (pos/ângulo/tamanho/curvatura) — ajustável no
  // navegador via teclado (window.__placeScreen = true), sem ferramenta externa
  const cfg = useRef({ ...SCREEN });
  const rig = useRef({ ...RIG }); // posição/tamanho do conjunto inteiro
  const curveSel = useRef(0); // 0..4 = topo/baixo/esq/dir/bulge
  const curveDirty = useRef(true); // recalcula a malha curvada quando muda
  // malha subdividida (deformável) + posições planas de referência
  const screenGeo = useMemo(() => new THREE.PlaneGeometry(1, 1, 40, 30), []);
  const basePos = useMemo(
    () => Float32Array.from(screenGeo.attributes.position.array),
    [screenGeo],
  );
  useEffect(() => () => screenGeo.dispose(), [screenGeo]);

  const screen = useMemo(
    () => new ScreenTexture(SCREEN_IMAGES, SCREEN_VIDEOS),
    [],
  );
  useEffect(() => () => screen.dispose(), [screen]);

  // fora da seção final os vídeos pausam (nada decodifica à toa)
  useEffect(() => {
    const runGate = SECTION_START_VH.night - 300;
    return useMania.subscribe((s) => screen.setActive(s.scrollVh > runGate));
  }, [screen]);

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

  // MODO DE POSICIONAMENTO (window.__placeScreen = true): ajusta a tela ao
  // vivo por teclado, vendo no ângulo real. setas=mover · w/s=profundidade ·
  // a/d=girar horizontal · q/e=girar vertical · z/x=largura · c/v=altura ·
  // Shift=passo fino · P=imprime os números prontos pra colar
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      const w = window as unknown as { __placeScreen?: boolean; __placeRig?: boolean };

      // MODO CONJUNTO (window.__placeRig = true): move/escala o computador todo
      if (w.__placeRig) {
        const r = rig.current;
        const ff = ev.shiftKey ? 0.25 : 1;
        const dpos = 0.02 * ff;
        const dscale = 0.03 * ff;
        const rmap: Record<string, () => void> = {
          arrowleft: () => (r.x -= dpos),
          arrowright: () => (r.x += dpos),
          arrowup: () => (r.y += dpos),
          arrowdown: () => (r.y -= dpos),
          "+": () => (r.scale += dscale),
          "=": () => (r.scale += dscale),
          "-": () => (r.scale = Math.max(0.1, r.scale - dscale)),
          p: () => console.log("RIG =", fmtRig(r)),
        };
        const rfn = rmap[ev.key] || rmap[ev.key.toLowerCase()];
        if (!rfn) return;
        ev.preventDefault();
        rfn();
        return;
      }

      if (!w.__placeScreen) return;
      const c = cfg.current;
      const f = ev.shiftKey ? 0.25 : 1;
      const dp = 0.008 * f;
      const dr = 0.008 * f;
      const ds = 0.015 * f;
      const dc = 0.012 * f; // passo da curvatura
      const curveKeys = ["cTop", "cBottom", "cLeft", "cRight", "bulge"] as const;
      const k = ev.key.toLowerCase();
      const map: Record<string, () => void> = {
        arrowleft: () => (c.x -= dp),
        arrowright: () => (c.x += dp),
        arrowup: () => (c.y += dp),
        arrowdown: () => (c.y -= dp),
        w: () => (c.z += dp),
        s: () => (c.z -= dp),
        a: () => (c.ry -= dr),
        d: () => (c.ry += dr),
        q: () => (c.rx -= dr),
        e: () => (c.rx += dr),
        z: () => (c.w = Math.max(0.05, c.w - ds)),
        x: () => (c.w += ds),
        c: () => (c.h = Math.max(0.05, c.h - ds)),
        v: () => (c.h += ds),
        // seleção do lado a curvar (1..5) + ajuste com + / -
        "1": () => console.log("curvar: TOPO (use + / -)"),
        "2": () => console.log("curvar: BAIXO (use + / -)"),
        "3": () => console.log("curvar: ESQUERDA (use + / -)"),
        "4": () => console.log("curvar: DIREITA (use + / -)"),
        "5": () => console.log("curvar: BULGE central (use + / -)"),
        "+": () => {
          c[curveKeys[curveSel.current]] += dc;
          curveDirty.current = true;
        },
        "=": () => {
          c[curveKeys[curveSel.current]] += dc;
          curveDirty.current = true;
        },
        "-": () => {
          c[curveKeys[curveSel.current]] -= dc;
          curveDirty.current = true;
        },
        "0": () => {
          c.cTop = c.cBottom = c.cLeft = c.cRight = c.bulge = 0;
          curveDirty.current = true;
        },
        p: () => console.log("SCREEN =", fmtScreen(c)),
      };
      // 1..5 também selecionam o lado ativo
      if (k >= "1" && k <= "5") curveSel.current = Number(k) - 1;
      const fn = map[ev.key] || map[k];
      if (!fn) return;
      ev.preventDefault();
      fn();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // funções chamáveis DIRETO no console (não dependem de foco na página):
  //   __screenPrint()          → imprime o SCREEN pronto pra colar
  //   __screenSet('bulge', .1) → ajusta um campo e redesenha
  useEffect(() => {
    const w = window as unknown as {
      __screenPrint?: () => void;
      __screenSet?: (key: keyof typeof SCREEN, value: number) => void;
      __screenCfg?: typeof SCREEN;
    };
    w.__screenCfg = cfg.current;
    w.__screenPrint = () => console.log("SCREEN =", fmtScreen(cfg.current));
    w.__screenSet = (key, value) => {
      if (key in cfg.current) {
        (cfg.current as Record<string, number>)[key] = value;
        curveDirty.current = true;
      }
    };
    return () => {
      delete w.__screenPrint;
      delete w.__screenSet;
      delete w.__screenCfg;
    };
  }, []);

  // idem pro CONJUNTO: __rigPrint() imprime o RIG · __rigSet('scale', 1.2)
  useEffect(() => {
    const w = window as unknown as {
      __rigPrint?: () => void;
      __rigSet?: (key: keyof typeof RIG, value: number) => void;
      __rigCfg?: typeof RIG;
    };
    w.__rigCfg = rig.current;
    w.__rigPrint = () => console.log("RIG =", fmtRig(rig.current));
    w.__rigSet = (key, value) => {
      if (key in rig.current) (rig.current as Record<string, number>)[key] = value;
    };
    return () => {
      delete w.__rigPrint;
      delete w.__rigSet;
      delete w.__rigCfg;
    };
  }, []);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;

    // 1º frame renderizado = usuário se aproximou (frameloop saiu de
    // "never") → hora de baixar/decodificar os vídeos da telinha
    screen.warm();

    // aplica a config viva da tela (posição/ângulo/tamanho) — permite o
    // ajuste ao vivo por teclado; em uso normal só reflete o SCREEN cravado
    const c = cfg.current;
    if (screenMesh.current) {
      screenMesh.current.position.set(c.x * modelScale, c.y * modelScale, c.z * modelScale);
      screenMesh.current.rotation.set(c.rx, c.ry, 0);
      const zs = ((c.w + c.h) / 2) * modelScale;
      screenMesh.current.scale.set(c.w * modelScale, c.h * modelScale, zs);
    }

    // (re)deforma a malha da tela quando a curvatura muda — cada lado curva
    // pra fora/dentro (barril/almofada) + abaulamento central (glass do CRT)
    if (curveDirty.current) {
      curveDirty.current = false;
      const posAttr = screenGeo.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        const bx = basePos[i * 3];
        const by = basePos[i * 3 + 1];
        const u = bx * 2; // [-1,1]
        const v = by * 2;
        let x = bx;
        let y = by;
        // bordas curvam de forma independente (máx no meio do lado, 0 nos cantos)
        y += c.cTop * (1 - u * u) * Math.max(0, v);
        y -= c.cBottom * (1 - u * u) * Math.max(0, -v);
        x -= c.cLeft * (1 - v * v) * Math.max(0, -u);
        x += c.cRight * (1 - v * v) * Math.max(0, u);
        // domo central em direção ao vidro (abaulamento do glass do CRT)
        const z = c.bulge * (1 - u * u) * (1 - v * v);
        posAttr.setXYZ(i, x, y, z);
      }
      posAttr.needsUpdate = true;
      screenGeo.computeVertexNormals();
    }
    if (screenLight.current) {
      screenLight.current.position.set(0, c.y * modelScale, c.z * modelScale + 0.15);
    }
    if (rimLight.current) {
      rimLight.current.position.set(0, c.y * modelScale + 0.1, c.z * modelScale + 0.02);
    }

    // posição/tamanho do CONJUNTO (à direita no desktop, centralizado no
    // mobile). Aplicado todo frame a partir da config viva RIG — o mergulho
    // move a CÂMERA, não o conjunto, então isso fica estável na transição
    if (root.current) {
      const rc = rig.current;
      root.current.position.set(size.width <= 900 ? 0 : rc.x, rc.y, 0);
      root.current.scale.setScalar(rc.scale);
    }

    // hover suave
    const hv = (hoverV.current += ((hovered ? 1 : 0) - hoverV.current) * Math.min(dt * 8, 1));

    // câmera SEMPRE em descanso — o "entrar no sistema" não move mais a câmera
    // (a transição é o glitch de TV em tela cheia, fora do 3D); reimpõe todo
    // frame pra nenhum resto de HMR deixar o enquadramento deslocado
    camera.position.copy(camHome);
    camera.quaternion.identity();
    camera.up.set(0, 1, 0);
    const cam = camera as THREE.PerspectiveCamera;
    if (cam.fov !== 34) {
      cam.fov = 34;
      cam.updateProjectionMatrix();
    }

    // giro sutil "vivo" do computador
    const dbg = window as unknown as {
      __alignDebug?: boolean;
      __alignHide?: boolean;
      __placeScreen?: boolean;
    };
    // no modo de posicionamento a tela vira magenta chapado (limites claros
    // contra o vidro) e a pose congela pra facilitar o encaixe
    const showBounds = dbg.__alignDebug || dbg.__placeScreen;
    const debugging = showBounds || dbg.__alignHide;
    if (spin.current) {
      // calibração exige pose congelada (o balanço mudaria entre as fotos)
      const amp = debugging ? 0 : 1;
      spin.current.rotation.y = -0.5 + Math.sin(t * 0.3) * 0.05 * amp;
      spin.current.rotation.x = Math.sin(t * 0.24 + 1) * 0.015 * amp;
    }

    // desenha a telinha
    screen.update(t, dt, { hover: hv, enter: 0, glitch: 0 });
    if (screenMesh.current) screenMesh.current.visible = !dbg.__alignHide;
    if (screenMat.current) {
      if (showBounds) {
        // magenta escuro (sem bloom) — mostra os limites exatos do plano
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
        : (2.4 + Math.sin(t * 3.1) * 0.3) * (0.85 + hv * 0.5);
    }
    if (rimLight.current) {
      rimLight.current.color.copy(screenLight.current!.color);
      rimLight.current.intensity = debugging ? 0 : 1.1;
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
          onPointerDown={() => onEnter()}
        />

        {/* tela — malha subdividida DEFORMÁVEL (curva por lado + abaulamento);
            posição/ângulo/escala/curvatura vêm da config viva (cfg) no useFrame */}
        <mesh ref={screenMesh} geometry={screenGeo}>
          <meshBasicMaterial
            ref={screenMat}
            map={screen.texture}
            toneMapped={false}
            transparent
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* luz que vaza da tela e reflete no gabinete/teclado (posição vem
            do useFrame, seguindo a cfg) */}
        <pointLight ref={screenLight} intensity={2.4} distance={2.2} decay={2} color="#ffb46a" />
        <pointLight ref={rimLight} intensity={1.1} distance={1.1} decay={2} color="#ffb46a" />
      </group>
    </group>
  );
}

/**
 * Section final — o computador retrô 3D com a tela viva. Hover mostra ENTER;
 * clicar dispara o glitch de TV (a tela do usuário perde o sinal, chuvisca e
 * desliga) e abre /system. Canvas próprio (perspectiva + bloom) sobre o fundo
 * escuro da cena noturna.
 */
export function RetroComputer() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [entering, setEntering] = useState(false);
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
            <ComputerModel onEnter={() => setEntering(true)} />
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
      {/* transição "perde o sinal": glitch de TV em tela cheia → /system */}
      {entering && <RetroTvTransition onDone={() => router.push("/system")} />}
    </div>
  );
}

useGLTF.preload(MODEL);
