import * as THREE from "three";

/**
 * "Vídeo" da tela do computador retrô desenhado num canvas 2D e enviado como
 * textura — mesma ideia do shader.se (flipbook de frames), mas aqui montamos
 * o frame na mão pra ter CRT completo: scanlines, vinheta, flicker, aberração
 * cromática, botão ENTER no hover e glitch na transição. Depois trocamos a
 * playlist de imagens por vídeos/sprite-sheets reais sem mexer no resto.
 */

export interface ScreenState {
  hover: number; // 0..1 (aparição do botão ENTER)
  enter: number; // 0..1 (transição "entrando na tela")
  glitch: number; // 0..1 intensidade de glitch
}

export class ScreenTexture {
  readonly texture: THREE.CanvasTexture;
  /** cor média do conteúdo atual — usada pra tingir a luz que reflete no gabinete */
  readonly avgColor = new THREE.Color("#ffb46a");

  private cv: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private w: number;
  private h: number;
  private images: HTMLImageElement[] = [];
  private idx = 0;
  private nextAt = 0;
  private fade = 1; // 0..1 crossfade entre imagem anterior e atual
  private prevIdx = 0;
  private sample: HTMLCanvasElement;
  private sampleCtx: CanvasRenderingContext2D;

  constructor(sources: string[], w = 512, h = 384) {
    this.w = w;
    this.h = h;
    this.cv = document.createElement("canvas");
    this.cv.width = w;
    this.cv.height = h;
    this.ctx = this.cv.getContext("2d")!;
    this.sample = document.createElement("canvas");
    this.sample.width = 1;
    this.sample.height = 1;
    this.sampleCtx = this.sample.getContext("2d", { willReadFrequently: true })!;

    this.texture = new THREE.CanvasTexture(this.cv);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.generateMipmaps = false;

    for (const src of sources) {
      const img = new Image();
      img.src = src;
      this.images.push(img);
    }
  }

  /** troca a fonte da tela (ex.: quando os vídeos reais chegarem). */
  private computeAvg(img: HTMLImageElement) {
    try {
      this.sampleCtx.drawImage(img, 0, 0, 1, 1);
      const [r, g, b] = this.sampleCtx.getImageData(0, 0, 1, 1).data;
      // puxa pra um tom quente/vivo pra refletir bonito
      this.avgColor.setRGB(
        Math.min(1, (r / 255) * 1.15 + 0.15),
        Math.min(1, (g / 255) * 1.1 + 0.1),
        Math.min(1, (b / 255) * 1.05 + 0.08),
      );
    } catch {
      /* imagem ainda não decodificada */
    }
  }

  private drawImageContain(img: HTMLImageElement, zoom: number, alpha: number) {
    if (!img.complete || img.naturalWidth === 0) return;
    const { ctx, w, h } = this;
    const ir = img.naturalWidth / img.naturalHeight;
    const sr = w / h;
    let dw = w * zoom;
    let dh = h * zoom;
    if (ir > sr) dh = dw / ir;
    else dw = dh * ir;
    const dx = (w - dw) / 2;
    const dy = (h - dh) / 2;
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.globalAlpha = 1;
  }

