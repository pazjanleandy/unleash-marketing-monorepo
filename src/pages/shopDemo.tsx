import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getDemoShopId,
  listMarketplaceProducts,
  listActiveFlashDeals,
  listClaimableVouchers,
  listActiveBundles,
  listActiveAddonDeals,
  validateVoucher,
  simulateCheckout,
  resetDemoData,
  type MarketplaceProduct,
  type MarketplaceFlashDeal,
  type MarketplaceVoucher,
  type MarketplaceBundle,
  type MarketplaceAddonDeal,
  type CartItem,
  type CheckoutResult,
} from '../services/market/shopDemo.repo'
import { supabase } from '../supabase'

/* ------------------------------------------------------------------ */
/*  Utility helpers                                                    */
/* ------------------------------------------------------------------ */

function formatPrice(n: number) {
  return `\u20B1${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function discountPercent(original: number, sale: number) {
  if (original <= 0) return 0
  return Math.round(((original - sale) / original) * 100)
}

function computeDiscountedPrice(product: MarketplaceProduct): number {
  if (product.flashDeal) return product.flashDeal.flashPrice
  if (product.discount) {
    if (product.discount.discountType === 'percentage') {
      return product.price * (1 - product.discount.discountValue / 100)
    }
    return Math.max(product.price - product.discount.discountValue, 0)
  }
  return product.price
}

function computeAddonDiscountedPrice(price: number, discountType: 'percentage' | 'fixed', discountValue: number) {
  if (discountType === 'percentage') {
    return price * (1 - discountValue / 100)
  }
  return Math.max(price - discountValue, 0)
}

type AddonSuggestion = {
  dealId: string
  dealName: string
  shopId: string
  triggerProductId: string
  triggerProductName: string
  addonProductId: string
  addonProductName: string
  addonProductImage: string | null
  addonProductPrice: number
  discountedPrice: number
  discountLabel: string
  requiredQuantity: number
}

/* ------------------------------------------------------------------ */
/*  Countdown timer hook                                               */
/* ------------------------------------------------------------------ */

function useCountdown(endAt: string) {
  const calculate = useCallback(() => {
    const diff = Math.max(0, new Date(endAt).getTime() - Date.now())
    const h = Math.floor(diff / 3_600_000)
    const m = Math.floor((diff % 3_600_000) / 60_000)
    const s = Math.floor((diff % 60_000) / 1_000)
    return { h, m, s, expired: diff <= 0 }
  }, [endAt])

  const [time, setTime] = useState(calculate)

  useEffect(() => {
    const id = setInterval(() => setTime(calculate()), 1_000)
    return () => clearInterval(id)
  }, [calculate])

  return time
}

/* ------------------------------------------------------------------ */
/*  FlashDealCard                                                      */
/* ------------------------------------------------------------------ */

function FlashDealCard({
  deal,
  onAdd,
  variant = 'compact',
}: {
  deal: MarketplaceFlashDeal
  onAdd: (deal: MarketplaceFlashDeal) => void
  variant?: 'featured' | 'compact'
}) {
  const isFeatured = variant === 'featured'
  const { h, m, s, expired } = useCountdown(deal.endAt)
  const remaining = Math.max(deal.flashQuantity - deal.soldQuantity, 0)
  const pct = deal.flashQuantity > 0 ? (deal.soldQuantity / deal.flashQuantity) * 100 : 0
  const off = discountPercent(deal.originalPrice, deal.flashPrice)

  return (
    <div className={`flex h-full flex-col rounded-2xl bg-white p-3 shadow-[0_12px_26px_-22px_rgba(15,23,42,.4)] ring-1 ring-orange-100 ${isFeatured ? 'gap-3' : 'gap-2.5'}`}>
      <div className={`relative overflow-hidden rounded-xl bg-orange-50 ${isFeatured ? 'h-36' : 'h-28'}`}>
        {deal.productImage ? (
          <img src={deal.productImage} alt={deal.productName} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs font-semibold uppercase tracking-[0.2em] text-orange-300">
            Flash
          </div>
        )}
        {off > 0 && (
          <span className="absolute left-2 top-2 rounded-full bg-red-500 px-2 py-1 text-[10px] font-bold text-white">
            -{off}%
          </span>
        )}
        <span className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-mono text-white">
          {expired ? 'Ended' : `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className={`line-clamp-2 font-semibold leading-tight text-slate-900 ${isFeatured ? 'text-base' : 'text-sm'}`}>
            {deal.productName}
          </h4>
          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-700">Flash</span>
        </div>

        <div className="flex items-end gap-2">
          <span className="text-lg font-extrabold text-orange-600">{formatPrice(deal.flashPrice)}</span>
          <span className="pb-1 text-xs text-slate-400 line-through">{formatPrice(deal.originalPrice)}</span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>{deal.soldQuantity} sold</span>
          <span>{remaining} left</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-orange-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-400 to-red-500 transition-all duration-700"
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>

        <button
          onClick={() => onAdd(deal)}
          disabled={remaining <= 0 || expired}
          className="mt-auto h-9 w-full rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-xs font-semibold text-white shadow-[0_8px_18px_-10px_rgba(239,68,68,.6)] transition hover:brightness-110 active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {remaining <= 0 ? 'Sold Out' : expired ? 'Ended' : 'Add to Cart'}
        </button>
      </div>
    </div>
  )
}
/* ------------------------------------------------------------------ */
/*  ProductCard                                                        */
/* ------------------------------------------------------------------ */

