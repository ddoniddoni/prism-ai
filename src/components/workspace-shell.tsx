import {
  ChevronRight,
  History,
  Home,
  Layers3,
  Plus,
  Search,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

type WorkspacePage = "home" | "dashboard" | "history";

type WorkspaceShellProps = {
  page: WorkspacePage;
  children: ReactNode;
};

const pageLabels: Record<WorkspacePage, string> = {
  home: "홈",
  dashboard: "분석 결과",
  history: "분석 기록",
};

const navigationItems = [
  { key: "home", label: "홈", href: "/", icon: Home },
  { key: "history", label: "분석 기록", href: "/history", icon: History },
] as const;

export function WorkspaceShell({ page, children }: WorkspaceShellProps) {
  return (
    <div className="min-h-screen bg-[#f8f9fb] text-[#191c1e]">
      <a
        className="sr-only fixed top-3 left-3 z-[60] rounded-md bg-[#191c1e] px-3 py-2 text-sm font-semibold text-white focus:not-sr-only focus:outline-2 focus:outline-offset-2 focus:outline-[#4f46e5]"
        href="#main-content"
      >
        본문으로 건너뛰기
      </a>
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[232px] flex-col border-r border-white/8 bg-[#292c2f] md:flex">
        <Link
          aria-label="Prism AI 홈"
          className="m-3 flex min-h-16 items-center gap-3 rounded-lg px-3 transition-colors hover:bg-white/7 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c3c0ff]"
          href="/"
        >
          <span className="grid size-8 place-items-center rounded-full bg-white text-[#292c2f]">
            <Layers3
              aria-hidden="true"
              className="size-[18px]"
              strokeWidth={2.2}
            />
          </span>
          <span className="min-w-0">
            <span className="block text-[17px] leading-none font-bold tracking-[-0.025em] text-white">
              Prism AI
            </span>
            <span className="mt-1.5 block text-[11px] text-[#c3c0ff]">
              이커머스 분석 공간
            </span>
          </span>
        </Link>

        <nav aria-label="주요 탐색" className="flex-1 px-2 py-2">
          <ul className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = item.key === page;

              return (
                <li key={item.key}>
                  <Link
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-[14px] font-medium transition-colors duration-100 ${active ? "bg-[#4f46e5] text-white" : "text-[#d9dadc] hover:bg-white/7 hover:text-white"}`}
                    href={item.href}
                  >
                    <Icon aria-hidden="true" className="size-[18px]" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mx-4 mb-4 border-t border-white/10 px-2 pt-4">
          <p className="text-[12px] font-medium text-white">나의 분석 기록</p>
          <p className="mt-1.5 text-[11px] leading-5 text-[#c3c0ff]">
            기록과 편집 내용은 이 브라우저에 저장됩니다.
          </p>
        </div>
      </aside>

      <header className="fixed top-0 right-0 left-0 z-40 flex h-[60px] items-center justify-between gap-3 border-b border-[#dfe1e6] bg-white px-4 md:left-[232px] md:px-6">
        <Link
          aria-label="Prism AI 홈"
          className="flex min-h-11 shrink-0 items-center gap-2 rounded-lg text-[14px] font-bold tracking-[-0.02em] text-[#191c1e] hover:text-[#4f46e5] md:hidden"
          href="/"
        >
          <span className="grid size-7 place-items-center rounded-full bg-[#292c2f] text-white">
            <Layers3 aria-hidden="true" className="size-4" />
          </span>
          Prism AI
        </Link>

        <nav aria-label="현재 위치" className="hidden md:block">
          <ol className="flex items-center gap-2 text-[13px]">
            {page !== "home" ? (
              <li className="flex items-center gap-2">
                <Link
                  className="inline-flex min-h-11 items-center text-[#595e6b] hover:text-[#4f46e5]"
                  href="/"
                >
                  홈
                </Link>
                <ChevronRight
                  aria-hidden="true"
                  className="size-3.5 text-[#777587]"
                />
              </li>
            ) : null}
            <li aria-current="page" className="font-semibold text-[#191c1e]">
              {pageLabels[page]}
            </li>
          </ol>
        </nav>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
          <Link
            className="hidden min-h-11 items-center gap-2 rounded-lg px-3 text-[12px] text-[#595e6b] hover:bg-[#f2f4f6] hover:text-[#4f46e5] lg:inline-flex"
            href="/history#history-search"
          >
            <Search aria-hidden="true" className="size-4" />
            분석 기록 검색
          </Link>
          <nav aria-label="모바일 탐색" className="md:hidden">
            <Link
              aria-current={page === "history" ? "page" : undefined}
              aria-label="분석 기록"
              className={`grid size-11 place-items-center rounded-lg hover:bg-[#f2f4f6] hover:text-[#4f46e5] ${page === "history" ? "bg-[#eef2ff] text-[#4f46e5]" : "text-[#777587]"}`}
              href="/history"
            >
              <History aria-hidden="true" className="size-[18px]" />
            </Link>
          </nav>
          <Link
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg bg-[#4f46e5] px-3.5 text-[13px] font-semibold text-white transition-colors duration-100 hover:bg-[#3f37c9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4f46e5]"
            href="/#analysis-question"
          >
            <Plus aria-hidden="true" className="size-4" />새 분석
          </Link>
        </div>
      </header>

      <div className="pt-[60px] md:pl-[232px]">{children}</div>
    </div>
  );
}
