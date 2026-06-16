"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, PointMaterial } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";

const ORANGE = "#ff6a1a";

function Particles({ count = 1400 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // points distributed in a hollow sphere shell with some scatter
      const r = 3.2 + Math.random() * 4.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.7;
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, [count]);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.03;
      ref.current.rotation.x += delta * 0.008;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <PointMaterial
        transparent
        color={ORANGE}
        size={0.022}
        sizeAttenuation
        depthWrite={false}
        opacity={0.85}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function Core() {
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.18;
      group.current.rotation.x += delta * 0.06;
    }
  });
  return (
    <Float speed={1.4} rotationIntensity={0.6} floatIntensity={0.9}>
      <group ref={group}>
        <mesh>
          <icosahedronGeometry args={[1.5, 0]} />
          <meshStandardMaterial
            color="#15131a"
            metalness={0.6}
            roughness={0.35}
            emissive={ORANGE}
            emissiveIntensity={0.06}
            flatShading
          />
        </mesh>
        <mesh scale={1.52}>
          <icosahedronGeometry args={[1.5, 0]} />
          <meshBasicMaterial color={ORANGE} wireframe transparent opacity={0.55} />
        </mesh>
      </group>
    </Float>
  );
}

function Rig() {
  useFrame((state) => {
    const x = state.pointer.x * 0.4;
    const y = state.pointer.y * 0.3;
    state.camera.position.x += (x - state.camera.position.x) * 0.04;
    state.camera.position.y += (y - state.camera.position.y) * 0.04;
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function HeroScene() {
  return (
    <Canvas
      dpr={[1, 1.8]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 6], fov: 42 }}
    >
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 5, 5]} intensity={40} color={ORANGE} />
      <pointLight position={[-6, -3, -4]} intensity={18} color="#4a6cff" />
      <Core />
      <Particles />
      <Rig />
      <EffectComposer>
        <Bloom mipmapBlur intensity={1.1} luminanceThreshold={0.2} radius={0.7} />
        <Vignette eskil={false} offset={0.25} darkness={0.85} />
      </EffectComposer>
    </Canvas>
  );
}
