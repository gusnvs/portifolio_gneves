"use client";

import { useMemo, useRef, useLayoutEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { useMania } from "../store";
import { SECTION_START_VH } from "../config";
import { clamp01, lerp, easeOutCubic, easeInCubic } from "./utils";

/** Início da seção da bio, em vh rolados. */
const START = SECTION_START_VH.bio;

/**
 * Cena 3 — a cabeça gigante do boneco dormindo sobe do canto inferior
 * direito durante a seção "por trás da lenda" e respira suavemente.
 */
export function HeadScene() {
  const tex = useTexture("/snowmania/chars/head-sleep.webp");
  const { viewport } = useThree();
  const group = useRef<THREE.Group>(null);
  const head = useRef<THREE.Mesh>(null);

  useLayoutEffect(() => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
  }, [tex]);

  const aspect = useMemo(() => {
    const img = tex.image as HTMLImageElement | undefined;
    return img ? img.width / img.height : 0.77;
  }, [tex]);

  useFrame((state) => {
    const { scrollVh } = useMania.getState();
    const g = group.current;
    if (!g) return;
    const active = scrollVh > START - 50 && scrollVh < START + 220;
    g.visible = active;
    if (!active) return;

    const vw = viewport.width;
    const vh = viewport.height;
    const t = state.clock.elapsedTime;
    const h = vh * 0.82;

    const p = clamp01((scrollVh - (START - 15)) / 195);
    const enter = easeOutCubic(clamp01(p / 0.32));
    // ao final da seção, afunda de volta enquanto a noite chega
    const sink = easeInCubic(clamp01((scrollVh - (START + 165)) / 55));

    const mesh = head.current;
    if (mesh) {
      const yHidden = -vh / 2 - h * 0.55;
      const yShown = -vh / 2 + h * 0.16;
      mesh.position.x = vw > 980 ? vw * 0.3 : vw * 0.18;
      mesh.position.y =
        lerp(yHidden, yShown, enter) -
        sink * h * 0.8 +
        Math.sin(t * 0.9) * vh * 0.006;
      mesh.rotation.z = -0.06 + Math.sin(t * 0.7) * 0.012;
      const breathe = 1 + Math.sin(t * 0.9) * 0.006;
      mesh.scale.setScalar(breathe);
    }
  });

  return (
    <group ref={group} visible={false}>
      <mesh ref={head} position={[0, -10000, 70]} renderOrder={22}>
        <planeGeometry args={[viewport.height * 0.82 * aspect, viewport.height * 0.82]} />
        <meshBasicMaterial
          map={tex}
          transparent
          alphaTest={0.02}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
