import type { DiscountCreateTool, DiscountToolType } from './types'

type DiscountCreateSectionProps = {
  tools: DiscountCreateTool[]
  onCreateTool?: (type: DiscountToolType) => void
}

function DiscountToolIcon({ type }: { type: DiscountToolType }) {
  if (type === 'discount-promotions') {
    return (
      <>
        <path d="M11.5 3.5 5 10l7.5 7.5L19 11V3.5h-7.5Z" />
        <circle cx="14.5" cy="7.7" r="0.8" fill="currentColor" stroke="none" />
      </>
    )
  }

  if (type === 'bundle-deal') {
    return (
      <>
        <path d="M3.5 8.5 12 4l8.5 4.5L12 13 3.5 8.5Z" />
        <path d="M3.5 8.5v7L12 20l8.5-4.5v-7" />
        <path d="M12 13v7" />
      </>
    )
  }

  return (
    <>
      <path d="M7 9.5h10v8.75a1.75 1.75 0 0 1-1.75 1.75h-6.5A1.75 1.75 0 0 1 7 18.25V9.5Z" />
      <path d="M9.5 9.5V8a2.5 2.5 0 0 1 5 0v1.5" />
      <path d="M5 13h4m-2-2v4" />
    </>
  )
}

function DiscountCreateSection({
  tools,
  onCreateTool,
}: DiscountCreateSectionProps) {
  return (
    <article className="rounded-2xl border border-[#dbeafe] bg-white p-4 shadow-[0_14px_30px_-28px_rgba(37,99,235,0.8)] sm:p-5">
      <header>
        <h2 className="text-2xl font-semibold text-[#1E40AF]">Create Discount</h2>
        <p className="mt-1.5 text-sm text-[#1d4ed8]">
          Create discounts for your Unleash shop to boost sales and improve conversion
          rate.
        </p>
      </header>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {tools.map((tool) => (
          <article
            key={tool.title}
            className="rounded-xl border border-[#dbeafe] bg-[#f8fbff] p-4 shadow-[0_10px_25px_-22px_rgba(30,64,175,0.8)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#bfdbfe] bg-[#eff6ff] text-[#2563EB]">
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <DiscountToolIcon type={tool.type} />
                </svg>
              </div>
              <button
                type="button"
                onClick={() => onCreateTool?.(tool.type)}
                className="inline-flex h-8 items-center rounded-md bg-[#2563EB] px-3 text-xs font-semibold text-white transition hover:bg-[#1d4ed8]"
              >
                Create
              </button>
            </div>

            <h3 className="mt-3 text-base font-semibold text-slate-900">{tool.title}</h3>
            <p className="mt-1 text-sm leading-snug text-slate-600">{tool.description}</p>
          </article>
        ))}
      </div>
    </article>
  )
}

export default DiscountCreateSection
