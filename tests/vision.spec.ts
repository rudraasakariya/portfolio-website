import { expect, test } from "@playwright/test";

/* The detection model must stay out of the test path — block its network. */
test.beforeEach(async ({ page }) => {
  await page.route(/huggingface\.co|jsdelivr\.net/, (route) => route.abort());
});

test.describe("vision playground", () => {
  test("page renders with privacy line and start button", async ({ page }) => {
    await page.goto("/vision");
    await expect(page.getByRole("heading", { name: "Vision" })).toBeVisible();
    await expect(
      page.getByText("no video ever leaves your device"),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Start camera" }),
    ).toBeVisible();
  });
});
