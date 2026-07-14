import * as THREE from "three";

/**
 * "Vídeo" da tela do computador retrô desenhado num canvas 2D e enviado como
 * textura — mesma ideia do shader.se (flipbook de frames), mas aqui montamos
 * o frame na mão pra ter CRT completo: scanlines, vinheta, flicker, aberração
 * cromática, botão ENTER no hover e, na transição, o pacote de TV ANTIGA
 * (chuvisco, perda de sincronismo, barra de zumbido e o colapso em linha
 * branca de TV desligando). Depois trocamos a playlist de imagens por
 * vídeos/sprite-sheets reais sem mexer no resto.
 */

export interface ScreenState {
  hover: number; // 0..1 (aparição do botão ENTER)
  enter: number; // 0..1 (transição "entrando na tela")
  /** 0..1 — intensidade da distorção de TV antiga (chuvisco, sincronismo) */
  glitch: number;
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
  // vídeos da telinha — assumem o lugar das imagens quando prontos
  private videoSources: string[] = [];
  private videos: HTMLVideoElement[] = [];
  private vIdx = 0;
  private vPrevIdx = -1;
  private vFade = 1;
  private vNextAt = 0;
  private vStarted = false;
  private avgAt = 0;
  private warmed = false;
  /** segundos que cada vídeo fica em cena antes do crossfade pro próximo */
  private static SLOT = 7;
  private sample: HTMLCanvasElement;
  private sampleCtx: CanvasRenderingContext2D;
  // buffer p/ distorções de TV (jitter/rolo lêem o frame INTEIRO estável —
  // desenhar o canvas sobre si mesmo em fatias corromperia a fonte)
  private buf: HTMLCanvasElement;
  private bufCtx: CanvasRenderingContext2D;