function ProductCard({
  product,
  onAdd,
  isVoucherEligible,
  isBundleItem,
}: {
  product: MarketplaceProduct
  onAdd: (product: MarketplaceProduct) => void
  isVoucherEligible: boolean
  isBundleItem: boolean
}) {
  const discPrice = computeDiscountedPrice(product)
  const hasDiscount = discPrice < product.price
  const off = hasDiscount ? discountPercent(product.price, discPrice) : 0

  const promoTags: Array<{ label: string; tone: 'flash' | 'voucher' | 'bundle' | 'discount' }> = []
  if (product.flashDeal) promoTags.push({ label: 'Flash Deal', tone: 'flash' })
  if (isVoucherEligible) promoTags.push({ label: 'Voucher Eligible', tone: 'voucher' })
  if (isBundleItem) promoTags.push({ label: 'Bundle Item', tone: 'bundle' })
  if (hasDiscount) promoTags.push({ label: 'Discounted', tone: 'discount' })

  const discountLabel = product.discount
    ? product.discount.discountType === 'percentage'
      ? `${product.discount.discountValue}% OFF`
      : `${formatPrice(product.discount.discountValue)} OFF`
    : product.flashDeal && off > 0
      ? `${off}% OFF`
      : ''

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0_14px_30px_-26px_rgba(15,23,42,.4)] ring-1 ring-slate-200/70 transition hover:-translate-y-0.5 hover:ring-blue-200">
      <div className="relative h-36 w-full overflow-hidden bg-slate-100">
        {product.image ? (
          <img src={product.image} alt={product.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
            No Image
          </div>
        )}
        {promoTags[0] && (
          <span
            className={`absolute left-2 top-2 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
              promoTags[0].tone === 'flash'
                ? 'bg-orange-500 text-white'
                : promoTags[0].tone === 'voucher'
                  ? 'bg-indigo-100 text-indigo-700'
                  : promoTags[0].tone === 'bundle'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            {promoTags[0].label}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 px-3 pb-3 pt-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          {product.category} • {product.shopName}
        </p>
        <h4 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900">{product.name}</h4>

        <div className="space-y-1">
          <div className="flex items-end gap-2">
            <span className={`text-lg font-bold ${hasDiscount ? 'text-red-600' : 'text-slate-900'}`}>
              {formatPrice(discPrice)}
            </span>
            {hasDiscount && <span className="text-xs text-slate-400 line-through">{formatPrice(product.price)}</span>}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>{product.quantity > 0 ? `${product.quantity} in stock` : 'Out of stock'}</span>
            {discountLabel && <span className="text-red-500">{discountLabel}</span>}
          </div>
        </div>

        <button
          onClick={() => onAdd(product)}
          disabled={product.quantity <= 0}
          className="mt-auto h-10 w-full rounded-xl bg-blue-600 text-xs font-semibold text-white shadow-[0_8px_18px_-10px_rgba(37,99,235,.6)] transition hover:brightness-110 active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {product.quantity <= 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  )
}
/* ------------------------------------------------------------------ */
/*  BundleCard                                                         */
/* ------------------------------------------------------------------ */

function BundleCard({
  bundle,
  onAdd,
}: {
  bundle: MarketplaceBundle
  onAdd: (bundle: MarketplaceBundle) => void
}) {
  const originalTotal = bundle.items.reduce((s, i) => s + i.productPrice * i.quantity, 0)
  const bundlePrice = bundle.price ?? originalTotal
  const savings = Math.max(originalTotal - bundlePrice, 0)
  const itemCount = bundle.items.length
  const heroItem = bundle.items[0] ?? null
  const includedNames = bundle.items.slice(0, 2).map((item) => item.productName)
  const remainingIncludedCount = Math.max(bundle.items.length - includedNames.length, 0)
  const includedSummary =
    includedNames.length === 0
      ? 'Includes curated pet essentials.'
      : includedNames.length === 1
        ? `Includes ${includedNames[0]}.`
        : includedNames.length === 2
          ? `Includes ${includedNames[0]} and ${includedNames[1]}.`
          : `Includes ${includedNames[0]}, ${includedNames[1]}, and ${includedNames[2]}.`

  return (
    <div className="flex h-full flex-col gap-3 rounded-2xl bg-white p-3 shadow-[0_14px_30px_-26px_rgba(15,23,42,.4)] ring-1 ring-purple-100 transition hover:-translate-y-0.5 hover:ring-purple-200">
      {/* Header */}
      <div className="flex items-center gap-2 text-[11px] font-semibold text-purple-700">
        <span className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-purple-700">
          Bundle
        </span>
        <span className="text-slate-600">{itemCount > 0 ? `${itemCount} item${itemCount > 1 ? 's' : ''}` : 'Bundle'}</span>
      </div>

      {/* Body */}
      <div className="flex gap-3">
        <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
          {heroItem?.productImage ? (
            <img src={heroItem.productImage} alt={heroItem.productName} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
              Bundle
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{bundle.shopName}</p>
          <h4 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900">{bundle.name || 'Everyday Pet Essentials Bundle'}</h4>
          <p className="line-clamp-2 text-xs text-slate-500">{includedSummary}</p>

          <div className="flex flex-wrap gap-1 text-[11px] text-slate-600">
            {includedNames.map((name, index) => (
              <span key={`${bundle.id}-name-${index}`} className="max-w-[140px] truncate rounded-full bg-slate-100 px-2 py-0.5">
                {name}
              </span>
            ))}
            {remainingIncludedCount > 0 && (
              <span className="rounded-full bg-purple-50 px-2 py-0.5 font-semibold text-purple-700">+{remainingIncludedCount}</span>
            )}
          </div>
        </div>
      </div>

      {/* Price area */}
      <div className="space-y-1">
        <div className="flex flex-wrap items-baseline gap-2 text-slate-900">
          <span className="text-xl font-extrabold text-purple-700">{formatPrice(bundlePrice)}</span>
          <span className="text-xs text-slate-400 line-through">{formatPrice(originalTotal)}</span>
        </div>
        {savings > 0 && (
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
            Save {formatPrice(savings)}
          </span>
        )}
      </div>

      {/* CTA */}
      <button
        onClick={() => onAdd(bundle)}
        className="h-10 w-full rounded-lg bg-purple-600 text-xs font-semibold text-white shadow-[0_8px_18px_-10px_rgba(109,40,217,.5)] transition hover:brightness-110 active:scale-[.99]"
      >
        Add Bundle
      </button>
    </div>
  )
}

function VoucherAvailabilityHint({ voucherCount }: { voucherCount: number }) {
  const label =
    voucherCount > 0
      ? `${voucherCount} shop voucher${voucherCount > 1 ? 's' : ''} available at checkout`
      : 'No shop vouchers currently active'

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700">
      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold">
        i
      </span>
      <span>{label}</span>
    </div>
  )
}

function ShopPromotionsHeader({
  flashDealsCount,
  bundlesCount,
  vouchersCount,
}: {
  flashDealsCount: number
  bundlesCount: number
  vouchersCount: number
}) {
  return (
    <section className="mb-5 rounded-2xl bg-white/90 p-4 shadow-[0_12px_30px_-28px_rgba(15,23,42,.35)] ring-1 ring-slate-200/70">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Store promos</p>
          <h2 className="text-xl font-semibold text-slate-900">Shop Promotions</h2>
          <p className="text-xs text-slate-500">Fresh offers curated for this storefront.</p>
        </div>
        <VoucherAvailabilityHint voucherCount={vouchersCount} />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
          <span className="h-2 w-2 rounded-full bg-orange-400" />
          {flashDealsCount} Flash Deal{flashDealsCount === 1 ? '' : 's'}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
          <span className="h-2 w-2 rounded-full bg-purple-400" />
          {bundlesCount} Bundle{bundlesCount === 1 ? '' : 's'}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
          <span className="h-2 w-2 rounded-full bg-indigo-400" />
          {vouchersCount} Voucher{vouchersCount === 1 ? '' : 's'}
        </span>
      </div>
    </section>
  )
}
function FlashDealsSection({
  deals,
  onAdd,
}: {
  deals: MarketplaceFlashDeal[]
  onAdd: (deal: MarketplaceFlashDeal) => void
}) {
  const initialLimit = 4
  const [showAll, setShowAll] = useState(false)
  const visibleDeals = showAll ? deals : deals.slice(0, initialLimit)
  const canExpand = deals.length > initialLimit

  return (
    <section className="mb-8 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900">Flash Deals</h3>
        <button
          type="button"
          onClick={() => setShowAll((prev) => !prev)}
          disabled={!canExpand}
          className={`text-xs font-semibold transition ${canExpand ? 'text-orange-600' : 'text-slate-400'}`}
        >
          {showAll ? 'Show less' : canExpand ? `View all (${deals.length})` : 'All shown'}
        </button>
      </div>

      {deals.length === 0 ? (
        <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">No other flash deals right now.</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {visibleDeals.map((deal) => (
            <FlashDealCard key={deal.id} deal={deal} onAdd={onAdd} />
          ))}
        </div>
      )}
    </section>
  )
}

function BundleDealsSection({
  bundles,
  onAdd,
}: {
  bundles: MarketplaceBundle[]
  onAdd: (bundle: MarketplaceBundle) => void
}) {
  const initialLimit = 4
  const [showAll, setShowAll] = useState(false)
  const visibleBundles = showAll ? bundles : bundles.slice(0, initialLimit)
  const canExpand = bundles.length > initialLimit

  return (
    <section className="mb-8 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900">Bundle Deals</h3>
        <button
          type="button"
          onClick={() => setShowAll((prev) => !prev)}
          disabled={!canExpand}
          className={`text-xs font-semibold transition ${canExpand ? 'text-purple-700' : 'text-slate-400'}`}
        >
          {showAll ? 'Show less' : canExpand ? `View all (${bundles.length})` : 'All shown'}
        </button>
      </div>

      {bundles.length === 0 ? (
        <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">No bundle deals right now.</div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {visibleBundles.map((bundle) => (
            <BundleCard key={bundle.id} bundle={bundle} onAdd={onAdd} />
          ))}
        </div>
      )}
    </section>
  )
}


function ProductBrowseSection({
  title,
  subtitle,
  products,
  onAdd,
  voucherEligibleShopIds,
  bundleProductIds,
}: {
  title: string
  subtitle: string
  products: MarketplaceProduct[]
  onAdd: (product: MarketplaceProduct) => void
  voucherEligibleShopIds: Set<string>
  bundleProductIds: Set<string>
}) {
  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
          {products.length} items
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAdd={onAdd}
            isVoucherEligible={voucherEligibleShopIds.has(product.shopId)}
            isBundleItem={bundleProductIds.has(product.id)}
          />
        ))}
      </div>
    </section>
  )
}
/* ------------------------------------------------------------------ */
/*  CartDrawer                                                         */
/* ------------------------------------------------------------------ */

function CartDrawer({
  open,
  items,
  onClose,
  onUpdateQty,
  onRemove,
  onRemoveBundle,
  voucherDiscount,
  limitAlert,
  onClearAlert,
  getItemLimitState,
  onReviewCheckout,
  isCheckingOut,
}: {
  open: boolean
  items: CartItem[]
  onClose: () => void
  onUpdateQty: (item: CartItem, delta: number) => void
  onRemove: (item: CartItem) => void
  onRemoveBundle: (bundleId: string) => void
  voucherDiscount: number
  limitAlert: { type: 'limit' | 'stock'; message: string } | null
  onClearAlert: () => void
  getItemLimitState: (item: CartItem) => { canIncrease: boolean; message: string | null }
  onReviewCheckout: () => void
  isCheckingOut: boolean
}) {
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const discounts = items.reduce((s, i) => s + (i.originalPrice - i.price) * i.quantity, 0)
  const total = Math.max(subtotal - voucherDiscount, 0)

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-[60] bg-black/50 transition-opacity duration-300 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
      />
      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 z-[70] flex h-full w-full max-w-[440px] flex-col bg-slate-50 shadow-2xl transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur">
          <h3 className="text-lg font-bold text-slate-800">
            Shopping Cart <span className="text-sm font-normal text-slate-400">({items.length})</span>
          </h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 pb-36">
          {limitAlert && (
            <div
              className={`mb-3 flex items-start justify-between gap-3 rounded-xl border px-3 py-2 text-xs font-medium ${
                limitAlert.type === 'stock'
                  ? 'border-orange-200 bg-orange-50 text-orange-700'
                  : 'border-rose-200 bg-rose-50 text-rose-700'
              }`}
            >
              <span>{limitAlert.message}</span>
              <button
                type="button"
                onClick={onClearAlert}
                className="rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              >
                Dismiss
              </button>
            </div>
          )}
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path d="M6 6H22L20 14H8L6 6Z" stroke="currentColor" strokeWidth="1.5" />
                <path d="M6 6L4 2H1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="9" cy="20" r="1.5" fill="currentColor" />
                <circle cx="19" cy="20" r="1.5" fill="currentColor" />
              </svg>
              <p className="text-sm">Your cart is empty</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => {
                const limitState = getItemLimitState(item)
                const isBundleItem = Boolean(item.bundleId)
                const cartKey = item.bundleId
                  ? `${item.bundleId}-${item.productId}-${item.addonDealId ?? ''}`
                  : `${item.productId}-${item.flashDealId ?? ''}-${item.discountId ?? ''}-${item.addonDealId ?? ''}`
                return (
                  <div
                    key={cartKey}
                    className="flex gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_6px_18px_-12px_rgba(15,23,42,.35)]"
                  >
                  <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-slate-200">
                    {item.image ? (
                      <img src={item.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-lg">📦</div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <span className="text-sm font-medium text-slate-700 line-clamp-1">{item.name}</span>
                    {item.bundleId && (
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-purple-600">
                        Bundle Deal{item.bundleName ? `: ${item.bundleName}` : ''}
                      </span>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{formatPrice(item.price)}</span>
                      {item.originalPrice > item.price && (
                        <span className="text-xs text-slate-400 line-through">
                          {formatPrice(item.originalPrice)}
                        </span>
                      )}
                    </div>
                    {item.originalPrice > item.price && (
                      <span className="text-[11px] font-medium text-red-500">
                        Discount: {discountPercent(item.originalPrice, item.price)}% OFF
                      </span>
                    )}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onUpdateQty(item, -1)}
                        disabled={isBundleItem}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
                      >
                        −
                      </button>
                      <span className="w-7 text-center text-sm font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQty(item, 1)}
                        disabled={isBundleItem || !limitState.canIncrease}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
                      >
                        +
                      </button>
                      <button
                        onClick={() =>
                          item.bundleId ? onRemoveBundle(item.bundleId) : onRemove(item)
                        }
                        className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-lg border border-transparent text-slate-400 transition hover:border-red-100 hover:bg-red-50 hover:text-red-600"
                        aria-label="Remove item"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          <path d="M8 6V4H16V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          <path
                            d="M19 6L18 20H6L5 6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                    {limitState.message && (
                      <p className="text-[11px] font-medium text-rose-500">{limitState.message}</p>
                    )}
                  </div>
                </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-slate-200 bg-white/95 px-5 pb-4 pt-4 backdrop-blur">
            {/* Summary */}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {discounts > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Product Discounts</span>
                  <span>-{formatPrice(discounts)}</span>
                </div>
              )}
              {voucherDiscount > 0 && (
                <div className="flex justify-between text-blue-600">
                  <span>Voucher Discount</span>
                  <span>-{formatPrice(voucherDiscount)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {items.length > 0 && (
          <div className="sticky bottom-0 border-t border-slate-200 bg-white px-5 py-4 shadow-[0_-8px_24px_-16px_rgba(15,23,42,.4)]">
            <div className="mb-3 flex items-center justify-between text-base font-bold text-slate-900">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
            <button
              onClick={onReviewCheckout}
              disabled={isCheckingOut}
              className="h-12 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-[0_10px_28px_-10px_rgba(37,99,235,.7)] transition hover:brightness-110 active:scale-[.98] disabled:opacity-50"
            >
            {isCheckingOut ? 'Processing...' : `Checkout - ${formatPrice(total)}`}
          </button>
          </div>
        )}
      </div>
    </>
  )
}

function OrderDetailsModal({
  open,
  items,
  voucherDiscount,
  voucherCode,
  onVoucherCodeChange,
  onApplyVoucher,
  onRemoveVoucher,
  voucherMessage,
  isApplyingVoucher,
  appliedVoucherId,
  vouchers,
  shopLabel,
  onClose,
  onConfirm,
  isCheckingOut,
}: {
  open: boolean
  items: CartItem[]
  voucherDiscount: number
  voucherCode: string
  onVoucherCodeChange: (v: string) => void
  onApplyVoucher: (codeOverride?: string) => void
  onRemoveVoucher: () => void
  voucherMessage: string | null
  isApplyingVoucher: boolean
  appliedVoucherId: string | null
  vouchers: MarketplaceVoucher[]
  shopLabel: string | null
  onClose: () => void
  onConfirm: () => void
  isCheckingOut: boolean
}) {
  const [showVoucherModal, setShowVoucherModal] = useState(false)
  const [privateVoucherCode, setPrivateVoucherCode] = useState('')
  if (!open) return null

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const discounts = items.reduce((s, i) => s + (i.originalPrice - i.price) * i.quantity, 0)
  const total = Math.max(subtotal - voucherDiscount, 0)
  const cartShopIds = Array.from(new Set(items.map((item) => item.shopId).filter(Boolean)))
  const eligibleVouchers =
    items.length === 0 || cartShopIds.length !== 1
      ? []
      : vouchers.filter((v) => v.shopId === cartShopIds[0] && subtotal >= v.minSpend)
  const hasProductSavings = discounts > 0
  const hasVoucherSavings = voucherDiscount > 0
  const hasSavings = hasProductSavings || hasVoucherSavings

  return (
    <>
      <div className="fixed inset-0 z-[80] bg-black/50" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-[90] w-[92vw] max-w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3">
          <h3 className="text-base font-semibold text-slate-900">Order Details</h3>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="max-h-[65vh] overflow-y-auto px-4 pb-4">
          <div className="flex items-center justify-between rounded-lg bg-slate-50/80 px-3 py-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Shop</p>
              <p className="text-sm font-semibold text-slate-900">{shopLabel ?? 'Unknown Shop'}</p>
            </div>
          </div>

          <div className="mt-3 space-y-3">
            <div className="rounded-xl border border-slate-200/80 bg-white px-3 py-3">
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                Voucher
              </label>
              {/*
                Single action button: switches from "View" to "Remove" when a voucher is applied,
                so users don't see both actions at once.
              */}
              <div className="flex gap-2">
                <input
                  type="text"
                value={voucherCode}
                readOnly
                aria-readonly="true"
                placeholder="Select a voucher"
                className="h-10 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-100"
              />
                <button
                  type="button"
                  onClick={() => {
                    if (appliedVoucherId || voucherDiscount > 0 || voucherCode.trim()) {
                      onRemoveVoucher()
                    } else {
                      setShowVoucherModal(true)
                    }
                  }}
                  className={`h-10 rounded-lg px-3 text-[12px] font-semibold transition ${
                    appliedVoucherId || voucherDiscount > 0 || voucherCode.trim()
                      ? 'border border-red-200 bg-white text-red-600 hover:bg-red-50'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {appliedVoucherId || voucherDiscount > 0 || voucherCode.trim() ? 'Remove' : 'View'}
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-3">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                  Private Voucher
                </label>
                <span className="rounded-full bg-white px-2 py-[2px] text-[10px] font-semibold text-blue-600">
                  Exclusive
                </span>
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={privateVoucherCode}
                  onChange={(e) => setPrivateVoucherCode(e.target.value)}
                  placeholder="Enter private voucher code"
                  className="h-10 flex-1 rounded-lg border border-blue-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
                <button
                  onClick={() => onApplyVoucher(privateVoucherCode)}
                  disabled={isApplyingVoucher || !privateVoucherCode.trim()}
                  className="h-10 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {isApplyingVoucher ? '…' : 'Apply'}
                </button>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">Enter codes shared privately for special buyers.</p>
              {voucherMessage && (
                <p className={`mt-1 text-[11px] ${voucherDiscount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {voucherMessage}
                </p>
              )}
            </div>

            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.productId} className="flex items-start justify-between gap-3 rounded-lg border border-slate-200/70 bg-white px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 line-clamp-2">{item.name}</p>
                    <p className="text-[12px] text-slate-500">
                      {item.quantity} × {formatPrice(item.price)}
                    </p>
                  </div>
                  <div className="text-sm font-semibold text-slate-900">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 px-4 pb-4 pt-3">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span className="text-slate-700">{formatPrice(subtotal)}</span>
            </div>

            {hasSavings && (
              <div className="rounded-lg border border-slate-200/80 bg-slate-50 px-3 py-2.5">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">Savings</p>
                <div className="space-y-1">
                  {hasProductSavings && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Product</span>
                      <span className="font-semibold text-green-600">-{formatPrice(discounts)}</span>
                    </div>
                  )}
                  {hasVoucherSavings && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Voucher</span>
                      <span className="font-semibold text-blue-600">-{formatPrice(voucherDiscount)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
          <button
            onClick={onConfirm}
            disabled={isCheckingOut}
            className="mt-3 h-11 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-[0_10px_24px_-12px_rgba(37,99,235,.6)] transition hover:brightness-110 active:scale-[.99] disabled:opacity-50"
          >
            {isCheckingOut ? 'Processing...' : 'Confirm & Add to Cart'}
          </button>
        </div>
      </div>

      {showVoucherModal && (
        <>
          <div
            className="fixed inset-0 z-[95] bg-black/50"
            onClick={() => setShowVoucherModal(false)}
            aria-hidden
          />
          <div className="fixed left-1/2 top-1/2 z-[96] w-[92vw] max-w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-slate-800">Available Vouchers</p>
                <p className="text-xs text-slate-500">Valid for this shop and cart total.</p>
              </div>
              <button
                type="button"
                aria-label="Close voucher list"
                onClick={() => setShowVoucherModal(false)}
                className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
              {eligibleVouchers.length === 0 ? (
                <p className="text-sm text-slate-500">No available vouchers for this cart.</p>
              ) : (
                <div className="space-y-3">
                  {eligibleVouchers.map((v) => {
                    const label =
                      v.discountType === 'percentage'
                        ? `${v.discountValue}% OFF`
                        : `${formatPrice(v.discountValue)} OFF`
                    return (
                      <div
                        key={v.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800">{v.code}</p>
                          <p className="truncate text-[11px] text-slate-500">
                            {v.name || 'Voucher'} · {label}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            onVoucherCodeChange(v.code)
                            onApplyVoucher(v.code)
                            setShowVoucherModal(false)
                          }}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          Use
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}

function AddonSuggestionModal({
  open,
  suggestions,
  onClose,
  onAddAddon,
}: {
  open: boolean
  suggestions: AddonSuggestion[]
  onClose: () => void
  onAddAddon: (addon: AddonSuggestion) => void
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">Add-on Suggestions</h3>
            <p className="text-xs text-slate-500">Discounted add-ons based on your cart.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 transition hover:text-slate-700">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
          <div className="space-y-3">
            {suggestions.map((addon) => (
              <div
                key={`${addon.dealId}-${addon.addonProductId}`}
                className="flex items-center gap-3 rounded-xl border border-emerald-200/70 bg-emerald-50/40 p-3"
              >
                <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-emerald-100">
                  {addon.addonProductImage ? (
                    <img src={addon.addonProductImage} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-lg">🎁</div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800 line-clamp-1">
                    {addon.addonProductName}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    With {addon.triggerProductName} · {addon.discountLabel}
                  </p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-sm font-bold text-emerald-700">{formatPrice(addon.discountedPrice)}</span>
                    <span className="text-[11px] text-slate-400 line-through">
                      {formatPrice(addon.addonProductPrice)}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onAddAddon(addon)}
                  className="inline-flex h-9 items-center justify-center rounded-md bg-emerald-600 px-3 text-xs font-semibold text-white transition hover:bg-emerald-700"
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <button
            onClick={onClose}
            className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Success Modal                                                      */
/* ------------------------------------------------------------------ */

function CheckoutSuccessModal({
  show,
  result,
  onClose,
}: {
  show: boolean
  result: CheckoutResult | null
  onClose: () => void
}) {
  if (!show || !result) return null
  const isSuccess = result.success

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4">
      <div className="motion-rise w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
        <div
          className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
            isSuccess ? 'bg-green-100' : 'bg-rose-100'
          }`}
        >
          {isSuccess ? (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M5 13L9 17L19 7" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M6 6L18 18M6 18L18 6" stroke="#e11d48" strokeWidth="3" strokeLinecap="round" />
            </svg>
          )}
        </div>
        <h3 className="text-xl font-bold text-slate-800">
          {isSuccess ? 'Purchase Successful!' : 'Purchase Failed'}
        </h3>
        <p className="mt-2 text-sm text-slate-500">
          {isSuccess
            ? 'This is a demo transaction - no real payment was made.'
            : result.message}
        </p>

        {isSuccess && (
          <>
            <div className="mt-6 space-y-2 rounded-xl bg-slate-50 p-4 text-left text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Items Purchased</span>
                <span className="font-semibold text-slate-700">{result.itemsPurchased}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Paid</span>
                <span className="font-semibold text-slate-700">{formatPrice(result.totalPaid)}</span>
              </div>
              {result.discountsSaved > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Product Discounts</span>
                  <span className="font-semibold">-{formatPrice(result.discountsSaved)}</span>
                </div>
              )}
              {result.voucherSaved > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Voucher Savings</span>
                  <span className="font-semibold">-{formatPrice(result.voucherSaved)}</span>
                </div>
              )}
            </div>

            <p className="mt-4 text-xs text-slate-400">
              Flash deal stock, discount usage, and voucher counts have been updated.
            </p>
          </>
        )}

        <button
          onClick={onClose}
          className="mt-6 h-11 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-[0_4px_16px_-4px_rgba(37,99,235,.5)] transition hover:brightness-110"
        >
          {isSuccess ? 'Continue Shopping' : 'Review Cart'}
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main ShopDemoPage                                                  */
/* ------------------------------------------------------------------ */

function ShopDemoPage() {
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [shopId, setShopId] = useState<string | null>(null)
  const [products, setProducts] = useState<MarketplaceProduct[]>([])
  const [flashDeals, setFlashDeals] = useState<MarketplaceFlashDeal[]>([])
  const [vouchers, setVouchers] = useState<MarketplaceVoucher[]>([])
  const [bundles, setBundles] = useState<MarketplaceBundle[]>([])
  const [addonDeals, setAddonDeals] = useState<MarketplaceAddonDeal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cart
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [addonModalOpen, setAddonModalOpen] = useState(false)
  const [addonModalItems, setAddonModalItems] = useState<AddonSuggestion[]>([])
  const [pendingAddonTriggerIds, setPendingAddonTriggerIds] = useState<string[]>([])

  // Voucher input
  const [voucherCode, setVoucherCode] = useState('')
  const [voucherMessage, setVoucherMessage] = useState<string | null>(null)
  const [voucherDiscount, setVoucherDiscount] = useState(0)
  const [appliedVoucherId, setAppliedVoucherId] = useState<string | null>(null)
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false)

  // Checkout
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResult | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showOrderDetails, setShowOrderDetails] = useState(false)
  const [pendingAddAction, setPendingAddAction] = useState<(() => void) | null>(null)
  const [pendingAddItems, setPendingAddItems] = useState<CartItem[]>([])
  const [cartAlert, setCartAlert] = useState<{ type: 'limit' | 'stock'; message: string } | null>(null)
  const cartAlertTimerRef = useRef<number | null>(null)
  const lastCartSignatureRef = useRef<string>('')

  // Filter
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [showSearchBar, setShowSearchBar] = useState(false)

  // Reset
  const [isResetting, setIsResetting] = useState(false)

  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category))
    return ['All', ...Array.from(cats).sort()]
  }, [products])

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (activeCategory !== 'All' && p.category !== activeCategory) return false
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [products, activeCategory, search])

  const secondaryFlashDeals = flashDeals
  const voucherEligibleShopIds = useMemo(() => new Set(vouchers.map((voucher) => voucher.shopId)), [vouchers])
  const bundleProductIds = useMemo(() => {
    const ids = new Set<string>()
    for (const bundle of bundles) {
      for (const item of bundle.items) {
        ids.add(item.productId)
      }
    }
    return ids
  }, [bundles])

  const showCartAlert = useCallback((type: 'limit' | 'stock', message: string) => {
    setCartAlert({ type, message })
    if (cartAlertTimerRef.current) {
      window.clearTimeout(cartAlertTimerRef.current)
    }
    cartAlertTimerRef.current = window.setTimeout(() => {
      setCartAlert(null)
    }, 3000)
  }, [])

  const ensureSingleShopCart = useCallback(
    (shopId: string | null) => {
      if (!shopId) return true
      const cartShopIds = new Set(cart.map((item) => item.shopId).filter(Boolean))
      if (cartShopIds.size === 0) return true
      if (cartShopIds.size === 1 && cartShopIds.has(shopId)) return true
      showCartAlert('limit', 'You can only add items from one shop per order.')
      return false
    },
    [cart, showCartAlert],
  )

  useEffect(() => {
    return () => {
      if (cartAlertTimerRef.current) {
        window.clearTimeout(cartAlertTimerRef.current)
      }
    }
  }, [])

  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products])
  const flashDealById = useMemo(() => new Map(flashDeals.map((d) => [d.id, d])), [flashDeals])

  const cartQtyByProductId = useMemo(() => {
    const map = new Map<string, number>()
    for (const item of cart) {
      map.set(item.productId, (map.get(item.productId) ?? 0) + item.quantity)
    }
    return map
  }, [cart])

  const getProductStockLimit = useCallback(
    (productId: string, flashDealId?: string | null) => {
      const product = productById.get(productId)
      const baseStock = product?.quantity ?? null
      const flashDeal =
        (flashDealId ? flashDealById.get(flashDealId) : null) ?? product?.flashDeal ?? null
      if (flashDeal) {
        const remaining = Math.max(flashDeal.flashQuantity - flashDeal.soldQuantity, 0)
        if (typeof baseStock === 'number') {
          return Math.min(baseStock, remaining)
        }
        return remaining
      }
      return baseStock
    },
    [productById, flashDealById],
  )

  const getProductPurchaseLimit = useCallback(
    (productId: string, flashDealId?: string | null) => {
      const product = productById.get(productId)
      const flashDeal =
        (flashDealId ? flashDealById.get(flashDealId) : null) ?? product?.flashDeal ?? null
      const limits: number[] = []
      if (typeof product?.purchaseLimit === 'number') {
        limits.push(product.purchaseLimit)
      }
      if (typeof flashDeal?.purchaseLimit === 'number') {
        limits.push(flashDeal.purchaseLimit)
      }
      if (limits.length === 0) return null
      return Math.min(...limits)
    },
    [productById, flashDealById],
  )

  const validateProductIncrement = useCallback(
    (productId: string, addQty: number, flashDealId?: string | null) => {
      const currentQty = cartQtyByProductId.get(productId) ?? 0
      const nextQty = currentQty + addQty
      const stockLimit = getProductStockLimit(productId, flashDealId)
      if (typeof stockLimit === 'number' && nextQty > stockLimit) {
        return {
          ok: false,
          type: 'stock' as const,
          message: 'Requested quantity exceeds available stock.',
        }
      }
      const purchaseLimit = getProductPurchaseLimit(productId, flashDealId)
      if (typeof purchaseLimit === 'number' && nextQty > purchaseLimit) {
        return {
          ok: false,
          type: 'limit' as const,
          message: 'You have reached the maximum purchase limit for this item.',
        }
      }
      return { ok: true as const }
    },
    [cartQtyByProductId, getProductPurchaseLimit, getProductStockLimit],
  )

  const getBundleCountInCart = useCallback(
    (bundle: MarketplaceBundle) => {
      const cartItems = cart.filter((item) => item.bundleId === bundle.id)
      if (cartItems.length === 0 || bundle.items.length === 0) return 0
      const qtyByProductId = new Map<string, number>()
      for (const item of cartItems) {
        qtyByProductId.set(item.productId, (qtyByProductId.get(item.productId) ?? 0) + item.quantity)
      }
      let bundleCount = Infinity
      for (const bundleItem of bundle.items) {
        const required = bundleItem.quantity
        const inCart = qtyByProductId.get(bundleItem.productId) ?? 0
        const possible = required > 0 ? Math.floor(inCart / required) : 0
        bundleCount = Math.min(bundleCount, possible)
      }
      return bundleCount === Infinity ? 0 : bundleCount
    },
    [cart],
  )

  const validateBundleAdd = useCallback(
    (bundle: MarketplaceBundle) => {
      const currentBundles = getBundleCountInCart(bundle)
      const bundleLimit = bundle.purchaseLimit
      const usedCount = bundle.usedCount ?? 0
      if (typeof bundleLimit === 'number') {
        const remaining = bundleLimit - usedCount
        if (remaining <= 0) {
          return {
            ok: false,
            type: 'limit' as const,
            message: 'You have reached the maximum purchase limit for this item.',
          }
        }
        if (currentBundles + 1 > remaining) {
          return {
            ok: false,
            type: 'limit' as const,
            message: 'You have reached the maximum purchase limit for this item.',
          }
        }
      }

      for (const item of bundle.items) {
        const validation = validateProductIncrement(item.productId, item.quantity, null)
        if (!validation.ok) {
          return validation
        }
      }

      return { ok: true as const }
    },
    [getBundleCountInCart, validateProductIncrement],
  )

  const getItemLimitState = useCallback(
    (item: CartItem) => {
      if (item.bundleId) {
        return { canIncrease: false, message: 'Bundle quantities are fixed.' }
      }
      const validation = validateProductIncrement(item.productId, 1, item.flashDealId)
      if (!validation.ok) {
        return { canIncrease: false, message: validation.message }
      }
      return { canIncrease: true, message: null }
    },
    [validateProductIncrement],
  )

  const isSameCartLine = useCallback((a: CartItem, b: CartItem) => {
    return (
      a.productId === b.productId &&
      (a.bundleId ?? null) === (b.bundleId ?? null) &&
      (a.flashDealId ?? null) === (b.flashDealId ?? null) &&
      (a.discountId ?? null) === (b.discountId ?? null) &&
      (a.addonDealId ?? null) === (b.addonDealId ?? null) &&
      Boolean(a.isAddonDiscounted) === Boolean(b.isAddonDiscounted)
    )
  }, [])

  const validateCartSnapshot = useCallback(() => {
    for (const [productId, qty] of cartQtyByProductId) {
      const stockLimit = getProductStockLimit(productId)
      if (typeof stockLimit === 'number' && qty > stockLimit) {
        return {
          ok: false,
          type: 'stock' as const,
          message: 'Requested quantity exceeds available stock.',
        }
      }
      const purchaseLimit = getProductPurchaseLimit(productId)
      if (typeof purchaseLimit === 'number' && qty > purchaseLimit) {
        return {
          ok: false,
          type: 'limit' as const,
          message: 'You have reached the maximum purchase limit for this item.',
        }
      }
    }

    return { ok: true as const }
  }, [
    cartQtyByProductId,
    getProductStockLimit,
    getProductPurchaseLimit,
  ])

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const preAddItems = useMemo(() => {
    if (pendingAddItems.length === 0) return []
    return [...cart, ...pendingAddItems]
  }, [cart, pendingAddItems])

  const preAddShopLabel = useMemo(() => {
    if (preAddItems.length === 0) return null
    const shopIds = Array.from(new Set(preAddItems.map((item) => item.shopId)))
    if (shopIds.length !== 1) return 'Multiple shops'
    const shopId = shopIds[0]
    const shop = products.find((p) => p.shopId === shopId)
    return shop?.shopName ?? shopId
  }, [preAddItems, products])

  const addonSuggestions = useMemo<AddonSuggestion[]>(() => {
    if (addonDeals.length === 0 || cart.length === 0) return []

    const cartQtyMap = new Map<string, number>()
    for (const item of cart) {
      cartQtyMap.set(item.productId, (cartQtyMap.get(item.productId) ?? 0) + item.quantity)
    }

    const cartProductIds = new Set(cart.map((item) => item.productId))

    return addonDeals.flatMap((deal) => {
      const triggerQty = cartQtyMap.get(deal.triggerProductId) ?? 0
      const addonItem = deal.addonItems[0]
      if (!addonItem) return []
      if (triggerQty < addonItem.requiredQuantity) return []
      if (cartProductIds.has(addonItem.productId)) return []

      const discountedPrice = computeAddonDiscountedPrice(
        addonItem.productPrice,
        deal.discountType,
        deal.discountValue,
      )
      const discountLabel =
        deal.discountType === 'percentage'
          ? `${deal.discountValue}% OFF`
          : `${formatPrice(deal.discountValue)} OFF`

      return [
        {
          dealId: deal.id,
          dealName: deal.name,
          shopId: deal.shopId,
          triggerProductId: deal.triggerProductId,
          triggerProductName: deal.triggerProductName,
          addonProductId: addonItem.productId,
          addonProductName: addonItem.productName,
          addonProductImage: addonItem.productImage,
          addonProductPrice: addonItem.productPrice,
          discountedPrice,
          discountLabel,
          requiredQuantity: addonItem.requiredQuantity,
        },
      ]
    })
  }, [addonDeals, cart])

  useEffect(() => {
    if (cart.length === 0) return
    if (addonDeals.length === 0) return

    const dealById = new Map(addonDeals.map((deal) => [deal.id, deal]))
    const cartQtyMap = new Map<string, number>()
    for (const item of cart) {
      cartQtyMap.set(item.productId, (cartQtyMap.get(item.productId) ?? 0) + item.quantity)
    }

    setCart((prev) => {
      let changed = false
      const next: CartItem[] = []

      for (const item of prev) {
        if (!item.isAddonDiscounted || !item.addonDealId) {
          next.push(item)
          continue
        }

        const deal = dealById.get(item.addonDealId) ?? null
        const requiredQty = deal?.addonItems[0]?.requiredQuantity ?? 1
        const triggerQty = deal ? (cartQtyMap.get(deal.triggerProductId) ?? 0) : 0

        if (!deal || triggerQty < requiredQty) {
          changed = true
          const fullPriceId = `full-price:${item.productId}`
          const existing = next.find((line) => line.addonDealId === fullPriceId)
          if (existing) {
            existing.quantity += item.quantity
          } else {
            next.push({
              ...item,
              price: item.originalPrice,
              originalPrice: item.originalPrice,
              addonDealId: fullPriceId,
              isAddonDiscounted: false,
            })
          }
          continue
        }

        next.push(item)
      }

      return changed ? next : prev
    })
  }, [addonDeals, cart])

  useEffect(() => {
    if (pendingAddonTriggerIds.length === 0) return
    const triggerSet = new Set(pendingAddonTriggerIds)
    const suggestions = addonSuggestions.filter((suggestion) => triggerSet.has(suggestion.triggerProductId))
    if (suggestions.length > 0) {
      setAddonModalItems(suggestions)
      setAddonModalOpen(true)
    }
    setPendingAddonTriggerIds([])
  }, [addonSuggestions, pendingAddonTriggerIds])

  // ---- Data loading ----

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const sid = await getDemoShopId()
      setShopId(sid)
      const [prods, fds, vch, bdls, addons] = await Promise.all([
        listMarketplaceProducts(sid),
        listActiveFlashDeals(sid),
        listClaimableVouchers(sid),
        listActiveBundles(sid),
        listActiveAddonDeals(sid),
      ])
      setProducts(prods)
      setFlashDeals(fds)
      setVouchers(vch)
      setBundles(bdls)
      setAddonDeals(addons)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load marketplace data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  // ---- Cart actions ----

  const addFlashDealToCart = (deal: MarketplaceFlashDeal) => {
    if (!ensureSingleShopCart(deal.shopId)) return
    const validation = validateProductIncrement(deal.productId, 1, deal.id)
    if (!validation.ok) {
      showCartAlert(validation.type, validation.message)
      return
    }
    setCart((prev) => {
      const existing = prev.find(
        (c) =>
          c.productId === deal.productId &&
          c.flashDealId === deal.id &&
          !c.bundleId &&
          !c.addonDealId,
      )
      if (existing) {
        return prev.map((c) =>
          c.productId === deal.productId &&
          c.flashDealId === deal.id &&
          !c.bundleId &&
          !c.addonDealId
            ? { ...c, quantity: c.quantity + 1 }
            : c,
        )
      }
      return [
        ...prev,
        {
          productId: deal.productId,
          name: deal.productName,
          price: deal.flashPrice,
          originalPrice: deal.originalPrice,
          quantity: 1,
          image: deal.productImage,
          flashDealId: deal.id,
          discountId: null,
          addonDealId: null,
          isAddonDiscounted: false,
          shopId: deal.shopId,
        },
      ]
    })
    setCartOpen(true)
    setPendingAddonTriggerIds([deal.productId])
  }

  const addProductToCart = (product: MarketplaceProduct) => {
    if (!ensureSingleShopCart(product.shopId)) return
    const validation = validateProductIncrement(product.id, 1, product.flashDeal?.id ?? null)
    if (!validation.ok) {
      showCartAlert(validation.type, validation.message)
      return
    }
    const discPrice = computeDiscountedPrice(product)
    setCart((prev) => {
      const existing = prev.find(
        (c) => c.productId === product.id && !c.bundleId && !c.addonDealId,
      )
      if (existing) {
        return prev.map((c) =>
          c.productId === product.id && !c.bundleId && !c.addonDealId
            ? { ...c, quantity: c.quantity + 1 }
            : c,
        )
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: discPrice,
          originalPrice: product.price,
          quantity: 1,
          image: product.image,
          flashDealId: product.flashDeal?.id ?? null,
          discountId: product.discount?.id ?? null,
          addonDealId: null,
          isAddonDiscounted: false,
          shopId: product.shopId,
        },
      ]
    })
    setCartOpen(true)
    setPendingAddonTriggerIds([product.id])
  }

  const addAddonToCart = (addon: AddonSuggestion) => {
    if (!ensureSingleShopCart(addon.shopId)) return
    const deal = addonDeals.find((entry) => entry.id === addon.dealId) ?? null
    const addonLimit = deal?.maxUses ?? null
    const addonUsed = deal?.usedCount ?? 0
    if (addonLimit !== null && addonUsed >= addonLimit) {
      showCartAlert('limit', 'You have reached the maximum purchase limit for this item.')
      return
    }
    const validation = validateProductIncrement(addon.addonProductId, 1, null)
    if (!validation.ok) {
      showCartAlert(validation.type, validation.message)
      return
    }
    setCart((prev) => {
      const discountedLine = prev.find(
        (c) => c.addonDealId === addon.dealId && c.isAddonDiscounted,
      )
      if (discountedLine) {
        const fullPriceId = `full-price:${addon.addonProductId}`
        const fullPriceLine = prev.find((c) => c.addonDealId === fullPriceId)
        if (fullPriceLine) {
          return prev.map((c) =>
            c.addonDealId === fullPriceId ? { ...c, quantity: c.quantity + 1 } : c,
          )
        }
        return [
          ...prev,
          {
            productId: addon.addonProductId,
            name: addon.addonProductName,
            price: addon.addonProductPrice,
            originalPrice: addon.addonProductPrice,
            quantity: 1,
            image: addon.addonProductImage,
            flashDealId: null,
            discountId: null,
            addonDealId: fullPriceId,
            isAddonDiscounted: false,
            shopId: addon.shopId,
          },
        ]
      }
      return [
        ...prev,
        {
          productId: addon.addonProductId,
          name: addon.addonProductName,
          price: addon.discountedPrice,
          originalPrice: addon.addonProductPrice,
          quantity: 1,
          image: addon.addonProductImage,
          flashDealId: null,
          discountId: null,
          addonDealId: addon.dealId,
          isAddonDiscounted: true,
          shopId: addon.shopId,
        },
      ]
    })
    setCartOpen(true)
    setAddonModalOpen(false)
  }

  const addBundleToCart = (bundle: MarketplaceBundle) => {
    if (!ensureSingleShopCart(bundle.shopId)) return
    const validation = validateBundleAdd(bundle)
    if (!validation.ok) {
      showCartAlert(validation.type, validation.message)
      return
    }
    const totalBundleQty = bundle.items.reduce((s, b) => s + b.quantity, 0)
    const perUnitBundlePrice =
      bundle.price && totalBundleQty > 0 ? bundle.price / totalBundleQty : null
    for (const item of bundle.items) {
      setCart((prev) => {
        const existing = prev.find(
          (c) => c.productId === item.productId && c.bundleId === bundle.id,
        )
        if (existing) {
          return prev.map((c) =>
            c.productId === item.productId && c.bundleId === bundle.id
              ? { ...c, quantity: c.quantity + item.quantity }
              : c,
          )
        }
        return [
          ...prev,
          {
            productId: item.productId,
            name: item.productName,
            price: perUnitBundlePrice ?? item.productPrice,
            originalPrice: item.productPrice,
            quantity: item.quantity,
            image: item.productImage,
          flashDealId: null,
          discountId: null,
          bundleId: bundle.id,
          bundleName: bundle.name ?? null,
          addonDealId: null,
          isAddonDiscounted: false,
          shopId: bundle.shopId,
        },
      ]
    })
    }
    setCartOpen(true)
    const triggerIds = Array.from(new Set(bundle.items.map((item) => item.productId)))
    setPendingAddonTriggerIds(triggerIds)
  }

  const openPreAddDetails = (items: CartItem[], onConfirm: () => void) => {
    setPendingAddItems(items)
    setPendingAddAction(() => onConfirm)
    setShowOrderDetails(true)
  }

  const handleInitiateAddFlashDeal = (deal: MarketplaceFlashDeal) => {
    if (!ensureSingleShopCart(deal.shopId)) return
    const validation = validateProductIncrement(deal.productId, 1, deal.id)
    if (!validation.ok) {
      showCartAlert(validation.type, validation.message)
      return
    }
    const previewItem: CartItem = {
      productId: deal.productId,
      name: deal.productName,
      price: deal.flashPrice,
      originalPrice: deal.originalPrice,
      quantity: 1,
      image: deal.productImage,
      flashDealId: deal.id,
      discountId: null,
      shopId: deal.shopId,
    }
    openPreAddDetails([previewItem], () => addFlashDealToCart(deal))
  }

  const handleInitiateAddProduct = (product: MarketplaceProduct) => {
    if (!ensureSingleShopCart(product.shopId)) return
    const validation = validateProductIncrement(product.id, 1, product.flashDeal?.id ?? null)
    if (!validation.ok) {
      showCartAlert(validation.type, validation.message)
      return
    }
    const discPrice = computeDiscountedPrice(product)
    const previewItem: CartItem = {
      productId: product.id,
      name: product.name,
      price: discPrice,
      originalPrice: product.price,
      quantity: 1,
      image: product.image,
      flashDealId: product.flashDeal?.id ?? null,
      discountId: product.discount?.id ?? null,
      shopId: product.shopId,
    }
    openPreAddDetails([previewItem], () => addProductToCart(product))
  }

  const handleInitiateAddAddon = (addon: AddonSuggestion) => {
    if (!ensureSingleShopCart(addon.shopId)) return
    const deal = addonDeals.find((entry) => entry.id === addon.dealId) ?? null
    const addonLimit = deal?.maxUses ?? null
    const addonUsed = deal?.usedCount ?? 0
    if (addonLimit !== null && addonUsed >= addonLimit) {
      showCartAlert('limit', 'You have reached the maximum purchase limit for this item.')
      return
    }
    const validation = validateProductIncrement(addon.addonProductId, 1, null)
    if (!validation.ok) {
      showCartAlert(validation.type, validation.message)
      return
    }
    const alreadyDiscounted = cart.some(
      (item) => item.addonDealId === addon.dealId && item.isAddonDiscounted,
    )
    const previewPrice = alreadyDiscounted ? addon.addonProductPrice : addon.discountedPrice
    setAddonModalOpen(false)
    const previewItem: CartItem = {
      productId: addon.addonProductId,
      name: addon.addonProductName,
      price: previewPrice,
      originalPrice: addon.addonProductPrice,
      quantity: 1,
      image: addon.addonProductImage,
      flashDealId: null,
      discountId: null,
      addonDealId: alreadyDiscounted ? `full-price:${addon.addonProductId}` : addon.dealId,
      isAddonDiscounted: !alreadyDiscounted,
      shopId: addon.shopId,
    }
    openPreAddDetails([previewItem], () => addAddonToCart(addon))
  }

  const handleInitiateAddBundle = (bundle: MarketplaceBundle) => {
    if (!ensureSingleShopCart(bundle.shopId)) return
    const validation = validateBundleAdd(bundle)
    if (!validation.ok) {
      showCartAlert(validation.type, validation.message)
      return
    }
    const totalBundleQty = bundle.items.reduce((s, b) => s + b.quantity, 0)
    const perUnitBundlePrice =
      bundle.price && totalBundleQty > 0 ? bundle.price / totalBundleQty : null
    const previewItems: CartItem[] = bundle.items.map((item) => ({
      productId: item.productId,
      name: item.productName,
      price: perUnitBundlePrice ?? item.productPrice,
      originalPrice: item.productPrice,
      quantity: item.quantity,
      image: item.productImage,
      flashDealId: null,
      discountId: null,
      bundleId: bundle.id,
      bundleName: bundle.name ?? null,
      shopId: bundle.shopId,
    }))
    openPreAddDetails(previewItems, () => addBundleToCart(bundle))
  }

  const updateCartQty = (item: CartItem, delta: number) => {
    if (item.bundleId) return
    if (delta > 0) {
      const validation = validateProductIncrement(item.productId, delta, item.flashDealId)
      if (!validation.ok) {
        showCartAlert(validation.type, validation.message)
        return
      }
    }
    if (item.isAddonDiscounted && delta > 0) {
      const fullPriceId = `full-price:${item.productId}`
      setCart((prev) => {
        const existing = prev.find((c) => c.addonDealId === fullPriceId)
        if (existing) {
          return prev.map((c) =>
            c.addonDealId === fullPriceId ? { ...c, quantity: c.quantity + 1 } : c,
          )
        }
        return [
          ...prev,
          {
            ...item,
            price: item.originalPrice,
            originalPrice: item.originalPrice,
            quantity: 1,
            addonDealId: fullPriceId,
            isAddonDiscounted: false,
          },
        ]
      })
      return
    }
    setCart((prev) =>
      prev
        .map((c) => (isSameCartLine(c, item) ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0),
    )
  }

  const removeFromCart = (item: CartItem) => {
    setCart((prev) => prev.filter((c) => !isSameCartLine(c, item)))
  }

  const removeBundleFromCart = (bundleId: string) => {
    setCart((prev) => prev.filter((c) => c.bundleId !== bundleId))
  }

  // ---- Voucher ----

  const handleApplyVoucher = async (items: CartItem[], codeOverride?: string) => {
    const resolvedCode = (codeOverride ?? voucherCode).trim()
    if (!shopId || !resolvedCode) return
    setIsApplyingVoucher(true)
    if (codeOverride) {
      setVoucherCode(codeOverride)
    }
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
    const cartShopIds = new Set(items.map((item) => item.shopId).filter(Boolean))
    if (cartShopIds.size > 1) {
      setVoucherMessage('Vouchers can only be used for items from a single shop.')
      setVoucherDiscount(0)
      setAppliedVoucherId(null)
      setIsApplyingVoucher(false)
      return
    }
    const result = await validateVoucher(resolvedCode, subtotal, shopId, items)
    setVoucherMessage(result.message)
    setVoucherDiscount(result.discount)
    setAppliedVoucherId(result.voucherId)
    setIsApplyingVoucher(false)
  }

  const handleRemoveVoucher = () => {
    setVoucherCode('')
    setVoucherMessage(null)
    setVoucherDiscount(0)
    setAppliedVoucherId(null)
  }

  useEffect(() => {
    const signature = cart
      .map((item) => [
        item.productId,
        item.bundleId ?? '',
        item.addonDealId ?? '',
        item.flashDealId ?? '',
        item.discountId ?? '',
        item.quantity,
      ].join(':'))
      .sort()
      .join('|')

    if (lastCartSignatureRef.current === '') {
      lastCartSignatureRef.current = signature
      return
    }

    if (!appliedVoucherId || !shopId) {
      lastCartSignatureRef.current = signature
      return
    }

    if (signature === lastCartSignatureRef.current) return

    lastCartSignatureRef.current = signature
    let cancelled = false

    const revalidate = async () => {
      const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)
      const result = await validateVoucher(voucherCode, subtotal, shopId, cart)
      if (cancelled) return
      if (!result.valid) {
        handleRemoveVoucher()
        setVoucherMessage(result.message)
        return
      }
      setVoucherMessage(result.message)
      setVoucherDiscount(result.discount)
      setAppliedVoucherId(result.voucherId)
    }

    void revalidate()

    return () => {
      cancelled = true
    }
  }, [appliedVoucherId, cart, handleRemoveVoucher, shopId, voucherCode])

  // ---- Checkout ----

  const handleCheckout = async () => {
    if (!shopId || cart.length === 0) return
    const validation = validateCartSnapshot()
    if (!validation.ok) {
      showCartAlert(validation.type, validation.message)
      setCheckoutResult({
        success: false,
        message: 'Purchase failed: Quantity exceeds allowed limit or available stock.',
        itemsPurchased: 0,
        totalPaid: 0,
        discountsSaved: 0,
        voucherSaved: 0,
      })
      setShowSuccess(true)
      return
    }
    setIsCheckingOut(true)
    const result = await simulateCheckout(cart, appliedVoucherId, voucherDiscount, shopId)
    setCheckoutResult(result)
    setShowSuccess(true)
    setIsCheckingOut(false)
    if (result.success) {
      setCart([])
      setVoucherCode('')
      setVoucherMessage(null)
      setVoucherDiscount(0)
      setAppliedVoucherId(null)
      setCartOpen(false)
      void loadData()
    }
  }

  // ---- Reset ----

  const handleReset = async () => {
    if (!shopId) return
    setIsResetting(true)
    const result = await resetDemoData(shopId)
    if (result.success) {
      void loadData()
    } else {
      setError(result.message)
    }
    setIsResetting(false)
  }

  // ---- Render ----

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f6f1]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <p className="text-sm text-slate-500">Loading marketplace...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f6f1] p-4">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
          <p className="text-red-500">{error}</p>
          <button
            onClick={() => loadData()}
            className="mt-4 rounded-lg bg-blue-600 px-6 py-2 text-sm text-white"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f6f1]">
      {/* ===== Top Header ===== */}
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-[720px] px-4">
          <div className="flex h-14 items-center gap-3">
            <button
              type="button"
              aria-label="Back"
              onClick={() => navigate(-1)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <img src="/Asset/unleash_logo.png" alt="Unleash" className="h-7 w-7 object-contain" />
              <span className="text-sm font-semibold text-slate-800">Unleash Store</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                aria-label="Search"
                onClick={() => setShowSearchBar((prev) => !prev)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                  <path d="M16 16L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
              <button
                onClick={() => setCartOpen(true)}
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M6 6H22L20 14H8L6 6Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                  <path d="M6 6L4 2H1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <circle cx="9" cy="20" r="1.5" fill="currentColor" />
                  <circle cx="19" cy="20" r="1.5" fill="currentColor" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow">
                    {cartCount}
                  </span>
                )}
              </button>
              <button
                onClick={async () => {
                  if (isLoggingOut) return
                  setIsLoggingOut(true)
                  await supabase.auth.signOut()
                  setIsLoggingOut(false)
                  navigate('/', { replace: true })
                }}
                disabled={isLoggingOut}
                aria-label="Logout"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 disabled:opacity-60"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 21H5C3.89 21 3 20.1 3 19V5C3 3.9 3.89 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>
          <div className={`${showSearchBar ? 'max-h-16 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden transition-all duration-200`}>
            <div className="mb-3 flex items-center gap-2 rounded-full bg-slate-100 px-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 text-slate-400">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="M16 16L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[720px] px-4 pb-24 pt-4 sm:px-5">
        <ShopPromotionsHeader
          flashDealsCount={flashDeals.length}
          bundlesCount={bundles.length}
          vouchersCount={vouchers.length}
        />

        {secondaryFlashDeals.length > 0 && (
          <FlashDealsSection deals={secondaryFlashDeals} onAdd={handleInitiateAddFlashDeal} />
        )}

        {bundles.length > 0 && (
          <BundleDealsSection bundles={bundles} onAdd={handleInitiateAddBundle} />
        )}

        <section className="mb-6 rounded-2xl bg-white/90 p-4 shadow-[0_12px_30px_-28px_rgba(15,23,42,.35)] ring-1 ring-slate-200/70">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Shop by category</h2>
              <p className="text-xs text-slate-500">Tap a category or browse all.</p>
            </div>
            <span className="text-xs font-semibold text-slate-500">{filteredProducts.length} items</span>
          </div>
          <div className="scrollbar-hide -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                  activeCategory === cat
                    ? 'bg-indigo-600 text-white shadow-[0_10px_24px_-14px_rgba(79,70,229,.6)]'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {filteredProducts.length === 0 ? (
          <section className="rounded-2xl bg-white px-4 py-8 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
            No products match this filter.
          </section>
        ) : (
          <ProductBrowseSection
            title={activeCategory === 'All' ? 'All products' : activeCategory}
            subtitle={activeCategory === 'All' ? 'Fresh picks from this shop.' : 'Matching products from this category.'}
            products={filteredProducts}
            onAdd={handleInitiateAddProduct}
            voucherEligibleShopIds={voucherEligibleShopIds}
            bundleProductIds={bundleProductIds}
          />
        )}
      </main>

      {/* ===== Cart Drawer ===== */}
      <CartDrawer
        open={cartOpen}
        items={cart}
        onClose={() => setCartOpen(false)}
        onUpdateQty={updateCartQty}
        onRemove={removeFromCart}
        onRemoveBundle={removeBundleFromCart}
        voucherDiscount={voucherDiscount}
        limitAlert={cartAlert}
        onClearAlert={() => setCartAlert(null)}
        getItemLimitState={getItemLimitState}
        onReviewCheckout={handleCheckout}
        isCheckingOut={isCheckingOut}
      />

      <OrderDetailsModal
        open={showOrderDetails}
        items={preAddItems}
        voucherDiscount={voucherDiscount}
        voucherCode={voucherCode}
        onVoucherCodeChange={setVoucherCode}
        onApplyVoucher={(codeOverride) => void handleApplyVoucher(preAddItems, codeOverride)}
        onRemoveVoucher={handleRemoveVoucher}
        voucherMessage={voucherMessage}
        isApplyingVoucher={isApplyingVoucher}
        appliedVoucherId={appliedVoucherId}
        vouchers={vouchers}
        shopLabel={preAddShopLabel}
        onClose={() => {
          setShowOrderDetails(false)
          setPendingAddAction(null)
          setPendingAddItems([])
        }}
        onConfirm={() => {
          setShowOrderDetails(false)
          pendingAddAction?.()
          setPendingAddAction(null)
          setPendingAddItems([])
        }}
        isCheckingOut={isCheckingOut}
      />

      <AddonSuggestionModal
        open={addonModalOpen}
        suggestions={addonModalItems}
        onClose={() => setAddonModalOpen(false)}
        onAddAddon={handleInitiateAddAddon}
      />

      {cartAlert && (
        <div className="fixed bottom-20 left-1/2 z-[85] w-[92vw] max-w-[520px] -translate-x-1/2">
          <div
            className={`flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-lg ${
              cartAlert.type === 'stock'
                ? 'border-orange-200 bg-orange-50 text-orange-700'
                : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}
          >
            <span>{cartAlert.message}</span>
            <button
              type="button"
              onClick={() => setCartAlert(null)}
              className="rounded-md px-2 py-1 text-[11px] font-semibold uppercase tracking-wide"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ===== Checkout Success Modal ===== */}
      <CheckoutSuccessModal
        show={showSuccess}
        result={checkoutResult}
        onClose={() => setShowSuccess(false)}
      />

      {/* ===== Floating Actions ===== */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={handleReset}
          disabled={isResetting}
          className="flex h-11 items-center gap-2 rounded-full bg-white px-4 text-xs font-semibold text-slate-700 shadow-[0_10px_26px_-12px_rgba(0,0,0,.25)] ring-1 ring-slate-200/80 transition hover:ring-blue-300 hover:text-blue-600 disabled:opacity-50"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M1 4V10H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3.51 15A9 9 0 1 0 5.64 5.64L1 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {isResetting ? 'Resetting...' : 'Reset Demo'}
        </button>
      </div>
    </div>
  )
}

export default ShopDemoPage



