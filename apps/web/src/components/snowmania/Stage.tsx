"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { WallScene } from "./scenes/WallScene";
import { DividersScene } from "./scenes/DividersScene";
import { CodeScene } from "./scenes/CodeScene";
import { HeadScene } from "./scenes/HeadScene";
import { NightScene } from "./scenes/NightScene";

/**
 * Canvas WebGL fixo cobrindo a viewport, ACIMA do texto DOM (z-20 > z-10):
 * os personagens passam na frente dos títulos, e onde o canvas é transparente
 * o DOM aparece. pointer-events: none deixa cliques atravessarem.
 */
export function Stage() {
  return (
    <div className="pointer-events-none fixed inset-0 z-20" aria-hidden>
      <Canvas
        orthographic
        flat
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, 100], zoom: 1, near: 1, far: 1000 }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
          localClippingEnabled: true,
        }}
      >
        <Suspense fallback={null}>
          <WallScene />
          <DividersScene />
          <CodeScene />
          <HeadScene />
          <NightScene />
        </Suspense>
      </Canvas>
    </div>
  );
}
