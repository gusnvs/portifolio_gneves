import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3214";

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`${BASE}/system`, { waitUntil: "domcontentloaded" });

// Wait for the boot to finish and the input to appear.
await page.waitForSelector('[aria-label="terminal input"]', { timeout: 20000 });
await page.waitForTimeout(2200); // let boot lines finish typing

const input = page.locator('[aria-label="terminal input"]');
await input.click();
await input.type("ajuda");

// Press Enter and immediately start sampling the terminal text length.
const result = await page.evaluate(async () => {
  const inputEl = document.querySelector('[aria-label="terminal input"]');
  const scroll = inputEl.closest(".overflow-y-auto");
  inputEl.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }),
  );
  const samples = [];
  const start = performance.now();
  return await new Promise((resolve) => {
    const id = setInterval(() => {
      samples.push({ t: Math.round(performance.now() - start), len: scroll.innerText.length });
      if (performance.now() - start > 1600) {
        clearInterval(id);
        resolve(samples);
      }
    }, 50);
  });
});

await browser.close();

const lens = result.map((s) => s.len);
const min = Math.min(...lens);
const max = Math.max(...lens);
const distinct = new Set(lens).size;
const monotonic = lens.every((v, i) => i === 0 || v >= lens[i - 1]);

console.log("samples (t ms : len):");
console.log(result.map((s) => `${s.t}:${s.len}`).join("  "));
console.log(`\nmin=${min} max=${max} growth=${max - min} distinctValues=${distinct} monotonic=${monotonic}`);

// Typing → many intermediate lengths between min and max, growing over time.
const isTyping = distinct >= 5 && max - min > 40 && monotonic;
console.log(isTyping ? "\n✅ TYPEWRITER IS ANIMATING (gradual reveal)" : "\n❌ NO GRADUAL REVEAL (appears instant)");
process.exit(isTyping ? 0 : 1);
