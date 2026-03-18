import ToolSectionBlock from './ToolSectionBlock'
import ToolCardItem from './ToolCardItem'
import type { ToolCard, ToolSection } from './types'

type MarketingToolsPanelProps = {
  sections: ToolSection[]
  onToolSelect?: (tool: ToolCard) => void
  isMobile?: boolean
}

function MarketingToolsPanel({ sections, onToolSelect, isMobile = false }: MarketingToolsPanelProps) {
  if (isMobile) {
    const allTools = sections.flatMap((section) => section.tools)
    const recommendedTools = allTools.filter(
      (tool) => tool.id === 'discount' || tool.id === 'flash-deals' || tool.id === 'vouchers',
    )

    return (
      <section className="space-y-4">
        <div className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-[0_10px_26px_-24px_rgba(12,23,50,0.12)]">
          <div className="mb-3 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
            <span>Recommended for Unleash</span>
            <a href="#" className="text-[#2A55D4] hover:text-[#1e47b4] font-semibold">
              See all
            </a>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {recommendedTools.map((tool, index) => (
              <ToolCardItem
                key={`rec-${tool.title}-${index}`}
                tool={tool}
                animationDelay="0ms"
                onToolSelect={onToolSelect}
                compact
              />
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-[0_10px_26px_-24px_rgba(12,23,50,0.12)]">
          <div className="mb-3 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
            <span>All Marketing Tools</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {allTools.map((tool, index) => (
              <ToolCardItem
                key={`all-${tool.title}-${index}`}
                tool={tool}
                animationDelay="0ms"
                onToolSelect={onToolSelect}
                compact
              />
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      className="motion-rise pt-2"
      style={{ animationDelay: '120ms' }}
    >
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <p className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Campaign Library
          </p>
          <h2 className="text-[32px] font-bold text-slate-800 tracking-tight">Marketing Tools</h2>
          <p className="mt-2 text-[15px] font-medium text-slate-600">
            Manage promotion, growth, and engagement campaigns from one workspace.
          </p>
        </div>
        <a
          href="#"
          className="group inline-flex w-fit items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 ring-1 ring-inset ring-blue-600/20 transition hover:bg-blue-100 hover:text-blue-800"
        >
          View products under promotion
          <span
            aria-hidden="true"
            className="inline-block transition-transform duration-300 group-hover:translate-x-1"
          >
            →
          </span>
        </a>
      </div>

      <div className="mt-4 rounded-[22px] border border-slate-100 bg-white p-5 shadow-[0_14px_38px_-30px_rgba(12,23,50,0.18)] sm:p-7">
        {sections.map((section, sectionIndex) => (
          <div
            key={section.title}
            className={sectionIndex === sections.length - 1 ? '' : 'mb-8 pb-8'}
          >
            <ToolSectionBlock
              section={section}
              sectionIndex={sectionIndex}
              onToolSelect={onToolSelect}
            />
          </div>
        ))}
      </div>
    </section>
  )
}

export default MarketingToolsPanel
