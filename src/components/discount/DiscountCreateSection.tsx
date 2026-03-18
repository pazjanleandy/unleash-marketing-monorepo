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
    <article className="rounded-xl border border-slate-200 bg-white p-4">
      <header className="mb-3">
        <h2 className="text-xl font-semibold text-[#33458F]">Create Discount</h2>
        <p className="mt-1 text-sm text-slate-600">
          Launch discount campaigns quickly with the right promotion format.
        </p>
      </header>

      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {tools.map((tool) => (
          <article
            key={tool.title}
            className="rounded-lg border border-slate-200 bg-white p-3 transition hover:border-[#D0DBF7] hover:shadow-[0_10px_22px_-18px_rgba(51,69,143,0.32)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#D0DBF7] bg-[#F2F4FF] text-[#3A56C5]">
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
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
              {tool.metaTag ? (
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                  {tool.metaTag}
                </span>
              ) : null}
            </div>

            <div className="mt-2">
              <h3 className="text-[15px] font-semibold text-slate-900">{tool.title}</h3>
              <p className="mt-0.5 text-xs leading-snug text-slate-600">{tool.description}</p>
            </div>

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => onCreateTool?.(tool.type)}
                className="inline-flex h-8 items-center rounded-md bg-[#3A56C5] px-3 text-xs font-semibold text-white transition hover:bg-[#3347A8]"
              >
                Create
              </button>
            </div>
          </article>
        ))}
      </div>
    </article>
  )
}

export default DiscountCreateSection

