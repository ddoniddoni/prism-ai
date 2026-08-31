import { HistoryList } from "./history-list";

export function HistoryShell() {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#f6f7fb] px-5 py-10 sm:px-8 lg:py-14">
      <div className="mx-auto w-full max-w-5xl">
        <p className="font-mono text-[11px] font-semibold tracking-[0.16em] text-[#6657dd] uppercase">
          Analysis history
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.055em] text-[#151a2d] sm:text-5xl">
          최근 분석
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
          최근 20개의 검증된 분석 결과를 이 브라우저에 보관합니다. 저장된
          대시보드는 당시의 검증된 결과로 다시 열 수 있습니다.
        </p>
        <HistoryList />
      </div>
    </main>
  );
}
