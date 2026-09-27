import { chromium } from "playwright";
const b = await chromium.launch();
for (const [w,h,n] of [[1440,1400,"desk"],[390,1500,"mob"]]) {
const p = await b.newPage({ viewport: { width: w, height: h } });
await p.goto("https://htsa-preview.pages.dev/");
const f = p.frameLocator(".hero-video iframe");
await p.waitForTimeout(5000);
const ok = await p.locator(".hero-video iframe").count();
let player = "n/a"; try { player = await f.locator("body").innerText({ timeout: 8000 }); } catch (e) { player = "ERR " + e.message.slice(0,80); }
console.log(n, "iframes", ok, "player text:", player.replace(/\s+/g," ").slice(0,160));
await p.screenshot({ path: `/workspace/htsa-deploy/video-${n}.png` });
await p.close();
}
await b.close();
