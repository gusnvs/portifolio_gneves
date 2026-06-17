import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:4319";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 820 } });
await page.goto(`${BASE}/system/desktop`, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);

const info = await page.evaluate(() => {
  const imgs = [...document.querySelectorAll("img")];
  const icons = imgs.filter((i) => (i.currentSrc || i.src).includes("boneco_neve") || (i.currentSrc||i.src).includes("_next/image"));
  return {
    iconCount: document.querySelectorAll(".desk-icon").length,
    broken: imgs.filter((i) => i.complete && i.naturalWidth === 0).length,
    trayText: document.querySelector(".taskbar")?.textContent?.replace(/\s+/g, " ").trim().slice(-60),
  };
});
console.log("DESKTOP:", JSON.stringify(info));
await page.screenshot({ path: "/tmp/v2-desktop.png" });

// open "Sobre o Sistema" (single click now)
await page.locator(".desk-icon", { hasText: "Sobre o Sistema" }).first().click();
await page.waitForTimeout(900);
await page.screenshot({ path: "/tmp/v2-sysinfo.png" });

// open "Jogos"
await page.locator(".desk-icon", { hasText: "Jogos" }).first().click();
await page.waitForTimeout(900);
await page.screenshot({ path: "/tmp/v2-games.png" });

// open "Meu Cloud" (should show login)
await page.locator(".desk-icon", { hasText: "Meu Cloud" }).first().click();
await page.waitForTimeout(700);
await page.screenshot({ path: "/tmp/v2-cloud.png" });

await browser.close();
console.log("shots: /tmp/v2-desktop.png /tmp/v2-sysinfo.png /tmp/v2-games.png /tmp/v2-cloud.png");
