import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import type { MarketCentreView } from '../pages/marketCentre'

type SidebarView = MarketCentreView

interface SidebarProps {
  activeView?: SidebarView
  onSelectView?: (view: SidebarView) => void
  collapsed?: boolean
  onToggleCollapsed?: () => void
  mobileMode?: boolean
  mobileOpen?: boolean
  onCloseMobile?: () => void
  onLogout?: () => Promise<void> | void
}

interface NavItemProps {
  collapsed: boolean
  label: string
  icon: ReactNode
  active?: boolean
  onClick?: () => void
  rightSlot?: ReactNode
  ariaExpanded?: boolean
  mobileMode?: boolean
  section?: boolean
}

const marketingViews: Set<SidebarView> = new Set([
  'marketing',
  'ads',
  'live-streaming',
  'create-search-ads',
  'create-discovery-ads',
  'discount',
  'flash-deals',
  'create-flash-deal',
  'create-discount-promotion',
  'create-bundle-deal',
  'create-add-on-deal',
  'view-discount-promotion',
  'view-bundle-deal',
  'view-add-on-deal',
  'vouchers',
  'create-voucher',
])

const orderViews: Set<SidebarView> = new Set([
  'orders-all',
  'orders-pending',
  'orders-completed',
])

const productViews: Set<SidebarView> = new Set([
  'inventory',
  'add-product',
  'categories',
])

