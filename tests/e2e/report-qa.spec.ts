import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { reportFixture } from "../fixtures";
import { mkdir } from "node:fs/promises";

for (const width of [1440, 1024, 390]) {
  test(`report tabs and evidence drawer fit ${width}px`, async ({ page }) => {
    const fixture = await reportFixture();
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.route("**/api/research", (route) =>
      route.fulfill({
        contentType: "application/x-ndjson",
        body: JSON.stringify({ type: "done", state: fixture }) + "\n",
      }),
    );
    await page.goto("/brief?example=coffee");
    for (let i = 0; i < 3; i++)
      await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Start live research" }).click();
    await page.getByRole("tab", { name: "Overview" }).waitFor();
    await mkdir("test-results/report-qa", { recursive: true });
    for (const tab of [
      "Overview",
      "Audience DNA",
      "Culture Graph",
      "Opportunities",
      "Strategy",
      "Research Trace",
    ]) {
      await page.getByRole("tab", { name: tab }).click();
      await page.waitForFunction(() =>
        Array.from(document.querySelectorAll(".report-panel > div")).every(
          (el) => getComputedStyle(el).opacity === "1",
        ),
      );
      if (tab === "Culture Graph" || tab === "Overview")
        await page.locator(".react-flow__node").first().waitFor();
      if (tab === "Overview")
        await page.locator(".recharts-surface").first().waitFor();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth + 1,
        ),
        tab,
      ).toBe(true);
      await page.screenshot({
        path: `test-results/report-qa/${tab.replaceAll(" ", "-").toLowerCase()}-${width}.png`,
        animations: "disabled",
      });
      if (width === 1440) {
        const scan = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze();
        expect(
          scan.violations.map((v) => ({
            id: v.id,
            targets: v.nodes.map((n) => n.target),
          })),
          tab,
        ).toEqual([]);
      }
    }
    await page.getByRole("tab", { name: "Opportunities" }).click();
    await page.getByRole("button", { name: "Why this?" }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    expect(
      await page
        .getByRole("dialog")
        .evaluate(
          (el) => el.getBoundingClientRect().right <= window.innerWidth,
        ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/report-qa/evidence-${width}.png`,
      animations: "disabled",
    });
    if (width === 1440) {
      const scan = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(
        scan.violations.map((v) => ({
          id: v.id,
          targets: v.nodes.map((n) => n.target),
        })),
      ).toEqual([]);
    }
  });
}
