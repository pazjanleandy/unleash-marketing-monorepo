function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col px-6 py-16">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-10 shadow-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
            Unleash Marketing Centre
          </p>
          <h1 className="mt-4 text-4xl font-semibold sm:text-5xl">
            Launch campaigns with confidence.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-300">
            Vite + React + Tailwind + TypeScript workspace is ready for your
            marketing centre buildout.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
            >
              Create campaign
            </button>
            <button
              type="button"
              className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white/90 transition hover:border-white/40"
            >
              View docs
            </button>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                Workflows
              </p>
              <p className="mt-3 text-sm text-slate-200">
                Ship campaigns fast with reusable templates and approvals.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                Insights
              </p>
              <p className="mt-3 text-sm text-slate-200">
                Track performance across channels with clear attribution.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                Automation
              </p>
              <p className="mt-3 text-sm text-slate-200">
                Coordinate launches with triggers and live status updates.
              </p>
            </div>
          </div>
        </div>
        <p className="mt-8 text-xs uppercase tracking-[0.35em] text-slate-500">
          Workspace ready
        </p>
      </div>
    </div>
  )
}

export default App
