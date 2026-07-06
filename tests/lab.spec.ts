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
      page.getByRole("button", { name: /Send request/ }),
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

  test("embedding map renders every indexed chunk without the model", async ({
    page,
  }) => {
    await page.goto("/lab");
    const points = page.locator(".em-point");
    await expect(points.first()).toBeVisible();
    expect(await points.count()).toBeGreaterThanOrEqual(36);
  });

  test("rate limiter delivers, then drops more under heavier traffic", async ({
    page,
  }) => {
    await page.goto("/lab");
    await page.locator(".rl-svg").scrollIntoViewIfNeeded();

    // Idle by default — traffic only flows after Start.
    await page.getByRole("button", { name: "Start traffic" }).click();

    // Delivered/s climbs above zero once the sim warms up.
    await expect(async () => {
      const text = await page
        .locator(".rl-counters strong")
        .first()
        .textContent();
      expect(Number(text)).toBeGreaterThan(0);
    }).toPass({ timeout: 8000 });

    // Max out arrivals: the bounded queue overflows and dropped % rises.
    await page.locator("#rl-arrival").evaluate((el) => {
      const input = el as HTMLInputElement;
      input.value = "30";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await expect(async () => {
      const text = await page
        .locator('[data-testid="rl-dropped"] strong')
        .textContent();
      expect(Number((text ?? "0").replace("%", ""))).toBeGreaterThan(0);
    }).toPass({ timeout: 10000 });
  });
});
