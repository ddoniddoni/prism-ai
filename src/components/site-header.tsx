import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-slate-900/8 bg-[#f6f7fb]/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link
          className="group inline-flex items-center gap-3 rounded-sm focus-visible:ring-2 focus-visible:ring-[#6d5ce7] focus-visible:ring-offset-4 focus-visible:outline-none"
          href="/"
        >
          <span className="grid size-7 place-items-center bg-[#151a2d] font-mono text-xs font-bold tracking-[-0.08em] text-white transition-transform group-hover:rotate-12">
            P/
          </span>
          <span className="text-sm font-bold tracking-[0.14em] text-[#151a2d] uppercase">
            Prism AI
          </span>
        </Link>
        <nav
          aria-label="주요 탐색"
          className="flex items-center gap-2 sm:gap-5"
        >
          <span className="hidden border border-[#6657dd]/20 bg-[#6657dd]/8 px-2 py-1 font-mono text-[10px] font-semibold tracking-[0.12em] text-[#5144bb] uppercase sm:inline-flex">
            Mock mode
          </span>
          <Link
            className="rounded-sm px-2 py-1 text-sm font-medium text-slate-600 transition-colors hover:text-[#151a2d] focus-visible:ring-2 focus-visible:ring-[#6d5ce7] focus-visible:outline-none"
            href="/history"
          >
            History
          </Link>
        </nav>
      </div>
    </header>
  );
}
