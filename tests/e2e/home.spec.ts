import { expect, test } from "@playwright/test";

test("starts an analysis from a recommended question and renders a verified dashboard", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: "질문을 신호로, 데이터를 다음 결정으로.",
      level: 1,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "분석 가능한 합성 데이터", level: 2 }),
  ).toBeVisible();

  await page
    .getByRole("button", { name: "지난달 매출이 왜 감소했어?" })
    .click();
  await page.getByRole("button", { name: "분석 시작하기" }).click();

  await expect(page).toHaveURL(/\/dashboard\/mock-preview\?question=/);
  await expect(
    page.getByRole("heading", {
      name: "질문을 검증된 분석으로 연결합니다.",
      level: 1,
    }),
  ).toBeVisible();
  await expect(page.getByText("지난달 매출이 왜 감소했어?")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "지난달 매출 변화의 신호", level: 1 }),
  ).toBeVisible();
  await expect(page.getByText("Mock AI · verified result")).toBeVisible();
});

test("renders the empty history shell", async ({ page }) => {
  await page.goto("/history");

  await expect(
    page.getByRole("heading", { name: "최근 분석", level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "첫 질문으로 분석 기록을 시작하세요.",
      level: 2,
    }),
  ).toBeVisible();
});

test("keeps context across follow-ups and reopens a saved dashboard", async ({
  page,
}) => {
  await page.goto(
    "/dashboard/follow-up-history?question=이번%20달%20성과를%20보여줘.",
  );

  await expect(
    page.getByRole("heading", { name: "이번 달 성과 스냅샷", level: 1 }),
  ).toBeVisible();
  await page.getByLabel("후속 분석 질문").fill("모바일만 자세히 분석해줘.");
  await page.getByRole("button", { name: "후속 분석" }).click();

  await expect(
    page.getByRole("heading", { name: "모바일 성과 분석", level: 1 }),
  ).toBeVisible();
  await expect(page.getByText("thisMonth")).toBeVisible();
  await expect(page.getByText("device: mobile")).toBeVisible();

  await page.getByLabel("후속 분석 질문").fill("작년 같은 기간과 비교해줘.");
  await page.getByRole("button", { name: "후속 분석" }).click();

  await expect(
    page.getByRole("heading", {
      name: "작년 같은 기간과의 비교",
      level: 1,
    }),
  ).toBeVisible();
  await expect(page.getByText("전년 동기 대비")).toBeVisible();
  await expect(page.getByText("device: mobile")).toBeVisible();

  await page.goto("/history");
  await expect(
    page.getByRole("heading", {
      name: "작년 같은 기간과의 비교",
      level: 2,
    }),
  ).toBeVisible();
  await page.getByRole("link", { name: "다시 열기" }).first().click();

  await expect(
    page.getByRole("heading", {
      name: "작년 같은 기간과의 비교",
      level: 1,
    }),
  ).toBeVisible();
});
