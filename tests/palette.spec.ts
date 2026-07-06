import { expect, test } from "@playwright/test";

/* The embedding model must stay out of the test path: block its network so
   the palette deterministically stays in keyword-fallback mode. */
test.beforeEach(async ({ page }) => {
  await page.route(/huggingface\.co|jsdelivr\.net/, (route) => route.abort());
});

test.describe("search palette", () => {
  test("Ctrl+K opens and Escape closes", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("ControlOrMeta+k");
    const dialog = page.getByRole("dialog", { name: "Search my portfolio" });
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
  });

  test("nav search button opens the palette", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Search" }).click();
    await expect(page.getByPlaceholder("Ask my portfolio…")).toBeVisible();
  });

  test("keyword search finds ChannelSeal and Enter navigates", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("ControlOrMeta+k");
    await page.getByPlaceholder("Ask my portfolio…").fill("channelseal");
    await expect(page.getByRole("option").first()).toContainText(/ChannelSeal/i);
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/(about|projects)#/);
  });
});
