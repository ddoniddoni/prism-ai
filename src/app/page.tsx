import { DataRangePanel } from "@/components/data-range-panel";
import { RecentAnalysisList } from "@/components/history/history-list";
import { PromptInput } from "@/components/prompt/prompt-input";
import { WorkspaceShell } from "@/components/workspace-shell";
import { LocalAnalyticsRepository } from "@/lib/data/local-repository";
import Link from "next/link";

const recommendedQuestions = [
  "지난달 매출이 왜 감소했어?",
  "이번 달 성과를 보여줘.",
  "모바일만 자세히 분석해줘.",
  "가장 많이 하락한 상품은 뭐야?",
  "광고비 대비 성과를 보여줘.",
  "환불률이 높은 지역을 알려줘.",
  "서울에서 산 제품들 판매량만 보여줘.",
  "지난달 매출의 디바이스별 구성을 보여줘.",
  "지난달 매출 집중도를 달력 히트맵으로 보여줘.",
] as const;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ question?: string | string[] }>;
}) {
  const query = await searchParams;
  const initialQuestion =
    typeof query.question === "string" ? query.question.slice(0, 300) : "";
  const repository = new LocalAnalyticsRepository();
  const [dataRange, rows] = await Promise.all([
    repository.getDataRange(),
    repository.getRows(),
  ]);

  return (
    <WorkspaceShell page="home">
      <main
        id="main-content"
        tabIndex={-1}
        className="min-h-[calc(100vh-60px)] px-4 py-10 sm:px-8 lg:py-10"
      >
        <div className="mx-auto w-full max-w-[1440px]">
          <section
            aria-labelledby="home-title"
            className="mx-auto max-w-4xl text-center"
          >
            <p className="text-[11px] font-semibold tracking-[0.14em] text-[#4f46e5] uppercase">
              이커머스 분석 공간
            </p>
            <h1
              className="mt-4 text-[clamp(2rem,4vw,3.25rem)] leading-[1.12] font-semibold tracking-[-0.045em] text-[#191c1e]"
              id="home-title"
            >
              매출부터 광고 성과까지, 데이터에 물어보세요.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-7 text-[#595e6b] sm:text-base">
              질문을 검증된 분석 계획으로 바꾸고, 실제 데이터에서 계산한 근거로
              대시보드를 구성합니다.
            </p>

            <div className="mt-9 text-left">
              <PromptInput
                key={initialQuestion}
                initialQuestion={initialQuestion}
                recommendedQuestions={recommendedQuestions}
              />
            </div>
          </section>

          <div className="mx-auto mt-10 max-w-4xl">
            <DataRangePanel dataRange={dataRange} rowCount={rows.length} />
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <section
                className="rounded-lg border border-[#dde2e8] bg-white p-4"
                aria-labelledby="supported-analysis-title"
              >
                <h2
                  id="supported-analysis-title"
                  className="text-sm font-semibold"
                >
                  이 데이터로 알아볼 수 있어요
                </h2>
                <p className="mt-2 text-xs leading-6 text-[#595e6b]">
                  매출·주문·판매량·전환율·광고 효율·환불률을 기간, 상품, 지역,
                  디바이스별로 비교할 수 있습니다.
                </p>
              </section>
              <section
                className="rounded-lg border border-[#dde2e8] bg-white p-4"
                aria-labelledby="analysis-reference-title"
              >
                <h2
                  id="analysis-reference-title"
                  className="text-sm font-semibold"
                >
                  기간은 데이터의 마지막 날 기준이에요
                </h2>
                <p className="mt-2 text-xs leading-6 text-[#595e6b]">
                  ‘이번 달’과 ‘지난달’은 {dataRange.maxDate}을 기준으로
                  해석합니다. 이 데모는 합성 데이터를 분석하며 실시간 웹 정보나
                  미래 예측은 제공하지 않습니다.
                </p>
              </section>
            </div>
          </div>

          <section
            aria-labelledby="recent-analysis-title"
            className="mx-auto mt-8 max-w-4xl lg:mt-10"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.13em] text-[#777587] uppercase">
                  최근 활동
                </p>
                <h2
                  className="mt-1.5 text-xl font-semibold tracking-[-0.025em] text-[#191c1e]"
                  id="recent-analysis-title"
                >
                  최근 분석
                </h2>
              </div>
              <Link
                className="inline-flex min-h-11 items-center text-[13px] font-medium text-[#4f46e5] hover:text-[#3525cd]"
                href="/history"
              >
                전체 기록 보기
              </Link>
            </div>
            <RecentAnalysisList />
          </section>
        </div>
      </main>
    </WorkspaceShell>
  );
}
