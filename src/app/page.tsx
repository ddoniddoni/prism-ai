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
] as const;

export default async function Home() {
  const repository = new LocalAnalyticsRepository();
  const [dataRange, rows] = await Promise.all([
    repository.getDataRange(),
    repository.getRows(),
  ]);

  return (
    <WorkspaceShell activeNavigation="home" activeTab="overview">
      <main className="min-h-[calc(100vh-60px)] px-4 py-10 sm:px-8 lg:py-16">
        <div className="mx-auto w-full max-w-[1440px]">
          <section
            aria-labelledby="home-title"
            className="mx-auto max-w-4xl text-center"
          >
            <p className="text-[11px] font-semibold tracking-[0.14em] text-[#4f46e5] uppercase">
              E-commerce Workspace
            </p>
            <h1
              className="mt-4 text-[clamp(2rem,4vw,3.25rem)] leading-[1.12] font-semibold tracking-[-0.045em] text-[#191c1e]"
              id="home-title"
            >
              비즈니스에 대해 무엇이든 물어보세요.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-7 text-[#595e6b] sm:text-base">
              질문을 검증된 분석 계획으로 바꾸고, 실제 데이터에서 계산한 근거로
              대시보드를 구성합니다.
            </p>

            <div className="mt-9 text-left">
              <PromptInput recommendedQuestions={recommendedQuestions} />
            </div>
          </section>

          <div className="mx-auto mt-10 max-w-4xl">
            <DataRangePanel dataRange={dataRange} rowCount={rows.length} />
          </div>

          <section
            aria-labelledby="recent-analysis-title"
            className="mx-auto mt-14 max-w-4xl lg:mt-16"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.13em] text-[#777587] uppercase">
                  Workspace activity
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
