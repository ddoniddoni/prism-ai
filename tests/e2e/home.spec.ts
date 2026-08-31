import { expect, test } from "@playwright/test";

test("starts an analysis from a recommended question and renders a verified dashboard", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: "비즈니스에 대해 무엇이든 물어보세요.",
      level: 1,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Local Synthetic Dataset", level: 2 }),
  ).toBeVisible();

  await page
    .getByRole("button", { name: "지난달 매출이 왜 감소했어?" })
    .click();
  await page.getByRole("button", { name: "분석 시작하기" }).click();

  await expect(page).toHaveURL(/\/dashboard\/mock-preview\?question=/);
  await expect(page.getByText("지난달 매출이 왜 감소했어?")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "지난달 매출 변화의 신호", level: 1 }),
  ).toBeVisible();
  await expect(page.getByText("Mock AI · verified result")).toBeVisible();
});

test("renders the empty history shell", async ({ page }) => {
  await page.goto("/history");

  await expect(
    page.getByRole("heading", { name: "Analysis History", level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "첫 분석을 시작해 보세요.",
      level: 2,
    }),
  ).toBeVisible();
});

test("edits, restores, and persists a dashboard layout", async ({ page }) => {
  await page.goto(
    "/dashboard/mock-preview?question=지난달%20매출이%20왜%20감소했어%3F",
  );

  await expect(
    page.getByRole("heading", { name: "지난달 매출 변화의 신호", level: 1 }),
  ).toBeVisible();
  await page.getByRole("button", { name: "대시보드 편집" }).click();
  await page
    .getByRole("combobox", { name: "주요 세그먼트 비교 표시 형식" })
    .selectOption("donut");
  await expect(
    page.getByRole("img", { name: "주요 세그먼트 비교 도넛 그래프" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "주요 세그먼트 비교 삭제" }).click();
  await expect(
    page.getByRole("heading", { name: "주요 세그먼트 비교" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "대시보드 편집 실행 취소" }).click();
  await expect(
    page.getByRole("heading", { name: "주요 세그먼트 비교" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "편집 완료" }).click();
  await page.reload();
  await expect(
    page.getByRole("img", { name: "주요 세그먼트 비교 도넛 그래프" }),
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
  const savedAnalysis = page.getByRole("link", {
    name: "작년 같은 기간과의 비교",
  });
  await expect(savedAnalysis).toBeVisible();
  await savedAnalysis.click();

  await expect(
    page.getByRole("heading", {
      name: "작년 같은 기간과의 비교",
      level: 1,
    }),
  ).toBeVisible();
});
