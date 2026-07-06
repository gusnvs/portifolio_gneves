import * as THREE from "three";

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Estado compartilhado entre cenas fora do React (atualizado por frame). */
export const sharedFx = {
  /** inclinação atual das divisas (rad) — escrita pelo DividersScene. */
  tilt: 0,
};

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export const easeInCubic = (t: number) => t * t * t;

/** PRNG determinístico — layouts estáveis entre renders. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Textura de nuvem/poça orgânica (blob de bordas suaves), desenhada uma vez. */
export function makeBlobTexture(seed: number, color: string): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const rand = mulberry32(seed);
  const cx = size / 2;
  const cy = size / 2;
  const base = size * 0.3;
  const lobes = 3 + Math.floor(rand() * 2);
  const phase = rand() * Math.PI * 2;
  const amp = 0.22 + rand() * 0.12;
  const points: [number, number][] = [];
  const steps = 48;
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const r =
      base *
      (1 +
        amp * Math.sin(lobes * a + phase) +
        0.1 * Math.sin((lobes + 2) * a - phase * 1.7));
    points.push([cx + r * Math.cos(a) * 1.35, cy + r * Math.sin(a) * 0.75]);
  }
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const [x0, y0] = points[i % steps];
    const [x1, y1] = points[(i + 1) % steps];
    if (i === 0) ctx.moveTo((x0 + x1) / 2, (y0 + y1) / 2);
    else ctx.quadraticCurveTo(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
  }
  ctx.closePath();
  ctx.fill();
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
