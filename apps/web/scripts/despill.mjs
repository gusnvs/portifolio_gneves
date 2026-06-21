import { chromium } from "playwright";
import fs from "fs";
const BASE = process.env.BASE ?? "http://localhost:4511";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 700, height: 400 }, deviceScaleFactor: 2 });
await p.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });

const out = await p.evaluate(async () => {
  const load = (s) => new Promise((r) => { const i = new Image(); i.crossOrigin="anonymous"; i.onload = () => r(i); i.src = s; });
  const despill = (img) => {
    const cv = document.createElement("canvas"); cv.width = img.naturalWidth; cv.height = img.naturalHeight;
    const x = cv.getContext("2d"); x.drawImage(img, 0, 0);
    const id = x.getImageData(0, 0, cv.width, cv.height); const d = id.data; let touched = 0;
    for (let i = 0; i < d.length; i += 4) {
      const a = d[i + 3]; if (a === 0) continue;
      const r = d[i], g = d[i + 1], bb = d[i + 2];
      const spill = (r + bb) / 2 - g; // magenta = high R&B, low G
      if (spill > 4) {
        d[i] = Math.max(0, r - spill); d[i + 2] = Math.max(0, bb - spill);
        if (spill > 45) d[i + 3] = Math.round(a * Math.max(0, 1 - (spill - 45) / 110));
        touched++;
      }
    }
    x.putImageData(id, 0, 0);
    return { cv, touched };
  };
  const previewRow = (ctx, img, cvClean, y, label) => {
    ctx.fillStyle = "#0c2a2a"; ctx.fillRect(0, y, 700, 95);
    const S = 95 / img.naturalHeight;
    ctx.drawImage(img, 10, y, img.naturalWidth * S, 95);       // before
    ctx.drawImage(cvClean, 200, y, img.naturalWidth * S, 95);  // after
    ctx.fillStyle = "#fff"; ctx.font = "12px sans-serif";
    ctx.fillText(label + "  [esq=antes  dir=depois]", 400, y + 50);
  };
  const run1 = await load("/boneco_neve/runner/snowman_run1.png");
  const run2 = await load("/boneco_neve/runner/_review/run2_t.png");
  const c1 = despill(run1), c2 = despill(run2);
  const prev = document.createElement("canvas"); prev.width = 700; prev.height = 200; const px = prev.getContext("2d");
  previewRow(px, run1, c1.cv, 0, "run1 t=" + c1.touched);
  previewRow(px, run2, c2.cv, 100, "run2 t=" + c2.touched);
  return {
    preview: prev.toDataURL("image/png").split(",")[1],
    run1: c1.cv.toDataURL("image/png").split(",")[1],
    run2: c2.cv.toDataURL("image/png").split(",")[1],
    touched: [c1.touched, c2.touched],
  };
});
fs.writeFileSync("public/boneco_neve/runner/_review/despill_preview.png", Buffer.from(out.preview, "base64"));
fs.writeFileSync("public/boneco_neve/runner/_review/run1_clean.png", Buffer.from(out.run1, "base64"));
fs.writeFileSync("public/boneco_neve/runner/_review/run2_clean.png", Buffer.from(out.run2, "base64"));
console.log("touched", out.touched);
await b.close();
