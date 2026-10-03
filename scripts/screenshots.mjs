import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
const baseUrl = process.env.SCREENSHOT_BASE_URL ?? "http://localhost:3000";
const output = path.resolve("docs/screenshots");
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
  reducedMotion: "reduce",
});
const captured = [];
async function capture(name) {
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: path.join(output, name),
    animations: "disabled",
  });
  captured.push(name);
}
try {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await capture("01-landing.png");
  await page.goto(`${baseUrl}/brief?example=coffee`, {
    waitUntil: "networkidle",
  });
  await capture("02-brief-builder.png");
  const status = await (await page.request.get(`${baseUrl}/api/status`)).json();
  if (!status.qlooConfigured) {
    for (let i = 0; i < 3; i++)
      await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Start live research" }).click();
    await page.locator(".error-page").waitFor();
    await capture("qloo-connection-needed.png");
    await writeFile(
      path.join(output, "STATUS.md"),
      `# Screenshot status\n\nCaptured from ${baseUrl}.\n\nAvailable: ${captured.join(", ")}.\n\n03-agent-research.png through 08-strategy.png require successful real Qloo research. No test fixtures were substituted. Configure the event key, redeploy, and rerun this script against production.\n`,
    );
    console.log(
      "Landing and brief captured. Live result screenshots blocked by missing QLOO_API_KEY.",
    );
  } else {
    for (let i = 0; i < 3; i++)
      await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Start live research" }).click();
    await page.locator(".research-timeline").waitFor();
    await capture("03-agent-research.png");
    await page
      .getByRole("tab", { name: "Audience DNA" })
      .waitFor({ timeout: 180000 });
    for (const [tab, name] of [
      ["Audience DNA", "04-audience-dna.png"],
      ["Culture Graph", "05-culture-graph.png"],
      ["Opportunities", "06-opportunities.png"],
    ]) {
      await page.getByRole("tab", { name: tab }).click();
      if (tab === "Culture Graph")
        await page.locator(".react-flow__node").first().waitFor();
      await capture(name);
    }
    await page.getByRole("button", { name: "Why this?" }).first().click();
    await page.getByRole("dialog").waitFor();
    await capture("07-why-this.png");
    await page.keyboard.press("Escape");
    await page.getByRole("tab", { name: "Strategy", exact: true }).click();
    await capture("08-strategy.png");
    await writeFile(
      path.join(output, "STATUS.md"),
      `# Screenshot status\n\nAll requested screenshots captured from ${baseUrl} using real Qloo research.\n\n${captured.map((name) => `- ${name}`).join("\n")}\n`,
    );
    console.log("All eight real-data submission screenshots captured.");
  }
} finally {
  await browser.close();
}
