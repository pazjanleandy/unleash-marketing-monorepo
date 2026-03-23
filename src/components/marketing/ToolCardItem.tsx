import { toneClasses } from './data'
import IconMark from './IconMark'
import type { ToolCard } from './types'

type ToolCardItemProps = {
  tool: ToolCard
  animationDelay: string
  onToolSelect?: (tool: ToolCard) => void
  compact?: boolean
}

function ToolCardItem({ tool, animationDelay, onToolSelect, compact = false }: ToolCardItemProps) {
  const tone = toneClasses[tool.tone]
  const isClickable = Boolean(tool.id) && typeof onToolSelect === 'function'
  const isPrimary = tool.priority === 'primary'
  const isTertiary = tool.priority === 'tertiary'
  const hasActiveCampaigns =
    tool.hasActiveCampaigns ??
    ((tool.status?.toLowerCase().includes('active') ?? false) &&
      !(tool.status?.toLowerCase().includes('no active') ?? false))

  const cardClassName = compact
    ? `group relative flex h-full flex-col items-center justify-center overflow-hidden rounded-xl border border-slate-200/70 bg-white p-3 text-center transition-colors duration-200 ${
        isClickable ? 'cursor-pointer hover:bg-slate-50 focus-visible:outline-none' : ''
      }`
    : `motion-rise group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/70 bg-white/96 p-3.5 text-left transition-all duration-200 ${
        isClickable ? `cursor-pointer hover:-translate-y-0.5 focus-visible:outline-none ${tone.hoverTint}` : ''
      }`

  const cardContent = (
    <>
      <div className={`flex w-full ${compact ? 'mb-2 items-center justify-center' : 'mb-3 items-start justify-between gap-3'}`}>
        <div
          className={`flex ${compact ? 'h-12 w-12 rounded-full' : isPrimary ? 'h-11 w-11 rounded-2xl' : 'h-10 w-10 rounded-xl'} flex-none items-center justify-center ${tone.icon}`}
        >
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
            <IconMark name={tool.icon} />
          </svg>
        </div>
      </div>
      <div className={`flex flex-col flex-grow ${compact ? 'items-center text-center' : ''}`}>
        <h4 className={`${compact ? 'text-[13px] font-medium' : isPrimary ? 'text-[17px]' : isTertiary ? 'text-[15px]' : 'text-[15px]'} leading-tight font-medium text-slate-800`}>
          {tool.title}
        </h4>
        {!compact && (
          <p
            className={`mt-1.5 leading-relaxed ${isTertiary ? 'text-[12px] text-slate-500' : 'text-[13px] text-slate-500'}`}
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {tool.description}
          </p>
        )}
      </div>

      {!compact && (
        <div className="mt-3 flex w-full items-center justify-between border-t border-slate-100/80 pt-3">
          <div className="flex flex-wrap items-center gap-2">
            {tool.status ? (
              <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${tone.status}`}>
                {tool.status}
              </span>
            ) : null}
          </div>
          <div className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold transition-transform duration-300 group-hover:translate-x-0.5">
            <span className={tone.action}>
              {tool.isOptional ? 'Explore' : hasActiveCampaigns ? 'Manage' : 'Create'}
            </span>
            <span aria-hidden="true" className="text-sm leading-none transition-transform group-hover:translate-x-0.5">{'->'}</span>
          </div>
        </div>
      )}
    </>
  )

  return (
    <article
      className={`${cardClassName} ${
        isClickable ? `focus-visible:ring-2 ${tone.focusRing} focus-visible:ring-offset-2` : ''
      }`}
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