  update(now: number, dt: number, state: ScreenState) {
    const { ctx, w, h } = this;

    // avança a "playlist" (troca de imagem = mudança de luz refletida)
    if (this.nextAt === 0) this.nextAt = now + 2.4;
    if (now >= this.nextAt && state.enter < 0.01) {
      this.prevIdx = this.idx;
      this.idx = (this.idx + 1) % Math.max(1, this.images.length);
      this.fade = 0;
      this.nextAt = now + 2.4;
      this.computeAvg(this.images[this.idx]);
    }
    this.fade = Math.min(1, this.fade + dt * 2.2);

    // fora do vidro fica TRANSPARENTE — o plano pode ser grande o bastante
    // pra cobrir a tela toda enquanto os cantos arredondados "entram" na
    // curvatura do CRT (o baked por baixo some)
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    roundRect(ctx, 0, 0, w, h, Math.min(w, h) * 0.11);
    ctx.clip();

    // fundo (fósforo âmbar bem escuro)
    ctx.fillStyle = "#0a0805";
    ctx.fillRect(0, 0, w, h);

    // brilho suave de fundo (o tubo aceso)
    const bg = ctx.createRadialGradient(w / 2, h * 0.42, 0, w / 2, h * 0.5, h * 0.8);
    bg.addColorStop(0, "rgba(60,42,22,0.9)");
    bg.addColorStop(1, "rgba(8,6,4,0.9)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // conteúdo (crossfade + leve "respiração" de zoom, como fita rodando)
    const breath = 1.02 + Math.sin(now * 0.8) * 0.015;
    if (this.images[this.prevIdx] && this.fade < 1) {
      this.drawImageContain(this.images[this.prevIdx], breath, 1 - this.fade);
    }
    if (this.images[this.idx]) {
      const zoom = breath * (1 + state.enter * 0.9); // "entra" na tela ao clicar
      this.drawImageContain(this.images[this.idx], zoom, this.fade);
    }

    // aberração cromática sutil (desloca cópia vermelha/azul)
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.12 + state.glitch * 0.25;
    if (this.images[this.idx]?.complete) {
      const off = 2 + state.glitch * 8;
      ctx.drawImage(this.cv, -off, 0);
      ctx.drawImage(this.cv, off, 0);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    // glitch: fatias horizontais deslocadas + barras coloridas
    if (state.glitch > 0.001) {
      const slices = 8;
      for (let i = 0; i < slices; i++) {
        if (Math.random() > state.glitch) continue;
        const sy = Math.random() * h;
        const sh = 6 + Math.random() * (h / 6);
        const dx = (Math.random() - 0.5) * 60 * state.glitch;
        ctx.drawImage(this.cv, 0, sy, w, sh, dx, sy, w, sh);
        if (Math.random() < 0.5) {
          ctx.fillStyle = Math.random() < 0.5 ? "rgba(255,106,26,0.35)" : "rgba(90,200,255,0.3)";
          ctx.fillRect(0, sy, w, 2 + Math.random() * 4);
        }
      }
    }

    // scanlines
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);

    // flicker global
    const flick = 0.92 + Math.random() * 0.08;
    ctx.fillStyle = `rgba(0,0,0,${(1 - flick) * 0.6})`;
    ctx.fillRect(0, 0, w, h);

    // botão ENTER no hover (retângulo preto + borda/texto laranja)
    if (state.hover > 0.01) {
      const a = state.hover;
      ctx.fillStyle = `rgba(0,0,0,${0.45 * a})`;
      ctx.fillRect(0, 0, w, h);
      const bw = w * 0.42;
      const bh = h * 0.2;
      const bx = (w - bw) / 2;
      const by = (h - bh) / 2;
      ctx.globalAlpha = a;
      ctx.fillStyle = "#0a0805";
      roundRect(ctx, bx, by, bw, bh, 10);
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#ff6a1a";
      ctx.stroke();
      ctx.fillStyle = "#ff8a3d";
      ctx.font = `700 ${Math.round(bh * 0.5)}px "JetBrains Mono", ui-monospace, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("ENTER", w / 2, h / 2 + 2);
      ctx.globalAlpha = 1;
    }

    // clarão branco no fim da transição (entrou na tela)
    if (state.enter > 0.55) {
      const f = (state.enter - 0.55) / 0.45;
      ctx.fillStyle = `rgba(255,245,230,${f})`;
      ctx.fillRect(0, 0, w, h);
    }

    // vinheta CRT
    const vig = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.75);
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);

    ctx.restore();
    this.texture.needsUpdate = true;
  }

  dispose() {
    this.texture.dispose();
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