function NavItem({
  collapsed,
  label,
  icon,
  active = false,
  onClick,
  rightSlot,
  ariaExpanded,
  mobileMode = false,
  section = false,
}: NavItemProps) {
  const isMobileActivePage = mobileMode && active && !section
  const isMobileExpandedSection = mobileMode && section && ariaExpanded
  const buttonStateClasses = mobileMode
    ? isMobileActivePage
      ? 'border-l-4 border-blue-600 bg-blue-50 font-semibold text-[#1d4ed8]'
      : isMobileExpandedSection
        ? 'bg-slate-100 text-slate-700'
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
    : active
      ? 'bg-[#E8F0FE] text-[#1e40af]'
      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
  const iconStateClasses = mobileMode
    ? isMobileActivePage
      ? 'bg-white shadow-sm'
      : isMobileExpandedSection
        ? 'bg-white'
        : 'bg-slate-100'
    : active
      ? 'bg-white shadow-sm'
      : 'bg-slate-100'

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onClick}
        aria-expanded={ariaExpanded}
        className={`flex w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium transition ${
          mobileMode ? 'min-h-12 py-2.5' : 'py-3'
        } ${buttonStateClasses} ${isMobileActivePage ? 'pl-2' : ''} ${
          collapsed ? 'justify-center' : 'justify-between'
        }`}
      >
        <span className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <span
            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${iconStateClasses}`}
          >
            {icon}
          </span>
          {!collapsed ? <span>{label}</span> : null}
        </span>
        {!collapsed ? rightSlot : null}
      </button>
      {collapsed ? (
        <span className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-20 -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition group-hover:opacity-100">
          {label}
        </span>
      ) : null}
    </div>
  )
}

function Sidebar({
  activeView = 'dashboard',
  onSelectView,
  collapsed = false,
  onToggleCollapsed,
  mobileMode = false,
  mobileOpen = false,
  onCloseMobile,
  onLogout,
}: SidebarProps) {
  const navigate = useNavigate()
  const mobileCloseButtonRef = useRef<HTMLButtonElement>(null)
  const firstAccountActionRef = useRef<HTMLButtonElement>(null)
  const [marketingOpen, setMarketingOpen] = useState(true)
  const [ordersOpen, setOrdersOpen] = useState(true)
  const [productsOpen, setProductsOpen] = useState(false)
  const [isAccountSheetOpen, setIsAccountSheetOpen] = useState(false)

  const isMarketingCentre = marketingViews.has(activeView)
  const isOrderActive = orderViews.has(activeView)
  const isProductActive = productViews.has(activeView)
  const marketingQuickLinks: Array<{
    label: string
    view: SidebarView
    active: boolean
  }> = [
    { label: 'Marketing Home', view: 'marketing', active: activeView === 'marketing' },
    {
      label: 'Unleash Ads',
      view: 'ads',
      active:
        activeView === 'ads' ||
        activeView === 'create-search-ads' ||
        activeView === 'create-discovery-ads',
    },
    {
      label: 'Live Streaming',
      view: 'live-streaming',
      active: activeView === 'live-streaming',
    },
    {
      label: 'Discount',
      view: 'discount',
      active:
        activeView === 'discount' ||
        activeView === 'create-discount-promotion' ||
        activeView === 'create-bundle-deal' ||
        activeView === 'create-add-on-deal' ||
        activeView === 'view-discount-promotion' ||
        activeView === 'view-bundle-deal' ||
        activeView === 'view-add-on-deal',
    },
    {
      label: 'Flash Deals',
      view: 'flash-deals',
      active: activeView === 'flash-deals' || activeView === 'create-flash-deal',
    },
    {
      label: 'Vouchers',
      view: 'vouchers',
      active: activeView === 'vouchers' || activeView === 'create-voucher',
    },
  ]

  const handleViewChange = (view: SidebarView) => {
    if (onSelectView) {
      onSelectView(view)
    }
  }

  const closeAccountSheet = () => {
    setIsAccountSheetOpen(false)
  }

  const handleProfileOpen = () => {
    setIsAccountSheetOpen(true)
  }

  const handleViewProfile = () => {
    handleViewChange('dashboard')
    closeAccountSheet()
  }

  const handleSettings = () => {
    closeAccountSheet()
  }

  const handleLogout = async () => {
    const confirmed = window.confirm('Are you sure you want to log out?')

    if (!confirmed) {
      return
    }

    closeAccountSheet()
    onCloseMobile?.()
    if (onLogout) {
      await onLogout()
    } else {
      navigate('/', { replace: true })
    }
  }

  useEffect(() => {
    if (!mobileMode || !mobileOpen) {
      return
    }

    mobileCloseButtonRef.current?.focus()
  }, [mobileMode, mobileOpen])

  useEffect(() => {
    if (mobileMode && mobileOpen) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setIsAccountSheetOpen(false)
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [mobileMode, mobileOpen])

  useEffect(() => {
    if (!mobileMode || !isAccountSheetOpen) {
      return
    }

    firstAccountActionRef.current?.focus()
  }, [mobileMode, isAccountSheetOpen])

  useEffect(() => {
    if (!mobileMode || !isAccountSheetOpen) {
      return
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      closeAccountSheet()
    }

    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow

    window.addEventListener('keydown', handleEscape, true)
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleEscape, true)
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousHtmlOverflow
    }
  }, [mobileMode, isAccountSheetOpen])

  return (
    <aside
      role={mobileMode ? 'dialog' : undefined}
      aria-modal={mobileMode ? true : undefined}
      aria-label="Sidebar navigation"
      className={`relative h-full bg-white py-4 transition-all duration-300 ${
        mobileMode
          ? 'border-r border-slate-200/80 px-4'
          : `rounded-2xl border border-slate-200/80 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.55)] ${
              collapsed ? 'px-3' : 'px-4'
            }`
      }`}
    >
      <div
        className={`flex items-center justify-between ${
          mobileMode ? 'mb-3 border-b border-slate-200 pb-3' : 'mb-4'
        }`}
      >
        <div className={`flex items-center ${collapsed ? 'justify-center w-full' : 'gap-2'}`}>
          {collapsed ? (
            <button
              type="button"
              aria-label="Expand sidebar"
              onClick={onToggleCollapsed}
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-white"
            >
              <img
                src="/Asset/unleash_logo.png"
                alt="Unleash logo"
                className="h-8 w-8 object-contain"
              />
            </button>
          ) : (
            <>
              <img
                src="/unleash_banner.png"
                alt="Unleash"
                className="h-7 w-auto object-contain"
              />
              <span className="rounded-full bg-[#1f4db8] px-3 py-1 text-xs font-semibold text-white">
                Merchant
              </span>
            </>
          )}
        </div>
        {mobileMode ? (
          <button
            ref={mobileCloseButtonRef}
            type="button"
            aria-label="Close sidebar"
            onClick={onCloseMobile}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 md:hidden"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 6L18 18M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        ) : !collapsed ? (
          <button
            type="button"
            aria-label="Collapse sidebar"
            onClick={onToggleCollapsed}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
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
        ) : null}
      </div>

      <div className="flex h-[calc(100%-3.5rem)] min-h-0 flex-col">
        <nav
          className={`space-y-1 ${
            mobileMode ? 'min-h-0 flex-1 overflow-y-auto pr-1' : ''
          }`}
        >
          <NavItem
            collapsed={collapsed}
            mobileMode={mobileMode}
            label="Dashboard"
            active={activeView === 'dashboard'}
            onClick={() => handleViewChange('dashboard')}
            icon={
              <svg
                width="18"
                height="18"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3 3H9V9H3V3ZM11 3H17V9H11V3ZM3 11H9V17H3V11ZM11 11H17V17H11V11Z"
                  fill={activeView === 'dashboard' ? '#1e40af' : '#94a3b8'}
                />
              </svg>
            }
          />

          <NavItem
            collapsed={collapsed}
            mobileMode={mobileMode}
            section
            label="Order Management"
            active={isOrderActive}
            onClick={() => {
              if (collapsed) {
                handleViewChange('orders-all')
                return
              }

              setOrdersOpen((prev) => !prev)
            }}
            ariaExpanded={ordersOpen}
            rightSlot={
              <span className={`${ordersOpen ? 'rotate-90' : ''} text-slate-400 transition`}>
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
            }
            icon={
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7 17C5.343 17 4 18.343 4 20C4 21.657 5.343 23 7 23C8.657 23 10 21.657 10 20C10 18.343 8.657 17 7 17ZM17 17C15.343 17 14 18.343 14 20C14 21.657 15.343 23 17 23C18.657 23 20 21.657 20 20C20 18.343 18.657 17 17 17Z"
                  fill={isOrderActive ? '#1e40af' : '#94a3b8'}
                />
                <path
                  d="M6 6H22L20 14H8L6 6Z"
                  stroke={isOrderActive ? '#1e40af' : '#94a3b8'}
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path
                  d="M6 6L4 2H1"
                  stroke={isOrderActive ? '#1e40af' : '#94a3b8'}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            }
          />
          {!collapsed && ordersOpen ? (
            <div className={`${mobileMode ? 'space-y-1 pl-8' : 'space-y-1 pl-12'}`}>
              {[
                { label: 'All Orders', view: 'orders-all' as SidebarView },
                { label: 'Pending', view: 'orders-pending' as SidebarView },
                { label: 'Completed', view: 'orders-completed' as SidebarView },
              ].map((item) => (
                <button
                  key={item.view}
                  type="button"
                  onClick={() => handleViewChange(item.view)}
                  className={`block w-full text-left transition ${
                    mobileMode
                      ? `min-h-12 rounded-lg px-3 py-2.5 text-[13px] ${
                          activeView === item.view
                            ? 'border-l-4 border-blue-600 bg-blue-50 pl-2 font-semibold text-[#1d4ed8]'
                            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                        }`
                      : `rounded-xl px-3 py-2 text-sm ${
                          activeView === item.view
                            ? 'bg-[#E8F0FE] text-[#1e40af]'
                            : 'text-slate-500 hover:bg-slate-100'
                        }`
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ) : null}

          <NavItem
            collapsed={collapsed}
            mobileMode={mobileMode}
            section
            label="Product Management"
            active={isProductActive}
            onClick={() => {
              if (collapsed) {
                handleViewChange('inventory')
                return
              }

              setProductsOpen((prev) => !prev)
            }}
            ariaExpanded={productsOpen}
            rightSlot={
              <span className={`${productsOpen ? 'rotate-90' : ''} text-slate-400 transition`}>
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
            }
            icon={
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 20H20V4H4V20Z"
                  stroke={isProductActive ? '#1e40af' : '#94a3b8'}
                  strokeWidth="1.8"
                />
                <path
                  d="M8 4V20M16 4V20M4 8H20M4 16H20"
                  stroke={isProductActive ? '#1e40af' : '#94a3b8'}
                  strokeWidth="1.2"
                />
              </svg>
            }
          />
          {!collapsed && productsOpen ? (
            <div className={`${mobileMode ? 'space-y-1 pl-8' : 'space-y-1 pl-12'}`}>
              {[
                { label: 'Inventory', view: 'inventory' as SidebarView },
                { label: 'Add Product', view: 'add-product' as SidebarView },
                { label: 'Categories', view: 'categories' as SidebarView },
              ].map((item) => (
                <button
                  key={item.view}
                  type="button"
                  onClick={() => handleViewChange(item.view)}
                  className={`block w-full text-left transition ${
                    mobileMode
                      ? `min-h-12 rounded-lg px-3 py-2.5 text-[13px] ${
                          activeView === item.view
                            ? 'border-l-4 border-blue-600 bg-blue-50 pl-2 font-semibold text-[#1d4ed8]'
                            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                        }`
                      : `rounded-xl px-3 py-2 text-sm ${
                          activeView === item.view
                            ? 'bg-[#E8F0FE] text-[#1e40af]'
                            : 'text-slate-500 hover:bg-slate-100'
                        }`
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ) : null}

          <NavItem
            collapsed={collapsed}
            mobileMode={mobileMode}
            section
            label="Marketing Centre"
            active={isMarketingCentre}
            onClick={() => {
              if (collapsed) {
                handleViewChange('marketing')
                return
              }

              setMarketingOpen((prev) => !prev)
            }}
            ariaExpanded={marketingOpen}
            rightSlot={
              <span className={`${marketingOpen ? 'rotate-90' : ''} text-slate-400 transition`}>
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
            }
            icon={
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 10L12 5L20 10V19C20 20.1 19.1 21 18 21H6C4.9 21 4 20.1 4 19V10Z"
                  stroke={isMarketingCentre ? '#1e40af' : '#94a3b8'}
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 13H15M9 16H14"
                  stroke={isMarketingCentre ? '#1e40af' : '#94a3b8'}
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            }
          />
          {!collapsed && marketingOpen ? (
            <div className={`${mobileMode ? 'space-y-1 pl-8' : 'space-y-1 pl-12'}`}>
              {marketingQuickLinks.map((item) => (
                <button
                  key={item.view}
                  type="button"
                  onClick={() => handleViewChange(item.view)}
                  className={`block w-full text-left transition ${
                    mobileMode
                      ? `min-h-12 rounded-lg px-3 py-2.5 text-[13px] ${
                          item.active
                            ? 'border-l-4 border-blue-600 bg-blue-50 pl-2 font-semibold text-[#1d4ed8]'
                            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                        }`
                      : `rounded-xl px-3 py-2 text-sm ${
                          item.active
                            ? 'bg-[#E8F0FE] text-[#1e40af]'
                            : 'text-slate-500 hover:bg-slate-100'
                        }`
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ) : null}
        </nav>

        <div
          className={`space-y-3 ${
            mobileMode
              ? 'sticky bottom-0 mt-3 border-t border-slate-200/80 bg-white/95 pt-3 shadow-[0_-10px_18px_-16px_rgba(15,23,42,0.35)] backdrop-blur-sm'
              : 'mt-auto pt-3'
          }`}
        >
          {mobileMode ? (
            <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
              <button
                type="button"
                aria-label="Open profile"
                onClick={handleProfileOpen}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition active:bg-slate-100"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#1d4ed8] text-sm font-semibold text-white ring-4 ring-white shadow-[0_10px_22px_-16px_rgba(29,78,216,0.9)]">
                  A
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">Merchant Admin</p>
                  <p className="truncate text-xs text-slate-500">View profile</p>
                </div>
                <span className="ml-auto rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                  Admin
                </span>
              </button>

              <div className="mt-3 border-t border-slate-200/80 pt-3">
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50 active:bg-red-50"
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M14 7L9 12L14 17"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M9 12H20"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                      <path
                        d="M4 4H10V20H4"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => void handleLogout()}
              className={`w-full rounded-xl px-3 py-3 text-sm font-medium transition ${
                collapsed
                  ? 'inline-flex items-center justify-center text-slate-400 hover:bg-slate-100'
                  : 'flex items-center gap-3 text-slate-400 hover:bg-slate-100'
              }`}
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
              </span>
              {!collapsed ? <span>Logout</span> : null}
            </button>
          )}
        </div>
      </div>

      {mobileMode ? (
        <>
          <div
            className={`fixed inset-0 z-[60] bg-black/40 transition-opacity duration-300 md:hidden ${
              isAccountSheetOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
            onClick={closeAccountSheet}
            aria-hidden={!isAccountSheetOpen}
          />

          <div
            className={`fixed inset-x-0 bottom-0 z-[61] transition-transform duration-300 ease-out md:hidden ${
              isAccountSheetOpen
                ? 'translate-y-0 pointer-events-auto'
                : 'translate-y-full pointer-events-none'
            }`}
            aria-hidden={!isAccountSheetOpen}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Account actions"
              className="mx-3 mb-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-slate-200" />

              <button
                ref={firstAccountActionRef}
                type="button"
                onClick={handleViewProfile}
                className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 active:bg-slate-100"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                    <path
                      d="M4 22C4 18.6863 7.58172 16 12 16C16.4183 16 20 18.6863 20 22"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <span>View Profile</span>
              </button>

              <button
                type="button"
                onClick={handleSettings}
                className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 active:bg-slate-100"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 15.5C13.933 15.5 15.5 13.933 15.5 12C15.5 10.067 13.933 8.5 12 8.5C10.067 8.5 8.5 10.067 8.5 12C8.5 13.933 10.067 15.5 12 15.5Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                    <path
                      d="M19.4 15C19.266 15.3038 19.1947 15.6316 19.1947 15.9635C19.1947 16.2954 19.266 16.6232 19.4 16.927L20.2 18.7L18.7 20.2L16.927 19.4C16.6232 19.266 16.2954 19.1947 15.9635 19.1947C15.6316 19.1947 15.3038 19.266 15 19.4L13.227 20.2H10.773L9 19.4C8.69623 19.266 8.36844 19.1947 8.03652 19.1947C7.7046 19.1947 7.37681 19.266 7.073 19.4L5.3 20.2L3.8 18.7L4.6 16.927C4.734 16.6232 4.80529 16.2954 4.80529 15.9635C4.80529 15.6316 4.734 15.3038 4.6 15L3.8 13.227V10.773L4.6 9C4.734 8.69623 4.80529 8.36844 4.80529 8.03652C4.80529 7.7046 4.734 7.37681 4.6 7.073L3.8 5.3L5.3 3.8L7.073 4.6C7.37681 4.734 7.7046 4.80529 8.03652 4.80529C8.36844 4.80529 8.69623 4.734 9 4.6L10.773 3.8H13.227L15 4.6C15.3038 4.734 15.6316 4.80529 15.9635 4.80529C16.2954 4.80529 16.6232 4.734 16.927 4.6L18.7 3.8L20.2 5.3L19.4 7.073C19.266 7.37681 19.1947 7.7046 19.1947 8.03652C19.1947 8.36844 19.266 8.69623 19.4 9L20.2 10.773V13.227L19.4 15Z"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span>Settings</span>
              </button>

              <div className="my-2 h-px bg-slate-200/70" />

              <button
                type="button"
                onClick={() => void handleLogout()}
                className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50 active:bg-red-50"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M14 7L9 12L14 17"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9 12H20"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                    <path
                      d="M4 4H10V20H4"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </>
      ) : null}
    </aside>
  )
}

export default Sidebar
