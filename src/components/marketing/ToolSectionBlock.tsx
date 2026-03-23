import ToolCardItem from './ToolCardItem'
import type { ToolCard, ToolSection } from './types'

type ToolSectionBlockProps = {
  section: ToolSection
  sectionIndex: number
  onToolSelect?: (tool: ToolCard) => void
}

function ToolSectionBlock({
  section,
  sectionIndex,
  onToolSelect,
}: ToolSectionBlockProps) {
  const isPrimaryGroup = section.title === 'Promotion Tools'

  return (
    <div
      className={
        isPrimaryGroup
          ? 'rounded-[20px] border border-[#e3ebfb] bg-[linear-gradient(180deg,rgba(248,251,255,0.96)_0%,rgba(255,255,255,0.98)_100%)] p-4 sm:p-5'
          : ''
      }
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-[18px] font-semibold tracking-[-0.01em] text-slate-800 sm:text-[19px]">
            {section.title}
          </h3>
          {section.description ? (
            <p className="mt-1 text-sm text-slate-500">
              {section.description}
            </p>
          ) : null}
        </div>
      </div>
      <div className={`grid grid-cols-3 gap-3 sm:grid-cols-3 lg:grid-cols-3 ${isPrimaryGroup ? 'mt-5' : 'mt-4'}`}>
        {section.tools.map((tool, toolIndex) => (
          <ToolCardItem
            key={tool.title}
            tool={tool}
            animationDelay={`${180 + sectionIndex * 130 + toolIndex * 45}ms`}
            onToolSelect={onToolSelect}
          />
        ))}
      </div>
    </div>
  )
}

export default ToolSectionBlock
