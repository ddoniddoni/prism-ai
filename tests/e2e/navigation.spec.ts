import { expect, test } from "@playwright/test";

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 375, height: 812 },
]) {
  test(`navigates home using the brand at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/history");
    const brand = page.getByRole("link", { name: "Prism AI 홈" });
    await brand.click();
    await expect(page).toHaveURL("/");
    await expect(
      page.getByRole("textbox", { name: "분석할 질문" }),
    ).toBeVisible();
    await page.getByRole("link", { name: "분석 기록", exact: true }).click();
    await expect(page).toHaveURL("/history");
    await expect(
      page.getByRole("link", { name: "분석 기록", exact: true }),
    ).toHaveAttribute("aria-current", "page");
    await page.getByRole("link", { name: "새 분석", exact: true }).click();
    await expect(
      page.getByRole("textbox", { name: "분석할 질문" }),
    ).toBeFocused();
  });
}

test("opens real history search and supports skipping the navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.getByRole("link", { name: "분석 기록 검색" }).click();
  await expect(
    page.getByRole("searchbox", { name: "분석 기록 검색" }),
  ).toBeFocused();
  await page.getByRole("link", { name: "본문으로 건너뛰기" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
});

test("starts each new question in its own dashboard", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("textbox", { name: "분석할 질문" })
    .fill("지난달 매출이 왜 감소했어?");
  await page.getByRole("textbox", { name: "분석할 질문" }).press("Enter");
  await expect(
    page.getByRole("heading", { name: "매출 분석 결과", level: 1 }),
  ).toBeVisible();
  const firstPath = new URL(page.url()).pathname;
  await expect(
    page
      .getByRole("navigation", { name: "주요 탐색" })
      .getByRole("link", { name: "홈", exact: true }),
  ).not.toHaveAttribute("aria-current", "page");
  await page.getByRole("link", { name: "새 분석", exact: true }).click();
  await page
    .getByRole("textbox", { name: "분석할 질문" })
    .fill("이번 달 성과를 보여줘.");
  await page.getByRole("textbox", { name: "분석할 질문" }).press("Enter");
  await expect(
    page.getByRole("heading", { name: "매출 분석 결과", level: 1 }),
  ).toBeVisible();
  expect(new URL(page.url()).pathname).not.toBe(firstPath);
});
