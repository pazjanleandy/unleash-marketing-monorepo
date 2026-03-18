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
  
  const focusRingColor = tone.focusRing.split('ring-')[1]
  const cardClassName = compact
    ? `group relative flex h-full flex-col items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm transition-all duration-200 ${
        isClickable ? `cursor-pointer hover:-translate-y-0.5 hover:shadow-md hover:border-${focusRingColor?.split('-')[0]}-300 focus-visible:outline-none` : ''
      }`
    : `motion-rise group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all duration-300 ${
        isClickable ? `cursor-pointer hover:-translate-y-1 hover:shadow-md hover:border-${focusRingColor?.split('-')[0]}-300 focus-visible:outline-none` : ''
      }`

  const cardContent = (
    <>
      <div className={`flex w-full ${compact ? 'items-center justify-center mb-2' : 'items-start justify-between gap-3 mb-3'}`}>
        <div
          className={`flex ${compact ? 'h-12 w-12 rounded-full' : isPrimary ? 'h-12 w-12 rounded-2xl' : 'h-10 w-10 rounded-xl'} flex-none items-center justify-center ${tone.icon}`}
        >
          <svg
            viewBox="0 0 24 24"
            className={compact ? 'h-5 w-5' : 'h-5 w-5'}
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
        <h4 className={`${compact ? 'text-[13px] font-semibold' : isPrimary ? 'text-[22px]' : isTertiary ? 'text-[17px]' : 'text-[19px]'} leading-tight text-slate-800`}>
          {tool.title}
        </h4>
        {!compact && (
          <p
            className={`mt-1.5 leading-relaxed font-medium ${isTertiary ? 'text-[13px] text-slate-500' : 'text-[14px] text-slate-600'}`}
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
        <div className="mt-3 flex items-center justify-between w-full border-t border-slate-100 pt-3">
          <div className="flex flex-wrap items-center gap-2">
            {tool.badge && (
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] ${tone.badge}`}>
                {tool.badge}
              </span>
            )}
            {tool.status && (
              <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${tone.status}`}>
                {tool.status}
              </span>
            )}
          </div>
          <div className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold transition-transform duration-300 group-hover:translate-x-1">
            <span className={tone.action}>
              {tool.isOptional ? 'Explore' : hasActiveCampaigns ? 'Manage' : 'Create'}
            </span>
            <span aria-hidden="true" className="text-lg leading-none transition-transform group-hover:translate-x-1">-&gt;</span>
          </div>
        </div>
      )}
    </>
  )

  return (
    <article
      className={`${cardClassName} border-slate-200 ${
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
