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
    page.getByRole("heading", { name: "로컬 합성 데이터", level: 2 }),
  ).toBeVisible();

  await page
    .getByRole("button", { name: "지난달 매출이 왜 감소했어?" })
    .click();
  await page.getByRole("button", { name: "분석 시작하기" }).click();

  await expect(page).toHaveURL(/\/dashboard\/[a-f0-9-]+\?question=/);
  await expect(
    page
      .getByRole("region", { name: "입력한 질문" })
      .getByText("지난달 매출이 왜 감소했어?", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "매출 분석 결과", level: 1 }),
  ).toBeVisible();
  await expect(page.getByText("로컬 분석 · 검증 결과")).toBeVisible();
});

test("renders the empty history shell", async ({ page }) => {
  await page.goto("/history");

  await expect(
    page.getByRole("heading", { name: "분석 기록", level: 1 }),
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
    page.getByRole("heading", { name: "매출 분석 결과", level: 1 }),
  ).toBeVisible();
  await page.getByRole("button", { name: "대시보드 편집" }).click();
  await page
    .getByRole("combobox", { name: "주요 세그먼트 비교 표시 형식" })
    .selectOption("donut");
  await expect(
    page.getByRole("img", { name: "디바이스별 매출 구성 도넛 차트" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "주요 세그먼트 비교 삭제" }).click();
  await expect(
    page.getByRole("heading", { name: "디바이스별 매출 구성", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "대시보드 편집 실행 취소" }).click();
  await expect(
    page.getByRole("heading", { name: "디바이스별 매출 구성", exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: "편집 완료" }).click();
  await page.reload();
  await expect(
    page.getByRole("img", { name: "디바이스별 매출 구성 도넛 차트" }),
  ).toBeVisible();
});

test("keeps context across follow-ups and reopens a saved dashboard", async ({
  page,
}) => {
  await page.goto(
    "/dashboard/follow-up-history?question=이번%20달%20성과를%20보여줘.",
  );

  await expect(
    page.getByRole("heading", { name: "매출 분석 결과", level: 1 }),
  ).toBeVisible();
  await page.getByLabel("후속 분석 질문").fill("모바일만 자세히 분석해줘.");
  await page.getByRole("button", { name: "후속 분석" }).click();

  await expect(
    page.getByRole("heading", { name: "모바일 매출 분석 결과", level: 1 }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("region", { name: "모바일 매출 분석 결과", exact: true })
      .getByText("이번 달", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "디바이스 · 모바일 조건 제거" }),
  ).toBeVisible();

  await page.getByLabel("후속 분석 질문").fill("작년 같은 기간과 비교해줘.");
  await page.getByRole("button", { name: "후속 분석" }).click();

  await expect(
    page.getByRole("heading", {
      name: "모바일 매출 분석 결과",
      level: 1,
    }),
  ).toBeVisible();
  await expect(page.getByRole("combobox", { name: "비교 기준" })).toHaveValue(
    "previousYear",
  );
  await expect(
    page.getByRole("button", { name: "디바이스 · 모바일 조건 제거" }),
  ).toBeVisible();

  await page.goto("/history");
  const savedAnalysis = page.getByRole("link", {
    name: "작년 같은 기간과의 비교",
  });
  await expect(savedAnalysis).toBeVisible();
  const analysisRequests: string[] = [];
  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      new URL(request.url()).pathname === "/api/analyze"
    ) {
      analysisRequests.push(request.url());
    }
  });
  await savedAnalysis.click();

  await expect(
    page.getByRole("heading", {
      name: "모바일 매출 분석 결과",
      level: 1,
    }),
  ).toBeVisible();
  await expect(page.getByRole("combobox", { name: "비교 기준" })).toHaveValue(
    "previousYear",
  );
  await expect(
    page.getByRole("button", { name: "디바이스 · 모바일 조건 제거" }),
  ).toBeVisible();
  expect(analysisRequests).toHaveLength(0);
});
