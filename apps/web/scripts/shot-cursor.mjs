import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3215";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 820 }, deviceScaleFactor: 2 });
await page.goto(`${BASE}/system/desktop`, { waitUntil: "networkidle" });
await page.waitForTimeout(1000);

// arrow over empty desktop
await page.mouse.move(700, 300);
await page.mouse.move(720, 320);
await page.waitForTimeout(350);
await page.screenshot({ path: "/tmp/cursor-arrow.png", clip: { x: 690, y: 290, width: 90, height: 90 } });

// hand over the "Sobre Mim" icon
const icon = page.locator(".desk-icon").first();
const box = await icon.boundingBox();
await page.mouse.move(box.x + box.width / 2, box.y + 18);
await page.mouse.move(box.x + box.width / 2 + 2, box.y + 20);
await page.waitForTimeout(350);
await page.screenshot({
  path: "/tmp/cursor-hand.png",
  clip: { x: box.x + box.width / 2 - 30, y: box.y, width: 90, height: 90 },
});

await browser.close();
console.log("ok");