  constructor(sources: string[], videoSources: string[] = [], w = 512, h = 384) {
    this.videoSources = videoSources;
    this.w = w;
    this.h = h;
    this.cv = document.createElement("canvas");
    this.cv.width = w;
    this.cv.height = h;
    this.ctx = this.cv.getContext("2d")!;
    this.buf = document.createElement("canvas");
    this.buf.width = w;
    this.buf.height = h;
    this.bufCtx = this.buf.getContext("2d")!;
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

  /**
   * Começa a baixar/decodificar os vídeos — chamado quando o usuário se
   * APROXIMA da seção (não no load da página: são MBs que competiriam com
   * o GLB e as texturas do resto da home).
   */
  warm() {
    if (this.warmed || this.videoSources.length === 0) return;
    this.warmed = true;
    for (const src of this.videoSources) {
      const v = document.createElement("video");
      v.muted = true;
      v.defaultMuted = true;
      v.loop = true;
      v.playsInline = true;
      v.preload = "auto";
      v.src = src;
      v.load();
      this.videos.push(v);
    }
    // o primeiro já começa a rodar (mudo) pra ter frame pronto na chegada
    this.videos[0]?.play().catch(() => {});
  }

  /** pausa/retoma o vídeo ativo — nada decodifica fora da seção */
  setActive(on: boolean) {
    if (!this.warmed) return;
    if (on) {
      this.videos[this.vIdx]?.play().catch(() => {});
    } else {
      for (const v of this.videos) v.pause();
    }
  }

  private videoReady(v?: HTMLVideoElement): v is HTMLVideoElement {
    return !!v && v.readyState >= 2 && v.videoWidth > 0;
  }

  private computeAvg(src: HTMLImageElement | HTMLVideoElement) {
    try {
      this.sampleCtx.drawImage(src, 0, 0, 1, 1);
      const [r, g, b] = this.sampleCtx.getImageData(0, 0, 1, 1).data;
      // puxa pra um tom quente/vivo pra refletir bonito
      this.avgColor.setRGB(
        Math.min(1, (r / 255) * 1.15 + 0.15),
        Math.min(1, (g / 255) * 1.1 + 0.1),
        Math.min(1, (b / 255) * 1.05 + 0.08),
      );
    } catch {
      /* fonte ainda não decodificada */
    }
  }

  private drawContain(
    src: HTMLImageElement | HTMLVideoElement,
    zoom: number,
    alpha: number,
  ) {
    const isVideo = src instanceof HTMLVideoElement;
    const sw = isVideo ? src.videoWidth : src.naturalWidth;
    const sh = isVideo ? src.videoHeight : src.naturalHeight;
    if (sw === 0 || sh === 0) return;
    if (!isVideo && !(src as HTMLImageElement).complete) return;
    const { ctx, w, h } = this;
    const ir = sw / sh;
    const sr = w / h;
    let dw = w * zoom;
    let dh = h * zoom;
    if (ir > sr) dh = dw / ir;
    else dw = dh * ir;
    const dx = (w - dw) / 2;
    const dy = (h - dh) / 2;
    ctx.globalAlpha = alpha;
    ctx.drawImage(src, dx, dy, dw, dh);
    ctx.globalAlpha = 1;
  }

  update(now: number, dt: number, state: ScreenState) {
    const { ctx, w, h } = this;

    const curVideo = this.videos[this.vIdx];
    const useVideo = this.videoReady(curVideo);

    if (useVideo) {
      // primeira vez com vídeo pronto: fade suave saindo do fallback
      if (!this.vStarted) {
        this.vStarted = true;
        this.vFade = 0;
      }
      if (curVideo.paused && state.enter < 0.9) curVideo.play().catch(() => {});
      // rotação da playlist de vídeos (só troca se o próximo já decodificou)
      if (this.vNextAt === 0) this.vNextAt = now + ScreenTexture.SLOT;
      if (now >= this.vNextAt && state.enter < 0.01 && this.videos.length > 1) {
        const next = (this.vIdx + 1) % this.videos.length;
        if (this.videoReady(this.videos[next])) {
          this.vPrevIdx = this.vIdx;
          this.vIdx = next;
          this.vFade = 0;
          this.videos[next].play().catch(() => {});
        }
        this.vNextAt = now + ScreenTexture.SLOT;
      }
      this.vFade = Math.min(1, this.vFade + dt * 1.6);
      if (this.vFade >= 1 && this.vPrevIdx >= 0) {
        // o anterior só pausa depois do crossfade (transição sempre viva)
        this.videos[this.vPrevIdx]?.pause();
        this.vPrevIdx = -1;
      }
      // cor média re-amostrada ao longo do vídeo (a luz acompanha a cena)
      if (now >= this.avgAt) {
        this.avgAt = now + 0.5;
        this.computeAvg(curVideo);
      }
    } else {
      // fallback: playlist de imagens enquanto os vídeos baixam
      if (this.nextAt === 0) this.nextAt = now + 2.4;
      if (now >= this.nextAt && state.enter < 0.01) {
        this.prevIdx = this.idx;
        this.idx = (this.idx + 1) % Math.max(1, this.images.length);
        this.fade = 0;
        this.nextAt = now + 2.4;
        this.computeAvg(this.images[this.idx]);
      }
      this.fade = Math.min(1, this.fade + dt * 2.2);
    }

    // fora do vidro fica TRANSPARENTE — o plano pode ser grande o bastante
    // pra cobrir a tela toda enquanto os cantos arredondados "entram" na
    // curvatura do CRT (o baked por baixo some)
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    roundRect(ctx, 0, 0, w, h, Math.min(w, h) * 0.04);
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
    const zoom = breath * (1 + state.enter * 0.9); // "entra" na tela ao clicar
    if (useVideo) {
      const prev = this.videos[this.vPrevIdx];
      if (this.vFade < 1 && this.videoReady(prev)) {
        this.drawContain(prev, breath, 1 - this.vFade);
      } else if (this.vFade < 1 && this.images[this.idx]) {
        // primeira entrada de vídeo: o fallback de imagem sai em fade
        this.drawContain(this.images[this.idx], breath, 1 - this.vFade);
      }
      this.drawContain(curVideo, zoom, this.vFade);
    } else {
      if (this.images[this.prevIdx] && this.fade < 1) {
        this.drawContain(this.images[this.prevIdx], breath, 1 - this.fade);
      }
      if (this.images[this.idx]) {
        this.drawContain(this.images[this.idx], zoom, this.fade);
      }
    }

    // aberração cromática sutil (desloca cópia vermelha/azul)
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.08 + state.glitch * 0.06;
    if (this.images[this.idx]?.complete) {
      const off = 1.5 + state.glitch * 2;
      ctx.drawImage(this.cv, -off, 0);
      ctx.drawImage(this.cv, off, 0);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    // --- TV ANTIGA: perda de sincronismo + chuvisco + barra de zumbido ---
    const tv = state.glitch;
    if (tv > 0.001) {
      // congela o frame atual no buffer e redesenha com as distorções
      this.bufCtx.clearRect(0, 0, w, h);
      this.bufCtx.drawImage(this.cv, 0, 0);
      // horizontal hold: a imagem inteira treme de leve pros lados
      const hx = Math.sin(now * 31) * 2.5 * tv + (Math.random() - 0.5) * 2 * tv;
      // vertical roll: com o sinal fraco, a imagem "rola" pra cima (com wrap)
      const roll = tv > 0.4 ? (now * (40 + tv * 220)) % h : 0;
      ctx.drawImage(this.buf, hx, -roll);
      if (roll > 0) {
        ctx.drawImage(this.buf, hx, h - roll);
        // faixa de blanking entre as voltas do rolo (a "barra preta" da TV)
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(0, h - roll - 3, w, 6);
      }
      // chuvisco (static): pontinhos aleatórios preto/branco
      const grains = Math.floor(240 * tv);
      for (let i = 0; i < grains; i++) {
        const gx = Math.random() * w;
        const gy = Math.random() * h;
        const lum = Math.random() > 0.5 ? 255 : 30;
        ctx.fillStyle = `rgba(${lum},${lum},${lum},${0.1 + Math.random() * 0.22 * tv})`;
        ctx.fillRect(gx, gy, 1.5 + Math.random() * 2, 1.5 + Math.random() * 2);
      }
      // barra de zumbido (hum bar): banda clara descendo devagar
      const barY = ((now * 85) % (h * 1.4)) - h * 0.2;
      const bar = ctx.createLinearGradient(0, barY, 0, barY + h * 0.22);
      bar.addColorStop(0, "rgba(255,240,220,0)");
      bar.addColorStop(0.5, `rgba(255,240,220,${0.08 + tv * 0.1})`);
      bar.addColorStop(1, "rgba(255,240,220,0)");
      ctx.fillStyle = bar;
      ctx.fillRect(0, barY, w, h * 0.22);
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

    // ao mergulhar fundo, a TV "DESLIGA": a imagem colapsa verticalmente
    // numa linha branca brilhante que se apaga (o /system religa depois)
    if (state.enter > 0.45) {
      const c = Math.min(1, (state.enter - 0.45) / 0.4);
      const ease = c * c * (3 - 2 * c);
      // congela o quadro e o espreme em direção à linha central
      this.bufCtx.clearRect(0, 0, w, h);
      this.bufCtx.drawImage(this.cv, 0, 0);
      ctx.fillStyle = "#020104";
      ctx.fillRect(0, 0, w, h);
      const sq = Math.max(2, h * (1 - ease));
      ctx.drawImage(this.buf, 0, 0, w, h, 0, (h - sq) / 2, w, sq);
      // a linha central acende conforme colapsa e some no fim
      const lineGlow = Math.sin(Math.min(1, c * 1.15) * Math.PI); // 0→1→0
      if (lineGlow > 0.01) {
        ctx.globalCompositeOperation = "lighter";
        const lh = 2 + 10 * lineGlow;
        const lg = ctx.createLinearGradient(0, h / 2 - lh, 0, h / 2 + lh);
        lg.addColorStop(0, "rgba(255,235,210,0)");
        lg.addColorStop(0.5, `rgba(255,250,240,${0.9 * lineGlow})`);
        lg.addColorStop(1, "rgba(255,235,210,0)");
        ctx.fillStyle = lg;
        ctx.fillRect(0, h / 2 - lh, w, lh * 2);
        ctx.globalCompositeOperation = "source-over";
      }
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
    for (const v of this.videos) {
      v.pause();
      v.removeAttribute("src");
      v.load();
    }
    this.videos = [];
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
