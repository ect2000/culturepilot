import { test, expect } from "@playwright/test";
import { reportFixture } from "../fixtures";
import { demoBrief } from "../../src/lib/types";
import AxeBuilder from "@axe-core/playwright";
test("landing and brief builder run into an honest missing-key state", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "actually cares about",
  );
  await page.getByRole("link", { name: "Explore live demo" }).click();
  await expect(page.getByLabel("What are you building?")).toHaveValue(
    demoBrief.idea,
  );
  for (let i = 0; i < 3; i++)
    await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Start live research" }).click();
  await expect(
    page.getByRole("heading", {
      name: "The strategy starts with real evidence.",
    }),
  ).toBeVisible();
  await expect(
    page.getByText("No invented signals. No fabricated strategy."),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Recent analyses", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Your cultural discoveries start here.",
    }),
  ).toBeVisible();
});
test("browser report interactions, evidence, graph, exports, and saved history", async ({
  page,
}) => {
  // Synthetic research is intercepted only in this test process, never as a production route.
  const fixture = await reportFixture();
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
  await expect(page.getByRole("tab", { name: "Overview" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.getByRole("tab", { name: "Audience DNA" }).click();
  await expect(page.locator(".entity-card")).toHaveCount(40);
  await page.locator(".entity-card").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("tab", { name: "Culture Graph" }).click();
  await expect(page.locator(".react-flow__node").first()).toBeVisible();
  await page.getByLabel("Filter graph category").selectOption("place");
  await expect(
    page.locator(".signal-node").filter({ hasText: "Test brand" }),
  ).toHaveCount(0);
  await page.getByRole("tab", { name: "Opportunities" }).click();
  await page.getByRole("button", { name: "Why this?" }).first().click();
  await expect(page.getByRole("dialog")).toContainText("Score breakdown");
  await expect(page.getByRole("dialog")).toContainText("Qloo affinity");
  await page.keyboard.press("Escape");
  await page.getByRole("tab", { name: "Strategy", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Launch actions" }).first(),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Research Trace" }).click();
  await page.locator(".trace-list details").first().locator("summary").click();
  await expect(
    page
      .locator(".trace-list details")
      .first()
      .getByText("Tool input", { exact: true }),
  ).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "JSON", exact: true }).click();
  expect((await download).suggestedFilename()).toMatch(/culturepilot-.+\.json/);
  await page
    .getByRole("link", { name: "Recent analyses", exact: true })
    .click();
  await expect(page.locator(".history-list a")).toHaveCount(1);
  await page.locator(".history-list a").click();
  await expect(page.getByRole("tab", { name: "Overview" })).toBeVisible();
});
test("invalid brief and empty session guide the user", async ({ page }) => {
  await page.goto("/brief");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.locator(".field-error")).toHaveCount(2);
  await page.goto("/analysis/missing-local-report");
  await expect(
    page.getByRole("heading", { name: "This analysis lives in your browser." }),
  ).toBeVisible();
});
for (const width of [1440, 1024, 390]) {
  test(`layout remains within ${width}px on every route`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of [
      "/",
      "/brief?example=coffee",
      "/analyses",
      "/methodology",
      "/analysis/missing-local-report",
    ]) {
      await page.goto(route);
      await page.locator("h1").waitFor();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth + 1,
        ),
        route,
      ).toBe(true);
    }
  });
}
test("mobile navigation and reduced motion work", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/brief");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.locator(".sidebar")).toHaveClass(/sidebar-open/);
  await page.getByRole("link", { name: "Methodology", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Nothing behind the curtain",
  );
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollBehavior,
    ),
  ).toBe("auto");
});

test("landing and studio satisfy automated WCAG checks", async ({ page }) => {
  for (const route of [
    "/",
    "/brief?example=coffee",
    "/analyses",
    "/methodology",
  ]) {
    await page.goto(route);
    await page.locator("h1").waitFor();
    await page.waitForFunction(() =>
      Array.from(
        document.querySelectorAll(".hero-inner > div, .brief-stage"),
      ).every((el) => getComputedStyle(el).opacity === "1"),
    );
    const scan = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      scan.violations,
      `${route}: ${scan.violations.map((v) => v.id).join(", ")}`,
    ).toEqual([]);
  }
});

test("research API rejects invalid input and foreign browser origins", async ({
  request,
}) => {
  const invalid = await request.post("/api/research", {
    data: { idea: "missing fields" },
  });
  expect(invalid.status()).toBe(400);
  const foreign = await request.post("/api/research", {
    data: demoBrief,
    headers: { Origin: "https://foreign.example" },
  });
  expect(foreign.status()).toBe(403);
  const oversized = await request.post("/api/research", {
    data: { ...demoBrief, idea: "x".repeat(9000) },
  });
  expect(oversized.status()).toBe(413);
});
