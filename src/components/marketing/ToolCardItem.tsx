import { toneClasses } from './data'
import IconMark from './IconMark'
import type { ToolCard } from './types'

type ToolCardItemProps = {
  tool: ToolCard
  animationDelay: string
  onToolSelect?: (tool: ToolCard) => void
}

function ToolCardItem({ tool, animationDelay, onToolSelect }: ToolCardItemProps) {
  const tone = toneClasses[tool.tone]
  const isClickable = tool.id === 'vouchers' && typeof onToolSelect === 'function'
  const cardClassName =
    'motion-rise rounded-2xl border border-slate-200 bg-[#f8fafd]/80 p-4 text-left transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-[0_16px_34px_-30px_rgba(15,23,42,0.8)]'

  const cardContent = (
    <div className="flex items-start gap-3 text-left">
      <div
        className={`mt-0.5 flex h-12 w-12 flex-none items-center justify-center rounded-full ring-1 ${tone}`}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <IconMark name={tool.icon} />
        </svg>
      </div>
      <div className="min-w-0 text-left">
        <h4 className="text-lg font-semibold leading-tight text-slate-900">
          {tool.title}
        </h4>
        <p className="mt-1 text-sm leading-snug text-slate-600">
          {tool.description}
        </p>
      </div>
    </div>
  )

  return (
    <article
      className={`${cardClassName} group ${isClickable ? 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f70db] focus-visible:ring-offset-2' : ''}`}
      style={{ animationDelay }}
      onClick={isClickable ? () => onToolSelect?.(tool) : undefined}
      onKeyDown={
        isClickable
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onToolSelect?.(tool)
              }
            }
          : undefined
      }
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      {cardContent}
    </article>
  )
}

export default ToolCardItem
