function MarketingHero() {
  return (
    <section className="motion-rise relative hidden overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-[0_28px_62px_-42px_rgba(15,23,42,0.65)] sm:block sm:p-8">
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#ffb489]/35 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-12 h-48 w-48 rounded-full bg-[#8ec3ff]/22 blur-3xl" />
      <div className="relative">
        <p className="text-xs font-bold uppercase tracking-[0.32em] text-[#f06a2d]">
          Unleash
        </p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
          Marketing Centre
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
          Manage promotions, shopper engagement, and traffic campaigns from one
          place.
        </p>
      </div>
    </section>
  )
}

export default MarketingHero
