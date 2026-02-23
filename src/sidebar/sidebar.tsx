import { useState, type ReactNode } from 'react'
import type { MarketCentreView } from '../pages/marketCentre'

type SidebarView = MarketCentreView

interface SidebarProps {
  activeView?: SidebarView
  onSelectView?: (view: SidebarView) => void
  collapsed?: boolean
  onToggleCollapsed?: () => void
}

interface NavItemProps {
  collapsed: boolean
  label: string
  icon: ReactNode
  active?: boolean
  onClick?: () => void
  rightSlot?: ReactNode
  ariaExpanded?: boolean
}

const marketingViews: Set<SidebarView> = new Set([
  'dashboard',
  'marketing',
  'discount',
  'flash-deals',
  'create-flash-deal',
  'create-discount-promotion',
  'view-discount-promotion',
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
}: NavItemProps) {
  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onClick}
        aria-expanded={ariaExpanded}
        className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
          active
            ? 'bg-[#E8F0FE] text-[#1e40af]'
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
        } ${collapsed ? 'justify-center' : 'justify-between'}`}
      >
        <span className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <span
            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${
              active ? 'bg-white shadow-sm' : 'bg-slate-100'
            }`}
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
}: SidebarProps) {
  const [ordersOpen, setOrdersOpen] = useState(true)
  const [productsOpen, setProductsOpen] = useState(false)

  const isMarketingCentre = marketingViews.has(activeView)
  const isOrderActive = orderViews.has(activeView)
  const isProductActive = productViews.has(activeView)

  const handleViewChange = (view: SidebarView) => {
    if (onSelectView) {
      onSelectView(view)
    }
  }

  return (
    <aside
      className={`relative h-full rounded-2xl border border-slate-200/80 bg-white py-4 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.55)] transition-all duration-300 ${
        collapsed ? 'px-3' : 'px-4'
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
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
        {!collapsed ? (
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

      <div className="flex h-[calc(100%-3.5rem)] flex-col">
        <nav className="space-y-1">
          <NavItem
            collapsed={collapsed}
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
            label="Order Management"
            active={isOrderActive}
            onClick={() => setOrdersOpen((prev) => !prev)}
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
            <div className="space-y-1 pl-12">
              {[
                { label: 'All Orders', view: 'orders-all' as SidebarView },
                { label: 'Pending', view: 'orders-pending' as SidebarView },
                { label: 'Completed', view: 'orders-completed' as SidebarView },
              ].map((item) => (
                <button
                  key={item.view}
                  type="button"
                  onClick={() => handleViewChange(item.view)}
                  className={`block w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                    activeView === item.view
                      ? 'bg-[#E8F0FE] text-[#1e40af]'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ) : null}

          <NavItem
            collapsed={collapsed}
            label="Product Management"
            active={isProductActive}
            onClick={() => setProductsOpen((prev) => !prev)}
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
            <div className="space-y-1 pl-12">
              {[
                { label: 'Inventory', view: 'inventory' as SidebarView },
                { label: 'Add Product', view: 'add-product' as SidebarView },
                { label: 'Categories', view: 'categories' as SidebarView },
              ].map((item) => (
                <button
                  key={item.view}
                  type="button"
                  onClick={() => handleViewChange(item.view)}
                  className={`block w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                    activeView === item.view
                      ? 'bg-[#E8F0FE] text-[#1e40af]'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ) : null}

          <NavItem
            collapsed={collapsed}
            label="Marketing Centre"
            active={isMarketingCentre}
            onClick={() => handleViewChange('marketing')}
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
        </nav>

        <div className="mt-auto space-y-3 pt-3">
          <button
            type="button"
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
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
