import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3215";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 820 }, deviceScaleFactor: 1 });

await page.goto(`${BASE}/system/desktop`, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);

// check wallpaper + icons loaded
const info = await page.evaluate(() => {
  const imgs = [...document.querySelectorAll("img")];
  const wall = imgs.find((i) => i.src.includes("wallpaper_desktop") || i.currentSrc.includes("wallpaper"));
  const iconImgs = imgs.filter((i) => i.src.includes("boneco_neve") || i.currentSrc.includes("boneco_neve"));
  const broken = imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.currentSrc || i.src);
  return {
    totalImgs: imgs.length,
    wallpaperLoaded: wall ? wall.naturalWidth > 0 : false,
    iconCount: iconImgs.length,
    iconsLoaded: iconImgs.filter((i) => i.naturalWidth > 0).length,
    broken,
    hasCursor: !!document.querySelector('[style*="will-change"]'),
    deskcursor: document.body.dataset.deskcursor || "off",
  };
});
console.log("DESKTOP:", JSON.stringify(info, null, 2));

// move mouse over the Stack icon to show the pointer cursor, then screenshot
const stackIcon = page.locator(".desk-icon", { hasText: "Stack" }).first();
await stackIcon.hover();
await page.waitForTimeout(400);
await page.screenshot({ path: "/tmp/desktop.png" });

// open Stack app (double-click) to see the tech logos
await stackIcon.dblclick();
await page.waitForTimeout(1500);
await page.screenshot({ path: "/tmp/desktop-stack.png" });

await browser.close();
console.log("screenshots: /tmp/desktop.png , /tmp/desktop-stack.png");
