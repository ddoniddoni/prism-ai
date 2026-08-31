import { DataRangePanel } from "@/components/data-range-panel";
import { PromptInput } from "@/components/prompt/prompt-input";
import { SiteHeader } from "@/components/site-header";
import { AnalysisStatus } from "@/components/status/analysis-status";
import { LocalAnalyticsRepository } from "@/lib/data/local-repository";

const recommendedQuestions = [
  "지난달 매출이 왜 감소했어?",
  "이번 달 성과를 보여줘.",
  "모바일만 자세히 분석해줘.",
  "가장 많이 하락한 상품은 뭐야?",
  "광고비 대비 성과를 보여줘.",
  "환불률이 높은 지역을 알려줘.",
] as const;

export default async function Home() {
  const repository = new LocalAnalyticsRepository();
  const [dataRange, rows] = await Promise.all([
    repository.getDataRange(),
    repository.getRows(),
  ]);

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-[#151a2d]">
      <SiteHeader />
      <main className="prism-grid overflow-hidden px-5 py-10 sm:px-8 lg:py-16">
        <div className="mx-auto w-full max-w-7xl">
          <div className="prism-spectrum h-1.5 w-36" aria-hidden="true" />
          <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] lg:gap-20">
            <section aria-labelledby="home-title">
              <p className="font-mono text-[11px] font-semibold tracking-[0.17em] text-[#5144bb] uppercase">
                Generative analytics workspace
              </p>
              <h1 className="mt-5 max-w-4xl text-5xl font-semibold tracking-[-0.065em] text-[#151a2d] sm:text-6xl lg:text-7xl">
                질문을 신호로,
                <br />
                데이터를 다음 결정으로.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
                Prism AI는 자연어 질문을 제한된 분석 계획으로 바꾸고, 실제
                데이터에서 계산한 근거로 대시보드를 구성합니다.
              </p>

              <div className="mt-10 max-w-3xl">
                <PromptInput recommendedQuestions={recommendedQuestions} />
              </div>
            </section>

            <aside className="space-y-4 lg:pt-14" aria-label="데이터 준비 정보">
              <DataRangePanel dataRange={dataRange} rowCount={rows.length} />
              <AnalysisStatus stage="idle" />
              <section className="border border-slate-900/10 bg-[#151a2d] p-5 text-white">
                <p className="font-mono text-[10px] font-semibold tracking-[0.16em] text-[#a9a0ff] uppercase">
                  Prism contract
                </p>
                <dl className="mt-5 space-y-4 text-sm">
                  <div className="flex items-start justify-between gap-6 border-b border-white/10 pb-3">
                    <dt className="text-slate-300">AI의 역할</dt>
                    <dd className="text-right font-medium">계획과 구성 선택</dd>
                  </div>
                  <div className="flex items-start justify-between gap-6 border-b border-white/10 pb-3">
                    <dt className="text-slate-300">숫자의 원천</dt>
                    <dd className="text-right font-medium">결정론적 계산</dd>
                  </div>
                  <div className="flex items-start justify-between gap-6">
                    <dt className="text-slate-300">기본 실행 모드</dt>
                    <dd className="text-right font-medium">Mock AI</dd>
                  </div>
                </dl>
              </section>
            </aside>
          </div>

          <section
            aria-labelledby="recent-analysis-title"
            className="mt-16 border-t border-slate-900/10 pt-6 lg:mt-20"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] font-semibold tracking-[0.16em] text-slate-500 uppercase">
                  Recent work
                </p>
                <h2
                  className="mt-2 text-xl font-semibold tracking-[-0.035em]"
                  id="recent-analysis-title"
                >
                  아직 저장된 분석이 없습니다.
                </h2>
              </div>
              <p className="text-sm text-slate-600">
                분석 History는 Follow-up Context 단계에서 연결됩니다.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
