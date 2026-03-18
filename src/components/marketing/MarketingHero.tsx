type MarketingHeroProps = {
  shopName: string
  isMobile?: boolean
}

function MarketingHero({ shopName, isMobile = false }: MarketingHeroProps) {
  const wrapperClass = isMobile
    ? 'relative mb-4'
    : 'motion-rise relative mb-8 rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_12px_34px_-30px_rgba(12,23,50,0.28)] md:border-0 md:p-0 md:shadow-none'

  return (
    <section className={wrapperClass}>
      <div className="relative z-10 max-w-[1040px]">
        <h1 className="text-[26px] font-bold leading-[1.15] tracking-tight text-[#2B3A55] sm:text-[42px]">
          {shopName} Marketing Tools
        </h1>
        <p className="mt-1 text-[13px] font-medium text-slate-600 sm:text-[17px]">
          Create and manage promotions to boost sales.
        </p>
        <a
          href="#"
          className="mt-2 inline-flex text-[12px] font-semibold text-[#2A55D4] hover:text-[#1e47b4] sm:text-[14px]"
        >
          View Products under Promotion →
        </a>
      </div>
    </section>
  )
}

export default MarketingHero
