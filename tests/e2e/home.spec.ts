import { expect, test } from "@playwright/test";

test("renders the Prism AI bootstrap page", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Prism AI", level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByText("Ask your data. Build your dashboard."),
  ).toBeVisible();
});
