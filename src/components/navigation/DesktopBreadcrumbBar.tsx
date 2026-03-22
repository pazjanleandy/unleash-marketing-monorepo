type DesktopBreadcrumbItem = {
  label: string
  onClick?: () => void
}

function DesktopBreadcrumbBar({
  items,
  actionLabel,
  onAction,
}: {
  items: DesktopBreadcrumbItem[]
  actionLabel?: string
  onAction?: () => void
}) {
  if (items.length === 0) {
    return null
  }

  return (
    <section className="hidden md:flex md:items-center md:justify-between md:gap-4">
      <nav aria-label="Breadcrumb" className="min-w-0">
        <ol className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
          {items.map((item, index) => {
            const isLast = index === items.length - 1

            return (
              <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-2">
                {item.onClick && !isLast ? (
                  <button
                    type="button"
                    onClick={item.onClick}
                    className="truncate transition hover:text-slate-800"
                  >
                    {item.label}
                  </button>
                ) : (
                  <span className={`truncate ${isLast ? 'font-semibold text-slate-900' : ''}`}>{item.label}</span>
                )}
                {!isLast ? (
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" className="shrink-0 text-slate-300">
                    <path
                      d="M7 4L13 10L7 16"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : null}
              </li>
            )
          })}
        </ol>
      </nav>

      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
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
          <span>{actionLabel}</span>
        </button>
      ) : null}
    </section>
  )
}

export default DesktopBreadcrumbBar
