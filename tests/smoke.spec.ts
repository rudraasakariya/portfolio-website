import { expect, test } from "@playwright/test";

test.describe("pages render", () => {
  test("home shows hero and highlights", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Rudraraj/ })).toBeVisible();
    await expect(page.getByText("Built a platform serving 1,500 students")).toBeVisible();
  });

  test("about shows education, experience, and skills", async ({ page }) => {
    await page.goto("/about");
    await expect(page.getByRole("heading", { name: "Education" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Experience" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Skills" })).toBeVisible();
  });

  test("resume PDF is served", async ({ request }) => {
    const response = await request.get("/assets/Rudraraj-Sakariya-Resume.pdf");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("pdf");
  });
});

test.describe("theme", () => {
  test("toggle flips theme and persists across routes and reloads", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");
    await expect(html).toHaveAttribute("data-theme", "light");

    await page.getByRole("button", { name: "Toggle dark mode" }).click();
    await expect(html).toHaveAttribute("data-theme", "dark");

    await page.getByRole("link", { name: "Projects", exact: true }).click();
    await page.waitForURL("**/projects");
    await expect(html).toHaveAttribute("data-theme", "dark");

    await page.reload();
    await expect(html).toHaveAttribute("data-theme", "dark");
  });
});

test.describe("projects", () => {
  test("category pills filter the cards", async ({ page }) => {
    await page.goto("/projects");
    const cards = page.locator("div.proj-card");
    await expect(cards).toHaveCount(4);

    await page.getByRole("button", { name: "Systems & Native" }).click();
    await expect(cards).toHaveCount(1);
    await expect(page.getByRole("heading", { name: /Wikipedia Crawler/ })).toBeVisible();

    await page.getByRole("button", { name: "All", exact: true }).click();
    await expect(cards).toHaveCount(4);
  });

  test("private project shows no external links", async ({ page }) => {
    await page.goto("/projects");
    await expect(page.getByText("Private — access-gated")).toBeVisible();
  });
});

test.describe("contact form", () => {
  test("client validation blocks empty submit", async ({ page }) => {
    await page.goto("/contact");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText("Name is required")).toBeVisible();
  });

  test("successful submit shows confirmation", async ({ page }) => {
    await page.route("**/api/contact", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      }),
    );
    await page.goto("/contact");
    await page.locator("#contact-name").fill("Test Recruiter");
    await page.locator("#contact-email").fill("recruiter@example.com");
    await page.locator("#contact-message").fill("Let's talk about a role.");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText(/message sent/)).toBeVisible();
    await expect(page.getByText("recruiter@example.com")).toBeVisible();
  });

  test("api rejects invalid payloads", async ({ request }) => {
    const response = await request.post("/api/contact", {
      data: { name: "", email: "not-an-email", message: "" },
    });
    expect([400, 503]).toContain(response.status());
  });
});
