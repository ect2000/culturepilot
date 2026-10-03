// Private QA images of actual routes. These do not contain invented findings.
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
const output = path.resolve("test-results/visual-qa");
const baseUrl = process.env.TEST_BASE_URL ?? "http://localhost:3000";
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
try {
  for (const width of [1440, 1024, 390]) {
    const page = await browser.newPage({
      viewport: { width, height: 1000 },
      reducedMotion: "reduce",
    });
    for (const [name, route] of [
      ["landing", "/"],
      ["brief", "/brief?example=coffee"],
      ["history", "/analyses"],
      ["methodology", "/methodology"],
    ]) {
      await page.goto(`${baseUrl}${route}`, {
        waitUntil: "networkidle",
      });
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({
        path: path.join(output, `${name}-${width}.png`),
        animations: "disabled",
      });
      console.log(
        `${name} at ${width}px: ${await page.evaluate(() => document.documentElement.scrollWidth)}px document width`,
      );
    }
    await page.close();
  }
} finally {
  await browser.close();
}
