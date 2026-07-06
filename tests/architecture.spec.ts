import { expect, test } from "@playwright/test";

test.describe("request cycle diagram", () => {
  test("send animates the pulse to a 200 OK", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "A real request, end to end" }),
    ).toBeVisible();
    await page.getByRole("button", { name: /Send request/ }).click();
    await expect(page.getByText(/200 OK/)).toBeVisible({ timeout: 6000 });
  });

  test("clicking a node reveals its detail line", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "PostgreSQL — details" }).click();
    await expect(
      page.getByText(/cross-tutor reads are impossible/),
    ).toBeVisible();
  });
});
