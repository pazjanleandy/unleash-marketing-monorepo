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
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className={`font-bold tracking-tight ${isPrimaryGroup ? 'text-[28px] text-slate-800' : 'text-[24px] text-slate-800'}`}>
            {section.title}
          </h3>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-3 lg:grid-cols-3">
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
