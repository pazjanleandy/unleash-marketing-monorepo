import type { MarketCentreView } from '../pages/marketCentre'

type SidebarView = MarketCentreView

interface SidebarProps {
  activeView?: SidebarView
  onSelectView?: (view: SidebarView) => void
}

const marketingViews: Set<SidebarView> = new Set([
  'marketing',
  'discount',
  'flash-deals',
  'create-flash-deal',
  'create-discount-promotion',
  'view-discount-promotion',
  'vouchers',
  'create-voucher',
])

function Sidebar({ activeView = 'marketing', onSelectView }: SidebarProps) {
  const isMarketingCentre = marketingViews.has(activeView)
  const handleMarketingClick = () => {
    if (onSelectView) {
      onSelectView('marketing')
    }
  }

  return (
    <aside className="w-full max-w-[280px] rounded-[22px] border border-slate-200/80 bg-white px-5 pb-6 pt-5 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.55)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src="/unleash_banner.png"
            alt="Unleash"
            className="h-7 w-auto object-contain"
          />
          <span className="rounded-full bg-[#1f4db8] px-3 py-1 text-xs font-semibold text-white">
            Merchant
          </span>
        </div>
        <button
          type="button"
          aria-label="Open menu"
          className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100"
        >
          <svg
            width="18"
            height="14"
            viewBox="0 0 18 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="block"
          >
            <path
              d="M1 1H17M1 7H17M1 13H17"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      <nav className="mt-7 space-y-2 text-sm font-medium text-slate-500">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-xl bg-[#e7effb] px-4 py-3 text-[#1f4db8]"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm">
            <svg
              width="18"
              height="18"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 3H9V9H3V3ZM11 3H17V9H11V3ZM3 11H9V17H3V11ZM11 11H17V17H11V11Z"
                fill="#1f4db8"
              />
            </svg>
          </span>
          Dashboard
        </button>

        <button
          type="button"
          className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-slate-400 transition hover:bg-slate-50"
        >
          <span className="flex items-center gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7 17C5.343 17 4 18.343 4 20C4 21.657 5.343 23 7 23C8.657 23 10 21.657 10 20C10 18.343 8.657 17 7 17ZM17 17C15.343 17 14 18.343 14 20C14 21.657 15.343 23 17 23C18.657 23 20 21.657 20 20C20 18.343 18.657 17 17 17Z"
                  fill="#94a3b8"
                />
                <path
                  d="M6 6H22L20 14H8L6 6Z"
                  stroke="#94a3b8"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path
                  d="M6 6L4 2H1"
                  stroke="#94a3b8"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            Order Management
          </span>
          <span className="text-slate-300">
            <svg
              width="14"
              height="14"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7 4L13 10L7 16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>

        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-slate-400 transition hover:bg-slate-50"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 20H20V4H4V20Z"
                stroke="#94a3b8"
                strokeWidth="1.8"
              />
              <path
                d="M8 4V20M16 4V20M4 8H20M4 16H20"
                stroke="#94a3b8"
                strokeWidth="1.2"
              />
            </svg>
          </span>
          Product Management
        </button>

        <div className="rounded-xl">
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-slate-400 transition hover:bg-slate-50"
          >
            <span className="flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 21C17.523 21 22 16.523 22 11C22 5.477 17.523 1 12 1C6.477 1 2 5.477 2 11C2 16.523 6.477 21 12 21Z"
                    stroke="#94a3b8"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M9 10C9 8.343 10.343 7 12 7C13.657 7 15 8.343 15 10C15 12.5 12 14 12 14C12 14 9 12.5 9 10Z"
                    stroke="#94a3b8"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              Service Management
            </span>
            <span className="text-slate-300">
              <svg
                width="14"
                height="14"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7 4L13 10L7 16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </button>
          <button
            type="button"
            onClick={handleMarketingClick}
            aria-current={isMarketingCentre ? 'page' : undefined}
            className={`mt-2 flex w-full items-center justify-between rounded-xl px-4 py-3 transition ${
              isMarketingCentre
                ? 'bg-[#e7effb] text-[#1f4db8]'
                : 'text-slate-400 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-center gap-3">
              <span
                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${
                  isMarketingCentre ? 'bg-white shadow-sm' : 'bg-slate-100'
                }`}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4 10L12 5L20 10V19C20 20.1 19.1 21 18 21H6C4.9 21 4 20.1 4 19V10Z"
                    stroke={isMarketingCentre ? '#1f4db8' : '#94a3b8'}
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9 13H15M9 16H14"
                    stroke={isMarketingCentre ? '#1f4db8' : '#94a3b8'}
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              Marketing Centre
            </span>
            <span className={isMarketingCentre ? 'text-[#1f4db8]' : 'text-slate-300'}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7 4L13 10L7 16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </button>
        </div>
      </nav>

      <div className="mt-10 flex items-center justify-between rounded-2xl bg-[#f6f8fb] px-4 py-3 text-sm text-slate-400">
        <button type="button" className="flex items-center gap-2">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M14 7L9 12L14 17"
              stroke="#94a3b8"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M9 12H20"
              stroke="#94a3b8"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <path
              d="M4 4H10V20H4"
              stroke="#94a3b8"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
          Logout
        </button>
        <span className="text-slate-200">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 4C10.4 4 9 5.6 9 7.2C9 8.8 10.4 10.4 12 10.4C13.6 10.4 15 8.8 15 7.2C15 5.6 13.6 4 12 4Z"
              fill="#e2e8f0"
            />
            <path
              d="M5.5 11.5C4.1 11.5 3 12.6 3 14C3 15.4 4.1 16.5 5.5 16.5C6.9 16.5 8 15.4 8 14C8 12.6 6.9 11.5 5.5 11.5Z"
              fill="#e2e8f0"
            />
            <path
              d="M18.5 11.5C17.1 11.5 16 12.6 16 14C16 15.4 17.1 16.5 18.5 16.5C19.9 16.5 21 15.4 21 14C21 12.6 19.9 11.5 18.5 11.5Z"
              fill="#e2e8f0"
            />
            <path
              d="M7.2 19.2C6.4 18.4 6.7 17 7.8 16.5C9 16 10.5 15.5 12 15.5C13.5 15.5 15 16 16.2 16.5C17.3 17 17.6 18.4 16.8 19.2L16 20C15.5 20.5 14.8 20.8 14 20.8H10C9.2 20.8 8.5 20.5 8 20L7.2 19.2Z"
              fill="#e2e8f0"
            />
          </svg>
        </span>
      </div>
    </aside>
  )
}

export default Sidebar
