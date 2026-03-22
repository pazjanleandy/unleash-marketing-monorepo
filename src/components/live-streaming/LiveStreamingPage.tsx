import { useEffect, useMemo, useState } from 'react'
import ProductPickerModal from '../discount/create/ProductPickerModal'
import { listShopProducts, type ShopProduct } from '../../services/market/products.repo'

type LiveStreamingPageProps = {
  onBack: () => void
}

const highlightOptions = [
  'No Highlight',
  'New Arrival',
  'Limited Offer',
  'Best Seller',
  'Low Stock',
]

function toPeso(value: number) {
  return `PHP ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function CoverPreview({
  title,
  highlight,
}: {
  title: string
  highlight: string
}) {
  return (
    <div className="relative aspect-square w-full max-w-[150px] overflow-hidden border border-[#D6E3FB] bg-[linear-gradient(160deg,#18366E_0%,#2A4DBD_38%,#4E79E5_100%)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.28),transparent_42%)]" />
      <div className="absolute inset-x-0 top-0 h-10 bg-[linear-gradient(180deg,rgba(255,255,255,0.14),transparent)]" />
      <div className="absolute left-3 top-3 border border-white/30 bg-[#F07A2A] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
        Unleash Live
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-[linear-gradient(180deg,transparent,rgba(12,23,50,0.94))] px-3 pb-3 pt-10">
        <p className="line-clamp-2 text-sm font-semibold text-white">
          {title.trim() || 'Your next live event title'}
        </p>
        <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-white/70">
          {highlight !== 'No Highlight' ? highlight : 'No Highlight'}
        </p>
      </div>
    </div>
  )
}

function ControlDeskToolItem({
  label,
  description,
  count,
  onClick,
}: {
  label: string
  description: string
  count?: number
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-3 border-b border-slate-200 px-4 py-4 text-left transition last:border-b-0 hover:bg-white/70"
    >
      <span className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center border border-[#D6E3FB] bg-white text-[#2A4DBD]">
        {typeof count === 'number' ? (
          <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#F07A2A] px-1 text-[10px] font-semibold text-white">
            {count}
          </span>
        ) : null}
        {label === 'Products' ? (
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 6.5H16V15.5H4V6.5Z" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7 4.5H13L14 6.5H6L7 4.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4.5 13.5L7.5 10.5L10.5 12.5L15.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15.5 10V7.5H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-[#0C1732]">{label}</span>
          <span className="text-xs font-medium text-slate-400">Open</span>
        </span>
        <span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span>
      </span>
    </button>
  )
}

function ConnectionField({
  label,
  value,
  copied,
  masked,
  isVisible,
  onToggleVisibility,
  onCopy,
}: {
  label: string
  value: string
  copied: boolean
  masked?: boolean
  isVisible?: boolean
  onToggleVisibility?: () => void
  onCopy: () => void
}) {
  const displayValue =
    masked && !isVisible ? `${value.slice(0, 18)}${'•'.repeat(Math.max(8, value.length - 18))}` : value

  return (
    <div className="grid gap-3 border-b border-white/10 py-4 last:border-b-0 lg:grid-cols-[88px_minmax(0,1fr)_auto] lg:items-center">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">{label}</p>
      </div>
      <div className="flex min-w-0 items-center gap-2 border border-white/10 bg-white/[0.04] px-3 py-3">
        <code className="min-w-0 flex-1 truncate text-[13px] text-white/86">{displayValue}</code>
        {masked ? (
          <button
            type="button"
            onClick={onToggleVisibility}
            className="inline-flex h-8 items-center justify-center border border-white/10 px-3 text-xs font-semibold text-white/75 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
          >
            {isVisible ? 'Hide' : 'Reveal'}
          </button>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onCopy}
        className="inline-flex h-11 items-center justify-center border border-[#F07A2A] bg-[#F07A2A] px-4 text-sm font-semibold text-white transition hover:bg-[#de6422]"
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}

function TelemetryStat({
  label,
  value,
  note,
}: {
  label: string
  value: string
  note: string
}) {
  return (
    <div className="border-b border-slate-200 px-4 py-5 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0 lg:px-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="text-[34px] font-semibold tracking-[-0.04em] text-[#0C1732]">{value}</p>
        <p className="text-xs text-slate-400">{note}</p>
      </div>
    </div>
  )
}

function MobileLiveDeskHeader() {
  return (
    <div className="border-b border-slate-200 px-4 py-4 md:hidden">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold tracking-[-0.03em] text-[#0C1732]">Live Control Desk</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Preview your stream, manage sharing, and keep launch controls within reach.
          </p>
        </div>
        <span className="inline-flex items-center border border-[#D6E3FB] bg-[#F8FAFF] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#2A4DBD]">
          Ready
        </span>
      </div>

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <button
          type="button"
          className="inline-flex h-11 items-center justify-center border border-[#2A4DBD] bg-[#2A4DBD] px-4 text-sm font-semibold text-white transition hover:bg-[#203f9c]"
        >
          Go Live
        </button>
        <button
          type="button"
          className="inline-flex h-11 items-center justify-center border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Share Link
        </button>
      </div>

      <button
        type="button"
        className="mt-3 inline-flex items-center justify-center text-sm font-semibold text-slate-500 transition hover:text-[#0C1732]"
      >
        Notify Followers
      </button>
    </div>
  )
}

function MobileLivePreview({
  streamTitle,
  highlight,
  streamingType,
  selectedProductsCount,
}: {
  streamTitle: string
  highlight: string
  streamingType: 'normal' | 'test'
  selectedProductsCount: number
}) {
  return (
    <div className="border-b border-slate-200 bg-[#071226] text-white md:hidden">
      <div className="relative overflow-hidden px-4 py-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(80,132,255,0.24),transparent_38%),linear-gradient(180deg,rgba(7,18,38,0.35),rgba(7,18,38,0.72))]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:28px_28px] opacity-40" />

        <div className="relative">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="inline-flex items-center gap-2 border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
                <span className="h-2 w-2 bg-emerald-300" />
                Preview Idle
              </span>
              <span className="truncate text-xs font-medium text-white/58">
                {streamingType === 'test' ? 'Test stream' : 'Live session'}
              </span>
            </div>
            <button
              type="button"
              className="inline-flex h-8 items-center justify-center border border-white/10 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/68 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
            >
              Refresh
            </button>
          </div>

          <div className="flex min-h-[300px] flex-col items-center justify-center px-2 text-center">
            <div className="flex h-16 w-16 items-center justify-center border border-white/10 bg-white/[0.05]">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 7.5C4 6.67157 4.67157 6 5.5 6H13.5C14.3284 6 15 6.67157 15 7.5V16.5C15 17.3284 14.3284 18 13.5 18H5.5C4.67157 18 4 17.3284 4 16.5V7.5Z" stroke="currentColor" strokeWidth="1.5" className="text-white/82" />
                <path d="M15 10L20 7V17L15 14V10Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" className="text-[#8FB1FF]" />
              </svg>
            </div>
            <p className="mt-5 text-[24px] font-semibold tracking-[-0.04em] text-white">
              Waiting for stream signal
            </p>
            <p className="mt-3 max-w-[280px] text-sm leading-6 text-white/62">
              Connect your encoder to start preview. Video appears here when live input is detected.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-0 border-t border-white/10">
            {[
              { label: 'Signal', value: 'No input' },
              { label: 'Products', value: `${selectedProductsCount}` },
              { label: 'Mode', value: streamingType === 'test' ? 'Test' : 'Ready' },
            ].map((item) => (
              <div key={item.label} className="border-r border-white/10 px-3 py-3 last:border-r-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/42">{item.label}</p>
                <p className="mt-2 text-sm font-semibold text-white/88">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 text-xs text-white/52">
            <span className="truncate">{streamTitle.trim() || 'Untitled Unleash Live Session'}</span>
            <span>{highlight !== 'No Highlight' ? highlight : 'Ready for launch'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function MobileLiveTools({
  selectedProductsCount,
  onOpenProducts,
}: {
  selectedProductsCount: number
  onOpenProducts: () => void
}) {
  return (
    <div className="border-b border-slate-200 px-4 py-4 md:hidden">
      <div>
        <p className="text-sm font-semibold text-[#0C1732]">Live tools</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">Keep merchandising actions close to the preview.</p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onOpenProducts}
          className="flex items-center gap-3 border border-[#D6E3FB] bg-[#F8FAFF] px-3 py-3 text-left"
        >
          <span className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center border border-[#D6E3FB] bg-white text-[#2A4DBD]">
            <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center bg-[#F07A2A] px-1 text-[10px] font-semibold text-white">
              {selectedProductsCount}
            </span>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 6.5H16V15.5H4V6.5Z" stroke="currentColor" strokeWidth="1.5" />
              <path d="M7 4.5H13L14 6.5H6L7 4.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-[#0C1732]">Products</span>
            <span className="mt-1 block text-xs leading-5 text-slate-500">Open live product picker</span>
          </span>
        </button>

        <button
          type="button"
          className="flex items-center gap-3 border border-slate-200 bg-white px-3 py-3 text-left"
        >
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-slate-200 bg-slate-50 text-[#2A4DBD]">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4.5 13.5L7.5 10.5L10.5 12.5L15.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M15.5 10V7.5H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-[#0C1732]">Promotion</span>
            <span className="mt-1 block text-xs leading-5 text-slate-500">Keep offers ready for launch</span>
          </span>
        </button>
      </div>
    </div>
  )
}

function MobileConnectionRow({
  label,
  value,
  copied,
  masked,
  isVisible,
  onToggleVisibility,
  onCopy,
}: {
  label: string
  value: string
  copied: boolean
  masked?: boolean
  isVisible?: boolean
  onToggleVisibility?: () => void
  onCopy: () => void
}) {
  const displayValue =
    masked && !isVisible ? `${value.slice(0, 18)}${'*'.repeat(Math.max(8, value.length - 18))}` : value

  return (
    <div className="border-b border-slate-200 py-4 last:border-b-0">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
        {masked ? (
          <button
            type="button"
            onClick={onToggleVisibility}
            className="text-xs font-semibold text-[#2A4DBD]"
          >
            {isVisible ? 'Hide' : 'Reveal'}
          </button>
        ) : null}
      </div>
      <code className="mt-3 block break-all bg-[#F8FAFF] px-3 py-3 text-[13px] text-[#0C1732]">
        {displayValue}
      </code>
      <button
        type="button"
        onClick={onCopy}
        className="mt-3 inline-flex h-10 items-center justify-center border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}

function MobileStreamConnection({
  streamUrl,
  streamKey,
  copiedField,
  isStreamKeyVisible,
  onToggleStreamKeyVisibility,
  onCopyUrl,
  onCopyKey,
}: {
  streamUrl: string
  streamKey: string
  copiedField: 'url' | 'key' | null
  isStreamKeyVisible: boolean
  onToggleStreamKeyVisibility: () => void
  onCopyUrl: () => void
  onCopyKey: () => void
}) {
  return (
    <div className="border-b border-slate-200 px-4 py-4 md:hidden">
      <div>
        <p className="text-sm font-semibold text-[#0C1732]">Stream connection</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Use these credentials in your encoder to start the preview.
        </p>
      </div>

      <div className="mt-3">
        <MobileConnectionRow
          label="Stream URL"
          value={streamUrl}
          copied={copiedField === 'url'}
          onCopy={onCopyUrl}
        />
        <MobileConnectionRow
          label="Stream Key"
          value={streamKey}
          copied={copiedField === 'key'}
          masked
          isVisible={isStreamKeyVisible}
          onToggleVisibility={onToggleStreamKeyVisibility}
          onCopy={onCopyKey}
        />
      </div>
    </div>
  )
}

function MobileLiveMetrics() {
  return (
    <div className="border-b border-slate-200 px-4 py-4 md:hidden">
      <p className="text-sm font-semibold text-[#0C1732]">Live telemetry</p>
      <div className="mt-3 grid grid-cols-3 divide-x divide-slate-200 border-y border-slate-200">
        {[
          { label: 'Viewers', value: '0' },
          { label: 'Likes', value: '0' },
          { label: 'Shares', value: '0' },
        ].map((item) => (
          <div key={item.label} className="px-3 py-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{item.label}</p>
            <p className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-[#0C1732]">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function MobileCommentsSection() {
  return (
    <div className="px-4 py-4 md:hidden">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#0C1732]">Comments</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Viewer messages appear here once the stream is live.
          </p>
        </div>
        <span className="inline-flex items-center border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          Idle
        </span>
      </div>

      <div className="mt-4 border-t border-slate-200 pt-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-slate-200 bg-slate-50 text-slate-400">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 8.5H17M7 12H14M8 18L4 20V6.5C4 5.67157 4.67157 5 5.5 5H18.5C19.3284 5 20 5.67157 20 6.5V15.5C20 16.3284 19.3284 17 18.5 17H8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#0C1732]">No live comments yet</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Keep your host script ready so product questions and promo prompts can be answered quickly once chat opens.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function SelectedStreamProduct({ product }: { product: ShopProduct }) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-200 py-3 last:border-b-0">
      {product.image ? (
        <img src={product.image} alt={product.name} className="h-12 w-12 object-cover" />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center border border-[#D6E3FB] bg-[#F3F6FE] text-sm font-semibold text-[#2A4DBD]">
          {product.name.slice(0, 1).toUpperCase()}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[#0C1732]">{product.name}</p>
        <p className="mt-1 text-xs text-slate-500">{product.category}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-[#0C1732]">{toPeso(product.price)}</p>
        <p className="mt-1 text-xs text-slate-500">Stock {product.stock}</p>
      </div>
    </div>
  )
}

function LiveStreamingPage({ onBack }: LiveStreamingPageProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'control'>('details')
  const [streamTitle, setStreamTitle] = useState('')
  const [description, setDescription] = useState('')
  const [highlight, setHighlight] = useState('No Highlight')
  const [streamingType, setStreamingType] = useState<'normal' | 'test'>('normal')
  const [copiedField, setCopiedField] = useState<'url' | 'key' | null>(null)
  const [isStreamKeyVisible, setIsStreamKeyVisible] = useState(false)
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [catalogItems, setCatalogItems] = useState<ShopProduct[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [productsError, setProductsError] = useState('')
  const [productsAuthRequired, setProductsAuthRequired] = useState(false)
  const [productsNoShop, setProductsNoShop] = useState(false)

  useEffect(() => {
    let active = true

    const loadProducts = async () => {
      setIsLoadingProducts(true)
      setProductsError('')

      try {
        const result = await listShopProducts()
        if (!active) {
          return
        }

        setCatalogItems(result.items)
        setProductsAuthRequired(result.authRequired)
        setProductsNoShop(result.noShop)
      } catch (error) {
        if (!active) {
          return
        }

        setCatalogItems([])
        setProductsAuthRequired(false)
        setProductsNoShop(false)
        setProductsError(error instanceof Error ? error.message : 'Unable to load products.')
      } finally {
        if (active) {
          setIsLoadingProducts(false)
        }
      }
    }

    void loadProducts()

    return () => {
      active = false
    }
  }, [])

  const selectedProducts = useMemo(
    () => catalogItems.filter((product) => selectedProductIds.includes(product.id)),
    [catalogItems, selectedProductIds],
  )

  const inputClassName =
    'h-12 w-full border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#BFD3F8] focus:bg-[#FBFCFF]'
  const streamUrl = 'rtmp://push.live.unleash.ph/live/'
  const streamKey = 'unleash-live-2551136278449695-107333082'

  const handleCopyField = async (field: 'url' | 'key', value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedField(field)
      window.setTimeout(() => {
        setCopiedField((current) => (current === field ? null : current))
      }, 1600)
    } catch {
      setCopiedField(null)
    }
  }

  return (
    <section
      className="motion-rise overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_20px_46px_-34px_rgba(15,23,42,0.45)]"
      style={{ animationDelay: '80ms' }}
    >
      <div className="border-b border-slate-200 bg-[linear-gradient(135deg,rgba(247,250,255,0.96),rgba(255,255,255,0.98)_58%,rgba(245,248,255,0.9))] px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2A4DBD]">
              Live Commerce
            </p>
            <h1 className="mt-2 text-[30px] font-semibold tracking-[-0.03em] text-[#0C1732] sm:text-[36px]">
              Create Streaming
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-[15px]">
              Prepare your next Unleash live session, attach products, and review the control desk before you go live.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex h-11 items-center justify-center border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Back to Marketing Centre
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('control')}
              className="inline-flex h-11 items-center justify-center border border-[#2A4DBD] bg-[#2A4DBD] px-5 text-sm font-semibold text-white shadow-[0_16px_28px_-18px_rgba(42,77,189,0.75)] transition hover:bg-[#203f9c]"
            >
              Go Live Setup
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 sm:px-6 lg:px-8">
        <div className="border-b border-slate-200 bg-[#FFF9EC] px-4 py-3 text-sm text-[#8C6414]">
          Announcement: recorded live content must follow the latest marketplace governance rules.
        </div>

        <div className="flex gap-6 border-b border-slate-200 pt-6">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`border-b-2 pb-3 text-sm font-semibold transition ${
              activeTab === 'details'
                ? 'border-[#2A4DBD] text-[#2A4DBD]'
                : 'border-transparent text-slate-500 hover:text-[#0C1732]'
            }`}
          >
            Streaming Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('control')}
            className={`border-b-2 pb-3 text-sm font-semibold transition ${
              activeTab === 'control'
                ? 'border-[#2A4DBD] text-[#2A4DBD]'
                : 'border-transparent text-slate-500 hover:text-[#0C1732]'
            }`}
          >
            Live Control Desk
          </button>
        </div>

        <div className="pt-6">
          {activeTab === 'details' ? (
            <section className="overflow-hidden border border-slate-200">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-4 sm:px-5">
              <p className="text-[22px] font-semibold tracking-[-0.03em] text-[#0C1732]">Streaming Details</p>
              <p className="mt-1 text-sm text-slate-500">
                Set the public-facing title, message, and product lineup for this live event.
              </p>
            </div>

            <div className="divide-y divide-slate-200">
              <div className="grid gap-4 px-4 py-5 sm:px-5 lg:grid-cols-[160px_minmax(0,1fr)]">
                <div>
                  <p className="text-sm font-semibold text-[#0C1732]">Cover Image</p>
                </div>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <CoverPreview title={streamTitle} highlight={highlight} />
                  <div className="max-w-md">
                    <button
                      type="button"
                      className="inline-flex h-11 items-center justify-center border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Upload Cover
                    </button>
                    <p className="mt-3 text-sm text-slate-500">
                      Recommended ratio is 1:1. Keep the main title readable in a small thumbnail.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 px-4 py-5 sm:px-5 lg:grid-cols-[160px_minmax(0,1fr)]">
                <div>
                  <p className="text-sm font-semibold text-[#0C1732]">Title</p>
                </div>
                <div>
                  <input
                    type="text"
                    value={streamTitle}
                    onChange={(event) => setStreamTitle(event.target.value.slice(0, 60))}
                    placeholder="Enter your live title"
                    className={inputClassName}
                  />
                  <p className="mt-2 text-sm text-slate-500">
                    Keep it direct and easy to scan. Aim for a short operational title.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 px-4 py-5 sm:px-5 lg:grid-cols-[160px_minmax(0,1fr)]">
                <div>
                  <p className="text-sm font-semibold text-[#0C1732]">Description</p>
                </div>
                <div>
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value.slice(0, 200))}
                    placeholder="Add a short description for this stream"
                    className="min-h-[120px] w-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#BFD3F8] focus:bg-[#FBFCFF]"
                  />
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <p className="text-sm text-slate-500">Use this to set context before shoppers enter the stream.</p>
                    <span className="text-xs font-medium text-slate-400">{description.length}/200</span>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 px-4 py-5 sm:px-5 lg:grid-cols-[160px_minmax(0,1fr)]">
                <div>
                  <p className="text-sm font-semibold text-[#0C1732]">Highlight</p>
                </div>
                <div>
                  <select
                    value={highlight}
                    onChange={(event) => setHighlight(event.target.value)}
                    className={inputClassName}
                  >
                    {highlightOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                  <p className="mt-2 text-sm text-slate-500">
                    This tag appears on the streaming cover and helps frame the offer quickly.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 px-4 py-5 sm:px-5 lg:grid-cols-[160px_minmax(0,1fr)]">
                <div>
                  <p className="text-sm font-semibold text-[#0C1732]">Related Products</p>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => setIsPickerOpen(true)}
                    className="inline-flex h-12 items-center justify-center gap-2 border border-[#BFD3F8] bg-[#F8FAFF] px-4 text-sm font-semibold text-[#2A4DBD] transition hover:bg-[#EEF4FF]"
                  >
                    <span className="text-base leading-none">+</span>
                    Add Related Products ({selectedProductIds.length}/500)
                  </button>
                  <p className="mt-2 text-sm text-slate-500">
                    Add products for the stream. The existing add-product modal opens here.
                  </p>

                  {selectedProducts.length > 0 ? (
                    <div className="mt-4 border-t border-slate-200">
                      {selectedProducts.slice(0, 4).map((product) => (
                        <SelectedStreamProduct key={product.id} product={product} />
                      ))}
                      {selectedProducts.length > 4 ? (
                        <p className="pt-3 text-sm text-slate-500">
                          +{selectedProducts.length - 4} more products attached
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 px-4 py-5 sm:px-5 lg:grid-cols-[160px_minmax(0,1fr)]">
                <div>
                  <p className="text-sm font-semibold text-[#0C1732]">Streaming Type</p>
                </div>
                <div className="flex flex-wrap gap-4">
                  {([
                    { id: 'normal', label: 'Normal' },
                    { id: 'test', label: 'Test' },
                  ] as const).map((option) => {
                    const isActive = streamingType === option.id

                    return (
                      <label key={option.id} className={`inline-flex items-center gap-3 border px-4 py-3 text-sm transition ${isActive ? 'border-[#BFD3F8] bg-[#F8FAFF]' : 'border-slate-200 bg-white'}`}>
                        <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full border ${isActive ? 'border-[#2A4DBD]' : 'border-slate-300'}`}>
                          {isActive ? <span className="h-2 w-2 rounded-full bg-[#2A4DBD]" /> : null}
                        </span>
                        <span className="font-semibold text-[#0C1732]">{option.label}</span>
                        <input
                          type="radio"
                          name="stream-type"
                          checked={isActive}
                          onChange={() => setStreamingType(option.id)}
                          className="sr-only"
                        />
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>
            </section>
          ) : (
            <section className="overflow-hidden border border-slate-200">
            <MobileLiveDeskHeader />
            <MobileLivePreview
              streamTitle={streamTitle}
              highlight={highlight}
              streamingType={streamingType}
              selectedProductsCount={selectedProducts.length}
            />
            <MobileLiveTools
              selectedProductsCount={selectedProducts.length}
              onOpenProducts={() => setIsPickerOpen(true)}
            />
            <MobileStreamConnection
              streamUrl={streamUrl}
              streamKey={streamKey}
              copiedField={copiedField}
              isStreamKeyVisible={isStreamKeyVisible}
              onToggleStreamKeyVisibility={() => setIsStreamKeyVisible((current) => !current)}
              onCopyUrl={() => void handleCopyField('url', streamUrl)}
              onCopyKey={() => void handleCopyField('key', streamKey)}
            />
            <MobileLiveMetrics />
            <MobileCommentsSection />

            <div className="hidden md:block">
            <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div>
                <p className="text-[22px] font-semibold tracking-[-0.03em] text-[#0C1732]">Live Control Desk</p>
                <p className="mt-1 text-sm text-slate-500">
                  A staging view for stream keys, pinned products, and operational monitoring.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button type="button" className="inline-flex h-10 items-center justify-center border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                  Share Link
                </button>
                <button type="button" className="inline-flex h-10 items-center justify-center border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                  Notify Followers
                </button>
                <button type="button" className="inline-flex h-10 items-center justify-center border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                  Back
                </button>
                <button type="button" className="inline-flex h-10 items-center justify-center border border-[#2A4DBD] bg-[#2A4DBD] px-4 text-sm font-semibold text-white transition hover:bg-[#203f9c]">
                  Go Live
                </button>
              </div>
            </div>

            <div className="grid gap-0 xl:grid-cols-[220px_minmax(0,1fr)_280px]">
              <aside className="border-b border-slate-200 bg-[linear-gradient(180deg,#FBFCFF_0%,#F6F9FF_100%)] xl:border-b-0 xl:border-r">
                <div className="border-b border-slate-200 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2A4DBD]">
                    Selling Tools
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#0C1732]">Stream utilities</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Keep products and promos close to the preview while you prepare to go live.
                  </p>
                </div>
                <ControlDeskToolItem
                  label="Products"
                  description={selectedProducts.length > 0 ? `${selectedProducts.length} items pinned for live selling.` : 'Attach products that can be highlighted during the stream.'}
                  count={selectedProductIds.length}
                  onClick={() => setIsPickerOpen(true)}
                />
                <ControlDeskToolItem
                  label="Promotion"
                  description="Keep launch offers and promo hooks within reach as you prepare the stream."
                />
                <div className="px-4 py-4">
                  <div className="border border-[#D6E3FB] bg-white px-3 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Session Mode
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[#0C1732]">
                      {streamingType === 'test' ? 'Test broadcast' : 'Normal broadcast'}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {streamingType === 'test'
                        ? 'Use this session to validate your setup before opening the stream to shoppers.'
                        : 'Audience-facing live session with share and notify actions ready to use.'}
                    </p>
                  </div>
                </div>
              </aside>

              <div className="border-b border-slate-200 bg-[#071226] text-white xl:border-b-0 xl:border-r">
                <div className="relative overflow-hidden border-b border-white/10">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(80,132,255,0.24),transparent_36%),linear-gradient(180deg,rgba(8,16,34,0.2),rgba(8,16,34,0.65))]" />
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:32px_32px] opacity-35" />
                  <div className="relative min-h-[420px] px-5 py-5 sm:px-6">
                    <div className="flex flex-col gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="inline-flex items-center gap-2 border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
                          <span className="h-2 w-2 bg-emerald-300" />
                          Preview Idle
                        </span>
                        <span className="text-sm font-medium text-white/70">
                          {streamTitle.trim() || 'Untitled Unleash Live Session'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-white/50">
                        <span>RTMP</span>
                        <span>1080p target</span>
                        <span>4.5 Mbps guide</span>
                        <button
                          type="button"
                          className="inline-flex h-9 items-center justify-center border border-white/10 px-3 text-xs font-semibold text-white/75 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
                        >
                          Refresh Preview
                        </button>
                      </div>
                    </div>

                    <div className="flex min-h-[290px] flex-col items-center justify-center text-center">
                      <div className="flex h-20 w-20 items-center justify-center border border-white/10 bg-white/[0.05]">
                        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M4 7.5C4 6.67157 4.67157 6 5.5 6H13.5C14.3284 6 15 6.67157 15 7.5V16.5C15 17.3284 14.3284 18 13.5 18H5.5C4.67157 18 4 17.3284 4 16.5V7.5Z" stroke="currentColor" strokeWidth="1.5" className="text-white/80" />
                          <path d="M15 10L20 7V17L15 14V10Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" className="text-[#8FB1FF]" />
                        </svg>
                      </div>
                      <p className="mt-6 text-[26px] font-semibold tracking-[-0.04em] text-white">
                        Waiting for stream input
                      </p>
                      <p className="mt-3 max-w-md text-sm leading-6 text-white/62">
                        Connect your encoder with the stream URL and key below. Preview will appear here as soon as Unleash detects a signal.
                      </p>
                    </div>

                    <div className="flex flex-col gap-4 border-t border-white/10 pt-4 lg:flex-row lg:items-end lg:justify-between">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">
                          Session Snapshot
                        </p>
                        <p className="mt-2 text-sm font-semibold text-white/88">
                          {highlight !== 'No Highlight' ? highlight : 'Ready for launch'}
                        </p>
                        <p className="mt-1 text-sm text-white/55">
                          {selectedProducts.length} pinned product{selectedProducts.length === 1 ? '' : 's'} ready for live merchandising.
                        </p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {[
                          { label: 'Signal', value: 'No input' },
                          { label: 'Chat', value: 'Standby' },
                          { label: 'Storefront', value: streamingType === 'test' ? 'Test mode' : 'Ready' },
                        ].map((item) => (
                          <div key={item.label} className="min-w-[120px] border border-white/10 bg-white/[0.04] px-3 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
                              {item.label}
                            </p>
                            <p className="mt-2 text-sm font-semibold text-white/88">{item.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#0B1834] px-5 py-5 sm:px-6">
                  <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8FB1FF]">
                        Stream Connection
                      </p>
                      <p className="mt-2 text-lg font-semibold text-white">Encoder credentials</p>
                      <p className="mt-1 text-sm text-white/58">
                        Use these values in OBS, vMix, or your preferred broadcast software to start the preview.
                      </p>
                    </div>
                    <p className="text-xs text-white/40">
                      Rotate credentials after the stream if the session is shared.
                    </p>
                  </div>

                  <div className="mt-4">
                    <ConnectionField
                      label="Stream URL"
                      value={streamUrl}
                      copied={copiedField === 'url'}
                      onCopy={() => void handleCopyField('url', streamUrl)}
                    />
                    <ConnectionField
                      label="Stream Key"
                      value={streamKey}
                      copied={copiedField === 'key'}
                      masked
                      isVisible={isStreamKeyVisible}
                      onToggleVisibility={() => setIsStreamKeyVisible((current) => !current)}
                      onCopy={() => void handleCopyField('key', streamKey)}
                    />
                  </div>
                </div>
              </div>

              <aside className="bg-[linear-gradient(180deg,#ffffff_0%,#fbfcff_100%)]">
                <div className="border-b border-slate-200 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#0C1732]">Comments</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        This rail becomes your live shopper conversation once the stream starts.
                      </p>
                    </div>
                    <span className="inline-flex items-center border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Idle
                    </span>
                  </div>
                </div>
                <div className="flex min-h-[420px] flex-col">
                  <div className="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Real-time interaction
                  </div>
                  <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
                    <div className="flex h-16 w-16 items-center justify-center border border-slate-200 bg-white text-slate-400">
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7 8.5H17M7 12H14M8 18L4 20V6.5C4 5.67157 4.67157 5 5.5 5H18.5C19.3284 5 20 5.67157 20 6.5V15.5C20 16.3284 19.3284 17 18.5 17H8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <p className="mt-5 text-base font-semibold text-[#0C1732]">No live comments yet</p>
                    <p className="mt-2 max-w-[220px] text-sm leading-6 text-slate-500">
                      Viewer messages will land here once the preview becomes an active live session.
                    </p>
                  </div>
                  <div className="border-t border-slate-200 px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Moderation note
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Prepare your host script and promo callouts so incoming questions can be answered quickly on air.
                    </p>
                  </div>
                </div>
              </aside>
            </div>

            <div className="grid border-t border-slate-200 md:grid-cols-3">
              <TelemetryStat label="Viewers" value="0" note="peak 0" />
              <TelemetryStat label="Likes" value="0" note="engagement idle" />
              <TelemetryStat label="Shares" value="0" note="not yet live" />
            </div>
            </div>
            </section>
          )}
        </div>
      </div>

      <ProductPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        title="Add Products to Stream"
        subtitle="Choose products to pin during your Unleash live session."
        catalogItems={catalogItems}
        isLoading={isLoadingProducts}
        loadError={productsError}
        isAuthRequired={productsAuthRequired}
        hasNoShop={productsNoShop}
        onRetry={() => {
          setCatalogItems([])
          setProductsError('')
          setIsLoadingProducts(true)
          void listShopProducts()
            .then((result) => {
              setCatalogItems(result.items)
              setProductsAuthRequired(result.authRequired)
              setProductsNoShop(result.noShop)
            })
            .catch((error) => {
              setProductsError(error instanceof Error ? error.message : 'Unable to load products.')
            })
            .finally(() => {
              setIsLoadingProducts(false)
            })
        }}
        selectedProductIds={selectedProductIds}
        onConfirmSelection={(nextSelection) => {
          setSelectedProductIds(nextSelection)
          setIsPickerOpen(false)
        }}
      />
    </section>
  )
}

export default LiveStreamingPage
