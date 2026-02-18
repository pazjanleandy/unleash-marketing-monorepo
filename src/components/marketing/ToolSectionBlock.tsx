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
  return (
    <div>
      <h3 className="text-xl font-semibold text-slate-800">{section.title}</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
