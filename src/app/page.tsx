export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center bg-slate-50 px-6 py-20">
      <section className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
        <p className="text-sm font-semibold tracking-[0.2em] text-slate-500 uppercase">
          Generative analytics workspace
        </p>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight text-slate-950">
          Prism AI
        </h1>
        <p className="mt-4 text-xl leading-8 text-slate-600">
          Ask your data. Build your dashboard.
        </p>
        <p className="mt-8 border-t border-slate-100 pt-6 text-sm text-slate-500">
          Phase 0 — Bootstrap complete. The mock analytics experience is next.
        </p>
      </section>
    </main>
  );
}
