import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:4500";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 820 } });
await page.goto(`${BASE}/system/desktop`, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);

// open Jogos (single click)
await page.locator(".desk-icon", { hasText: "Jogos" }).first().click();
await page.waitForTimeout(900);
await page.screenshot({ path: "/tmp/run-menu.png" });

// open Boneco Runner
await page.getByText("Boneco Runner").first().click();
await page.waitForTimeout(800);

// wait for assets -> "Começar" button, then start
try {
  await page.getByRole("button", { name: "Começar" }).waitFor({ timeout: 9000 });
} catch {}
await page.screenshot({ path: "/tmp/run-start.png" });
const startBtn = page.getByRole("button", { name: "Começar" });
if (await startBtn.count()) await startBtn.first().click();

await page.waitForTimeout(1600);
await page.keyboard.press("Space");
await page.waitForTimeout(350);
await page.keyboard.press("Space");
await page.waitForTimeout(700);
await page.screenshot({ path: "/tmp/run-play.png" });
await page.waitForTimeout(900);
await page.screenshot({ path: "/tmp/run-play2.png" });

await browser.close();
console.log("done");
