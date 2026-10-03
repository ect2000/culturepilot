import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { demoBrief } from "../../src/lib/types";

test("optional sentence parsing populates review fields without running research", async ({
  page,
}) => {
  let researchCalls = 0;
  page.on("request", (request) => {
    if (request.url().endsWith("/api/research")) researchCalls++;
  });
  await page.route("**/api/brief", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        brief: {
          ...demoBrief,
          suggestedDimensions: ["brand", "place", "artist", "book", "movie"],
        },
        message: "Review the extracted fields before starting Qloo research.",
      }),
    }),
  );
  await page.goto("/brief");
  await page
    .getByText("Describe your idea in one sentence", { exact: false })
    .click();
  await page
    .getByLabel("Your idea, audience, market and goal")
    .fill(
      "A premium specialty coffee brand in Madrid for professionals aged 25–35. Launch a product.",
    );
  await page.getByRole("button", { name: "Prepare my brief" }).click();
  await expect(page.getByLabel("What are you building?")).toHaveValue(
    demoBrief.idea,
  );
  await expect(page.getByRole("status")).toContainText(
    "Review the extracted fields",
  );
  expect(researchCalls).toBe(0);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByLabel("Your target audience")).toHaveValue(
    demoBrief.audience,
  );
});

test("missing optional key keeps the form and integration status usable", async ({
  page,
}) => {
  await page.goto("/brief");
  await page
    .getByText("Describe your idea in one sentence", { exact: false })
    .click();
  await page
    .getByLabel("Your idea, audience, market and goal")
    .fill("Coffee for Madrid professionals aged 25–35.");
  await page.getByRole("button", { name: "Prepare my brief" }).click();
  await expect(page.getByRole("status")).toContainText("structured form");
  await expect(page.getByLabel("What are you building?")).toBeEditable();
  await page.getByText("Integration status", { exact: true }).click();
  await expect(
    page.getByText("OpenRouter · Optional", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Ready · Deterministic", { exact: true }),
  ).toBeVisible();
  await page.waitForFunction(() =>
    [...document.querySelectorAll(".brief-stage")].every(
      (el) => getComputedStyle(el).opacity === "1",
    ),
  );
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});

test("language API validates browser input and origin", async ({ request }) => {
  expect(
    (await request.post("/api/brief", { data: { text: "short" } })).status(),
  ).toBe(400);
  expect(
    (
      await request.post("/api/brief", {
        data: { text: "A full valid brief", model: "paid/model" },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post("/api/brief", {
        data: { text: "A full valid brief" },
        headers: { origin: "https://unrelated.test" },
      })
    ).status(),
  ).toBe(403);
});
