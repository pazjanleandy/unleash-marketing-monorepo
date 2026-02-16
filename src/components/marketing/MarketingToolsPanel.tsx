import ToolSectionBlock from './ToolSectionBlock'
import type { ToolCard, ToolSection } from './types'

type MarketingToolsPanelProps = {
  sections: ToolSection[]
  onToolSelect?: (tool: ToolCard) => void
}

function MarketingToolsPanel({ sections, onToolSelect }: MarketingToolsPanelProps) {
  return (
    <section
      className="motion-rise mt-6 rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-[0_24px_50px_-45px_rgba(15,23,42,0.65)] sm:p-8"
      style={{ animationDelay: '120ms' }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-slate-900">Marketing Tools</h2>
        <a
          href="#"
          className="group inline-flex items-center gap-2 text-sm font-medium text-[#2f70db] transition hover:text-[#1f57b7]"
        >
          View Products under Promotion
          <span
            aria-hidden="true"
            className="inline-block transition group-hover:translate-x-0.5"
          >
            -&gt;
          </span>
        </a>
      </div>

      <div className="mt-8 space-y-9">
        {sections.map((section, sectionIndex) => (
          <ToolSectionBlock
            key={section.title}
            section={section}
            sectionIndex={sectionIndex}
            onToolSelect={onToolSelect}
          />
        ))}
      </div>
    </section>
  )
}

export default MarketingToolsPanel
