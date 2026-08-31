import {
  Bell,
  CircleHelp,
  FolderOpen,
  History,
  Home,
  Layers3,
  Plus,
  Search,
  Settings,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

type NavigationKey = "home" | "history";
type WorkspaceTab = "overview" | "market";

type WorkspaceShellProps = {
  activeNavigation?: NavigationKey;
  activeTab?: WorkspaceTab;
  children: ReactNode;
};

const navigationItems = [
  { key: "home", label: "Home", href: "/", icon: Home },
  { key: "library", label: "Library", href: null, icon: FolderOpen },
  { key: "history", label: "History", href: "/history", icon: History },
  { key: "settings", label: "Settings", href: null, icon: Settings },
] as const;

const workspaceTabs = [
  { key: "overview", label: "Executive Overview" },
  { key: "market", label: "Market Analysis" },
] as const;

export function WorkspaceShell({
  activeNavigation,
  activeTab = "overview",
  children,
}: WorkspaceShellProps) {
  return (
    <div className="min-h-screen bg-[#f8f9fb] text-[#191c1e]">
      <a
        className="sr-only fixed top-3 left-3 z-[60] rounded-md bg-[#191c1e] px-3 py-2 text-sm font-semibold text-white focus:not-sr-only focus:outline-2 focus:outline-offset-2 focus:outline-[#4f46e5]"
        href="#main-content"
      >
        본문으로 건너뛰기
      </a>
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[232px] flex-col border-r border-white/8 bg-[#292c2f] md:flex">
        <div className="flex h-[88px] items-center gap-3 px-6">
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
            <span className="mt-1.5 block truncate text-[11px] text-[#c3c0ff]">
              Enterprise Workspace
            </span>
          </span>
        </div>

        <nav aria-label="주요 탐색" className="flex-1 px-2 py-2">
          <ul className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = item.key === activeNavigation;
              const className = `flex h-10 items-center gap-3 rounded-lg px-3 text-[14px] font-medium transition-colors duration-100 ${
                active
                  ? "bg-[#4f46e5] text-white"
                  : "text-[#d9dadc] hover:bg-white/7 hover:text-white"
              }`;

              return (
                <li key={item.key}>
                  {item.href ? (
                    <Link
                      aria-current={active ? "page" : undefined}
                      className={className}
                      href={item.href}
                    >
                      <Icon aria-hidden="true" className="size-[18px]" />
                      {item.label}
                    </Link>
                  ) : (
                    <span
                      aria-disabled="true"
                      className={`${className} cursor-not-allowed opacity-55`}
                      title="준비 중"
                    >
                      <Icon aria-hidden="true" className="size-[18px]" />
                      {item.label}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mx-4 mb-4 border-t border-white/10 pt-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <span className="grid size-8 place-items-center rounded-full border border-white/10 bg-[#3a3e42] text-[11px] font-semibold text-white">
              PA
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-medium text-white">
                Prism Workspace
              </span>
              <span className="mt-0.5 block truncate text-[11px] text-[#c3c0ff]">
                Mock mode
              </span>
            </span>
          </div>
        </div>
      </aside>

      <header className="fixed top-0 right-0 left-0 z-40 flex h-[60px] items-center justify-between border-b border-[#dfe1e6] bg-white px-4 md:left-[232px] md:px-6">
        <Link
          className="flex items-center gap-2 text-[14px] font-bold tracking-[-0.02em] text-[#191c1e] md:hidden"
          href="/"
        >
          <span className="grid size-7 place-items-center rounded-full bg-[#292c2f] text-white">
            <Layers3 aria-hidden="true" className="size-4" />
          </span>
          Prism AI
        </Link>

        <div className="hidden items-center gap-2 text-[13px] text-[#777587] lg:flex">
          <Search aria-hidden="true" className="size-4" />
          <span>Search workspace</span>
          <kbd className="ml-2 rounded border border-[#dfe1e6] bg-[#f8f9fb] px-1.5 py-0.5 text-[10px] text-[#777587]">
            ⌘ K
          </kbd>
        </div>

        <div
          aria-label="워크스페이스 보기"
          className="absolute inset-y-0 left-1/2 hidden -translate-x-1/2 items-center gap-6 xl:flex"
          role="group"
        >
          {workspaceTabs.map((tab) => (
            <span
              className={`flex h-full items-center border-b-2 pt-0.5 text-[11px] font-semibold tracking-[0.08em] uppercase ${
                tab.key === activeTab
                  ? "border-[#4f46e5] text-[#3525cd]"
                  : "border-transparent text-[#777587]"
              }`}
              key={tab.key}
            >
              {tab.label}
              {tab.key === activeTab ? (
                <span className="sr-only"> 현재 보기</span>
              ) : null}
            </span>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
          <Link
            aria-label="분석 기록"
            className="grid size-11 place-items-center rounded-lg text-[#777587] hover:bg-[#f2f4f6] hover:text-[#4f46e5] md:hidden"
            href="/history"
          >
            <History aria-hidden="true" className="size-[18px]" />
          </Link>
          <Bell
            aria-hidden="true"
            className="hidden size-[18px] text-[#777587] sm:block"
          />
          <CircleHelp
            aria-hidden="true"
            className="hidden size-[18px] text-[#777587] sm:block"
          />
          <Link
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#4f46e5] px-3.5 text-[13px] font-semibold text-white transition-colors duration-100 hover:bg-[#3f37c9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4f46e5]"
            href="/"
          >
            <Plus aria-hidden="true" className="size-4" />
            <span className="hidden sm:inline">New Analysis</span>
            <span className="sm:hidden">New</span>
          </Link>
        </div>
      </header>

      <div id="main-content" className="pt-[60px] md:pl-[232px]">
        {children}
      </div>
    </div>
  );
}
