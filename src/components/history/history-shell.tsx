import { HistoryList } from "./history-list";

export function HistoryShell() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-[calc(100vh-60px)] px-4 py-8 sm:px-8 lg:py-10"
    >
      <div className="mx-auto w-full max-w-[1440px]">
        <h1 className="text-[30px] font-semibold tracking-[-0.035em] text-[#191c1e] sm:text-[34px]">
          분석 기록
        </h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[#595e6b]">
          이전에 생성한 분석 워크스페이스를 관리하고 검증된 결과로 다시 엽니다.
        </p>
        <HistoryList />
      </div>
    </main>
  );
}
