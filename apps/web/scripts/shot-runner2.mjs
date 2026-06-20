import { chromium } from "playwright";
const BASE = process.env.BASE ?? "http://localhost:4501";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1366, height: 820 } });
await p.goto(`${BASE}/system/desktop`, { waitUntil: "networkidle" });
await p.waitForTimeout(1100);
await p.locator(".desk-icon", { hasText: "Jogos" }).first().click();
await p.waitForTimeout(700);
await p.getByText("Boneco Runner").first().click();
await p.waitForTimeout(700);
try { await p.getByRole("button", { name: "Começar" }).waitFor({ timeout: 9000 }); } catch {}
const sb = p.getByRole("button", { name: "Começar" });
if (await sb.count()) await sb.first().click();
// let it run and crash (don't duck -> hits a cloud eventually)
await p.waitForTimeout(6000);
await p.screenshot({ path: "/tmp/run2-over.png" });
b.close();
console.log("done");
