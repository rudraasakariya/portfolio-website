import { expect, test } from "@playwright/test";

const ROUTES = ["/", "/projects", "/lab", "/about", "/contact"] as const;

test.use({ viewport: { width: 390, height: 844 } });

test.describe("mobile viewport", () => {
  test("hamburger menu replaces the pill and navigates", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".nav-pill")).toBeHidden();
    const burger = page.getByRole("button", { name: "Menu" });
    await expect(burger).toBeVisible();
    await burger.click();
    await page.getByRole("link", { name: "Lab", exact: true }).click();
    await page.waitForURL("**/lab");
    await expect(page.getByRole("heading", { name: "Things you can poke" })).toBeVisible();
  });

  test("no page scrolls horizontally", async ({ page }) => {
    for (const route of ROUTES) {
      await page.goto(route);
      const overflow = await page.evaluate(() => {
        const de = document.documentElement;
        return de.scrollWidth - de.clientWidth;
      });
      expect(overflow, `${route} overflows horizontally`).toBeLessThanOrEqual(0);
    }
  });

  test("tutoring card shows its live demo link", async ({ page }) => {
    await page.goto("/projects");
    const demo = page.locator("#rutgers-tutoring-platform a.demo-btn");
    await demo.scrollIntoViewIfNeeded();
    await expect(demo).toBeVisible();
  });
});
