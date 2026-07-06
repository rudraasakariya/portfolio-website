import { expect, test } from "@playwright/test";

/* The detection model must stay out of the test path — block its network. */
test.beforeEach(async ({ page }) => {
  await page.route(/huggingface\.co|jsdelivr\.net/, (route) => route.abort());
});

test.describe("lab page", () => {
  test("nav link reaches the lab with both experiments", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Lab", exact: true }).click();
    await page.waitForURL("**/lab");
    await expect(
      page.getByRole("heading", { name: "Things you can poke" }),
    ).toBeVisible();
    await expect(
      page.getByText("no video ever leaves your device"),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Start camera" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "A real request, end to end" }),
    ).toBeVisible();
  });

  test("old vision URL permanently redirects to the lab", async ({ request }) => {
    const response = await request.get("/vision", { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers()["location"]).toBe("/lab");
  });

  test("send animates the pulse to a 200 OK", async ({ page }) => {
    await page.goto("/lab");
    await page.getByRole("button", { name: /Send request/ }).click();
    await expect(page.getByText(/200 OK/)).toBeVisible({ timeout: 6000 });
  });

  test("clicking a node reveals its detail line", async ({ page }) => {
    await page.goto("/lab");
    await page.getByRole("button", { name: "PostgreSQL — details" }).click();
    await expect(
      page.getByText(/cross-tutor reads are impossible/),
    ).toBeVisible();
  });
});
