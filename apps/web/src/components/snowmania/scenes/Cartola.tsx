"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useMania } from "../store";
import { SECTION_START_VH } from "../config";
import { clamp01 } from "./utils";

const START = SECTION_START_VH.fall;

/**
 * A cartola 3D — peça central da seção "sim, a lenda". Fica FIXA no lugar
 * (a divisa revela/cobre via clipping), gira sozinha devagar, o scroll
 * acrescenta rotação e um leve passeio de posição, e o usuário pode
 * agarrar e girar à vontade (turntable com inércia).
 */
export function Cartola({ clip }: { clip: THREE.Plane[] }) {
  const { viewport } = useThree();
  const gltf = useGLTF("/snowmania/models/cartola.glb");
  const pos = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);

  const sim = useRef({
    rotY: 0,
    rotX: 0.14,
    vY: 0,
    vX: 0,
    dragging: false,
    pointerId: -1,
    lastX: 0,
    lastY: 0,
    // posição em tela + raio pro hit-test (escritos por frame)
    sx: 0,
    sy: 0,
    r: 0,
    scale: 1,
    scaleV: 0,
    hover: false,
  });

  // normaliza o modelo: centro na origem, tamanho 1
  const { modelScale, center } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const size = box.getSize(new THREE.Vector3());
    const c = box.getCenter(new THREE.Vector3());
    return { modelScale: 1 / Math.max(size.x, size.y, size.z), center: c };
  }, [gltf]);

  useEffect(() => {
    gltf.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.renderOrder = 14;
      const tris = (mesh.geometry.index?.count ?? mesh.geometry.attributes.position.count) / 3;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of mats) {
        const std = m as THREE.MeshStandardMaterial;
        // eslint-disable-next-line no-console
        console.log("[cartola]", mesh.name, "tris:", tris, "transparent:", std.transparent, "opacity:", std.opacity, "map:", !!std.map, "alphaMap:", !!std.alphaMap);
        m.clippingPlanes = clip;
        m.side = THREE.DoubleSide;
        m.opacity = 1;
        m.alphaTest = 0;
        std.alphaMap = null;
        // entra no passe de transparência (ordem por renderOrder respeita
        // nuvens/planos), mantendo depth próprio pra auto-oclusão correta
        m.transparent = true;
        m.depthWrite = true;
        m.depthTest = true;
        m.needsUpdate = true;
      }
    });
  }, [gltf, clip]);

  // agarrar e girar — listeners na window (canvas é pointer-events: none)
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".snowmania");
    const s = sim.current;

    const hit = (e: PointerEvent) =>
      Math.hypot(e.clientX - s.sx, e.clientY - s.sy) < s.r;

    const inRange = () => {
      const { scrollVh } = useMania.getState();
      return scrollVh > START - 90 && scrollVh < START + 235;
    };

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      if (!inRange() || !hit(e)) return;
      e.preventDefault();
      s.dragging = true;
      s.pointerId = e.pointerId;
      s.lastX = e.clientX;
      s.lastY = e.clientY;
      s.vY = 0;
      s.vX = 0;
      if (root) root.style.cursor = "grabbing";
    };

    const onMove = (e: PointerEvent) => {
      if (s.dragging && e.pointerId === s.pointerId) {
        const dx = e.clientX - s.lastX;
        const dy = e.clientY - s.lastY;
        s.lastX = e.clientX;
        s.lastY = e.clientY;
        s.rotY += dx * 0.0085;
        s.rotX = THREE.MathUtils.clamp(s.rotX + dy * 0.005, -0.6, 0.85);
        // inércia pro arremesso do giro
        s.vY = dx * 0.55;
        s.vX = dy * 0.3;
        return;
      }
      if (e.pointerType !== "mouse") return;
      s.hover = inRange() && hit(e);
      if (root && !s.dragging) {
        if (s.hover && root.style.cursor === "") root.style.cursor = "grab";
        else if (!s.hover && root.style.cursor === "grab") root.style.cursor = "";
      }
    };

    const onUp = (e: PointerEvent) => {
      if (!s.dragging || e.pointerId !== s.pointerId) return;
      s.dragging = false;
      if (root) root.style.cursor = s.hover ? "grab" : "";
    };

    window.addEventListener("pointerdown", onDown, { passive: false });
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  useFrame((state, dt) => {
    const { scrollVh } = useMania.getState();
    const p = pos.current;
    const sp = spin.current;
    if (!p || !sp) return;

    const vw = viewport.width;
    const vh = viewport.height;
    const t = state.clock.elapsedTime;
    const s = sim.current;
    const stepDt = Math.min(dt, 0.033);

    const isNarrow = vw <= 980;
    const targetH = isNarrow ? Math.min(vh * 0.34, vw * 0.6) : vh * 0.42;

    // passeio sutil de posição conforme o scroll avança na seção
    const sectionP = clamp01((scrollVh - (START - 50)) / 260);
    const baseX = (isNarrow ? 0 : vw * 0.26) - Math.sin(sectionP * Math.PI) * vw * 0.05;
    const baseY =
      (isNarrow ? -vh * 0.26 : -vh * 0.06) +
      sectionP * vh * 0.1 +
      Math.sin(t * 1.05) * vh * 0.012;

    // z recuado: com ~targetH de profundidade, em z alto a cartola cruzaria
    // o near plane da câmera (z=99) e seria fatiada em "fitas"
    p.position.set(baseX, baseY, -300);
    p.scale.setScalar(targetH);

    // giro: lento sozinho + acoplado ao scroll + inércia do arrasto
    if (!s.dragging) {
      s.rotY += s.vY * stepDt + 0.22 * stepDt;
      s.rotX += s.vX * stepDt;
      s.vY *= Math.exp(-2.1 * stepDt);
      s.vX *= Math.exp(-2.6 * stepDt);
      // pitch volta suave pro descanso
      s.rotX += (0.14 - s.rotX) * Math.min(stepDt * 0.9, 1);
      s.rotX = THREE.MathUtils.clamp(s.rotX, -0.6, 0.85);
    }
    sp.rotation.y = s.rotY + scrollVh * 0.018;
    sp.rotation.x = s.rotX;

    // respiro no hover (ímã sutil)
    const scaleTarget = s.hover || s.dragging ? 1.07 : 1;
    s.scaleV += (140 * (scaleTarget - s.scale) - 16 * s.scaleV) * stepDt;
    s.scale += s.scaleV * stepDt;
    sp.scale.setScalar(s.scale);

    // hit-test: posição em tela + raio
    s.sx = vw / 2 + baseX;
    s.sy = vh / 2 - baseY;
    s.r = targetH * 0.62;
  });

  return (
    <group ref={pos}>
      <group ref={spin}>
        <primitive
          object={gltf.scene}
          position={[
            -center.x * modelScale,
            -center.y * modelScale,
            -center.z * modelScale,
          ]}
          scale={modelScale}
        />
      </group>
    </group>
  );
}

useGLTF.preload("/snowmania/models/cartola.glb");
