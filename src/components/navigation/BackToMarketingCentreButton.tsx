type BackToMarketingCentreButtonProps = {
  onClick: () => void
  className?: string
}

function BackToMarketingCentreButton({
  onClick,
  className = '',
}: BackToMarketingCentreButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 ${className}`.trim()}
    >
      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" className="text-slate-400">
        <path
          d="M12.5 4.5L7 10L12.5 15.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>Back to Marketing Centre</span>
    </button>
  )
}

export default BackToMarketingCentreButton
