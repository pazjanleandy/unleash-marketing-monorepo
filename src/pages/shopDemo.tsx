import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  return `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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
}: {
  deal: MarketplaceFlashDeal
  onAdd: (deal: MarketplaceFlashDeal) => void
}) {
  const { h, m, s, expired } = useCountdown(deal.endAt)
  const remaining = deal.flashQuantity - deal.soldQuantity
  const pct = deal.flashQuantity > 0 ? (deal.soldQuantity / deal.flashQuantity) * 100 : 0
  const off = discountPercent(deal.originalPrice, deal.flashPrice)

  return (
    <div className="group relative flex w-[220px] flex-shrink-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#111c3a] to-[#0a1228] shadow-[0_12px_36px_-12px_rgba(0,0,0,.6)] transition hover:border-white/20 hover:shadow-[0_16px_48px_-12px_rgba(80,120,255,.25)]">
      {off > 0 && (
        <span className="absolute left-2 top-2 z-10 rounded-lg bg-red-500 px-2 py-0.5 text-[11px] font-bold text-white shadow-lg">
          -{off}%
        </span>
      )}
      <div className="relative h-[140px] w-full overflow-hidden bg-white/5">
        {deal.productImage ? (
          <img
            src={deal.productImage}
            alt={deal.productName}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl text-white/20">⚡</div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <h4 className="line-clamp-2 text-[13px] font-semibold leading-tight text-white/90">
          {deal.productName}
        </h4>
        <span className="text-[10px] font-medium uppercase tracking-wider text-white/50">
          {deal.shopName}
        </span>

        <div className="flex items-baseline gap-2">
          <span className="text-base font-bold text-orange-400">{formatPrice(deal.flashPrice)}</span>
          <span className="text-xs text-white/40 line-through">{formatPrice(deal.originalPrice)}</span>
        </div>

        {/* Stock progress */}
        <div className="mt-auto">
          <div className="mb-1 flex items-center justify-between text-[10px] text-white/50">
            <span>{deal.soldQuantity} sold</span>
            <span>{remaining} left</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-700"
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
        </div>

        {/* Timer */}
        <div className="flex items-center justify-center gap-1 text-[11px] font-mono">
          {expired ? (
            <span className="text-red-400">Ended</span>
          ) : (
            <>
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-white/80">{String(h).padStart(2, '0')}</span>
              <span className="text-white/40">:</span>
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-white/80">{String(m).padStart(2, '0')}</span>
              <span className="text-white/40">:</span>
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-white/80">{String(s).padStart(2, '0')}</span>
            </>
          )}
        </div>

        <button
          onClick={() => onAdd(deal)}
          disabled={remaining <= 0 || expired}
          className="mt-1 h-8 w-full rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-xs font-bold text-white shadow-[0_4px_16px_-4px_rgba(255,107,0,.6)] transition hover:brightness-110 active:scale-[.97] disabled:opacity-40"
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
}: {
  product: MarketplaceProduct
  onAdd: (product: MarketplaceProduct) => void
}) {
  const discPrice = computeDiscountedPrice(product)
  const hasDiscount = discPrice < product.price
  const off = hasDiscount ? discountPercent(product.price, discPrice) : 0
  const discountLabel = product.discount
    ? product.discount.discountType === 'percentage'
      ? `${product.discount.discountValue}% OFF`
      : `${formatPrice(product.discount.discountValue)} OFF`
    : product.flashDeal && off > 0
      ? `${off}% OFF`
      : ''

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_4px_24px_-8px_rgba(0,0,0,.08)] transition hover:border-blue-200 hover:shadow-[0_8px_32px_-8px_rgba(37,99,235,.12)]">
      {off > 0 && (
        <span className="absolute left-2 top-2 z-10 rounded-lg bg-red-500 px-2 py-0.5 text-[11px] font-bold text-white shadow">
          -{off}%
        </span>
      )}
      <div className="relative h-[160px] w-full overflow-hidden bg-slate-50">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl text-slate-200">📦</div>
        )}
        {product.flashDeal && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-orange-600/90 to-transparent px-2 pb-1 pt-4">
            <span className="text-[10px] font-bold text-white">⚡ FLASH DEAL</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <span className="text-[10px] font-medium uppercase tracking-wider text-blue-500">
          {product.category}
        </span>
        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
          {product.shopName}
        </span>
        <h4 className="line-clamp-2 text-sm font-semibold text-slate-800">{product.name}</h4>
        <div className="mt-auto flex items-baseline gap-2">
          <span className={`text-base font-bold ${hasDiscount ? 'text-red-600' : 'text-slate-900'}`}>
            {formatPrice(discPrice)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-slate-400 line-through">{formatPrice(product.price)}</span>
          )}
        </div>
        {discountLabel ? (
          <span className="text-[11px] font-medium text-red-500">Discount: {discountLabel}</span>
        ) : null}
        <span className="text-[11px] text-slate-400">
          {product.quantity > 0 ? `${product.quantity} in stock` : 'Out of stock'}
        </span>
        <button
          onClick={() => onAdd(product)}
          disabled={product.quantity <= 0}
          className="mt-2 h-9 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-xs font-semibold text-white shadow-[0_4px_16px_-4px_rgba(37,99,235,.5)] transition hover:brightness-110 active:scale-[.97] disabled:opacity-40"
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
  const savings = originalTotal - bundlePrice

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-purple-200/60 bg-gradient-to-br from-purple-50 to-white shadow-[0_4px_24px_-8px_rgba(128,0,255,.1)]">
      <div className="border-b border-purple-100 bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3">
        <h4 className="text-sm font-bold text-white">🎁 {bundle.name || 'Bundle Deal'}</h4>
        {savings > 0 && (
          <p className="text-xs text-purple-200">Save {formatPrice(savings)}</p>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <span className="text-[10px] font-medium uppercase tracking-wider text-purple-500">
          {bundle.shopName}
        </span>
        {bundle.items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-purple-100 text-[10px] font-bold text-purple-600">
              {item.quantity}x
            </span>
            <span className="flex-1 truncate">{item.productName}</span>
            <span className="text-xs text-slate-400">{formatPrice(item.productPrice)}</span>
          </div>
        ))}
        <div className="mt-auto border-t border-purple-100 pt-2">
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold text-purple-700">{formatPrice(bundlePrice)}</span>
            {savings > 0 && (
              <span className="text-xs text-slate-400 line-through">{formatPrice(originalTotal)}</span>
            )}
          </div>
        </div>
        <button
          onClick={() => onAdd(bundle)}
          className="h-9 w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-xs font-semibold text-white shadow-[0_4px_16px_-4px_rgba(128,0,255,.4)] transition hover:brightness-110 active:scale-[.97]"
        >
          Add Bundle to Cart
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  CartDrawer                                                         */
/* ------------------------------------------------------------------ */

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

function CartDrawer({
  open,
  items,
  onClose,
  onUpdateQty,
  onRemove,
  voucherCode,
  onVoucherCodeChange,
  onApplyVoucher,
  voucherMessage,
  voucherDiscount,
  isApplyingVoucher,
  onCheckout,
  isCheckingOut,
}: {
  open: boolean
  items: CartItem[]
  onClose: () => void
  onUpdateQty: (productId: string, delta: number) => void
  onRemove: (productId: string) => void
  voucherCode: string
  onVoucherCodeChange: (v: string) => void
  onApplyVoucher: () => void
  voucherMessage: string | null
  voucherDiscount: number
  isApplyingVoucher: boolean
  onCheckout: () => void
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
        className={`fixed right-0 top-0 z-[70] flex h-full w-full max-w-[440px] flex-col bg-white shadow-2xl transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h3 className="text-lg font-bold text-slate-800">
            Shopping Cart <span className="text-sm font-normal text-slate-400">({items.length})</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 transition hover:text-slate-700">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
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
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3"
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
                        onClick={() => onUpdateQty(item.productId, -1)}
                        className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-100"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQty(item.productId, 1)}
                        className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-100"
                      >
                        +
                      </button>
                      <button
                        onClick={() => onRemove(item.productId)}
                        className="ml-auto text-xs text-red-400 hover:text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-slate-200 px-5 pb-5 pt-4">
            {/* Voucher */}
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-slate-600">Voucher Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={voucherCode}
                  onChange={(e) => onVoucherCodeChange(e.target.value)}
                  placeholder="Enter voucher code"
                  className="h-9 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
                <button
                  onClick={onApplyVoucher}
                  disabled={isApplyingVoucher || !voucherCode.trim()}
                  className="h-9 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {isApplyingVoucher ? '…' : 'Apply'}
                </button>
              </div>
              {voucherMessage && (
                <p className={`mt-1.5 text-xs ${voucherDiscount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {voucherMessage}
                </p>
              )}
            </div>

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
                <div className="flex justify-between text-green-600">
                  <span>Voucher Discount</span>
                  <span>-{formatPrice(voucherDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <button
              onClick={onCheckout}
              disabled={isCheckingOut}
              className="mt-4 h-11 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-[0_6px_20px_-6px_rgba(37,99,235,.6)] transition hover:brightness-110 active:scale-[.98] disabled:opacity-50"
            >
              {isCheckingOut ? 'Processing...' : `Checkout (Demo) — ${formatPrice(total)}`}
            </button>
          </div>
        )}
      </div>
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

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4">
      <div className="motion-rise w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M5 13L9 17L19 7" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-800">Purchase Successful!</h3>
        <p className="mt-2 text-sm text-slate-500">This is a demo transaction — no real payment was made.</p>

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

        <button
          onClick={onClose}
          className="mt-6 h-11 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-[0_4px_16px_-4px_rgba(37,99,235,.5)] transition hover:brightness-110"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  VoucherBadge (buyer can see available vouchers)                     */
/* ------------------------------------------------------------------ */

function VoucherBadge({ voucher }: { voucher: MarketplaceVoucher }) {
  const discLabel =
    voucher.discountType === 'percentage'
      ? `${voucher.discountValue}% OFF`
      : `₱${voucher.discountValue} OFF`

  return (
    <div className="flex items-center gap-3 rounded-xl border border-dashed border-orange-300 bg-orange-50 px-4 py-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100 text-lg">🏷️</div>
      <div className="flex-1">
        <p className="text-sm font-bold text-orange-700">{discLabel}</p>
        <p className="text-[10px] font-medium uppercase tracking-wider text-orange-500/80">
          {voucher.shopName}
        </p>
        <p className="text-xs text-orange-500">
          Code: <span className="font-mono font-bold">{voucher.code}</span>
          {voucher.minSpend > 0 && ` · Min. spend ₱${voucher.minSpend}`}
        </p>
      </div>
      <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-[10px] font-semibold text-orange-600">
        {(voucher.usageLimit ?? 0) - voucher.usedCount > 0
          ? `${(voucher.usageLimit ?? 0) - voucher.usedCount} left`
          : 'Active'}
      </span>
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

  // Filter
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  // Reset
  const [isResetting, setIsResetting] = useState(false)

  const flashScrollRef = useRef<HTMLDivElement>(null)

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

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

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
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === deal.productId && c.flashDealId === deal.id)
      if (existing) {
        return prev.map((c) =>
          c.productId === deal.productId && c.flashDealId === deal.id
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
          shopId: deal.shopId,
        },
      ]
    })
    setCartOpen(true)
    setPendingAddonTriggerIds([deal.productId])
  }

  const addProductToCart = (product: MarketplaceProduct) => {
    const discPrice = computeDiscountedPrice(product)
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === product.id)
      if (existing) {
        return prev.map((c) =>
          c.productId === product.id ? { ...c, quantity: c.quantity + 1 } : c,
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
          shopId: product.shopId,
        },
      ]
    })
    setCartOpen(true)
    setPendingAddonTriggerIds([product.id])
  }

  const addAddonToCart = (addon: AddonSuggestion) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === addon.addonProductId)
      if (existing) {
        return prev.map((c) =>
          c.productId === addon.addonProductId ? { ...c, quantity: c.quantity + 1 } : c,
        )
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
          shopId: addon.shopId,
        },
      ]
    })
    setCartOpen(true)
    setAddonModalOpen(false)
  }

  const addBundleToCart = (bundle: MarketplaceBundle) => {
    for (const item of bundle.items) {
      setCart((prev) => {
        const existing = prev.find((c) => c.productId === item.productId)
        if (existing) {
          return prev.map((c) =>
            c.productId === item.productId
              ? { ...c, quantity: c.quantity + item.quantity }
              : c,
          )
        }
        return [
          ...prev,
        {
          productId: item.productId,
          name: item.productName,
          price: bundle.price
            ? (bundle.price / bundle.items.reduce((s, b) => s + b.quantity, 0)) * item.quantity
            : item.productPrice,
          originalPrice: item.productPrice,
          quantity: item.quantity,
          image: item.productImage,
          flashDealId: null,
          discountId: null,
          shopId: bundle.shopId,
        },
      ]
    })
  }
    setCartOpen(true)
    const triggerIds = Array.from(new Set(bundle.items.map((item) => item.productId)))
    setPendingAddonTriggerIds(triggerIds)
  }

  const updateCartQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.productId === productId ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0),
    )
  }

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((c) => c.productId !== productId))
  }

  // ---- Voucher ----

  const handleApplyVoucher = async () => {
    if (!shopId || !voucherCode.trim()) return
    setIsApplyingVoucher(true)
    const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)
    const cartShopIds = new Set(cart.map((item) => item.shopId).filter(Boolean))
    if (cartShopIds.size > 1) {
      setVoucherMessage('Vouchers can only be used for items from a single shop.')
      setVoucherDiscount(0)
      setAppliedVoucherId(null)
      setIsApplyingVoucher(false)
      return
    }
    const result = await validateVoucher(voucherCode, subtotal, shopId, cart)
    setVoucherMessage(result.message)
    setVoucherDiscount(result.discount)
    setAppliedVoucherId(result.voucherId)
    setIsApplyingVoucher(false)
  }

  // ---- Checkout ----

  const handleCheckout = async () => {
    if (!shopId || cart.length === 0) return
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
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fc]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <p className="text-sm text-slate-500">Loading marketplace…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fc] p-4">
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
    <div className="min-h-screen bg-[#f5f7fc]">
      {/* ===== Top Header ===== */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-4 px-4 sm:px-6">
          <img src="/Asset/unleash_logo.png" alt="Unleash" className="h-8 w-8 object-contain" />
          <h1 className="text-lg font-bold text-slate-800">
            Unleash <span className="font-normal text-slate-400">Marketplace</span>
          </h1>

          {/* Search */}
          <div className="ml-auto flex max-w-xs flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3">
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

          {/* Cart button */}
          <button
            onClick={() => setCartOpen(true)}
            className="relative ml-2 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
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

          {/* Back button */}
          <button
            onClick={async () => {
              if (isLoggingOut) return
              setIsLoggingOut(true)
              await supabase.auth.signOut()
              setIsLoggingOut(false)
              navigate('/', { replace: true })
            }}
            disabled={isLoggingOut}
            className="hidden h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-xs font-medium text-slate-600 transition hover:border-red-200 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-60 sm:flex"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M9 21H5C3.89 21 3 20.1 3 19V5C3 3.9 3.89 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 pb-24 pt-6 sm:px-6">
        {/* ===== Flash Deals ===== */}
        {flashDeals.length > 0 && (
          <section className="mb-10">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 items-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 px-3">
                <span className="text-sm">⚡</span>
                <span className="text-xs font-bold text-white">FLASH DEALS</span>
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-orange-200 to-transparent" />
            </div>
            <div
              ref={flashScrollRef}
              className="scrollbar-hide -mx-4 flex gap-4 overflow-x-auto px-4 pb-2"
            >
              {flashDeals.map((deal) => (
                <FlashDealCard key={deal.id} deal={deal} onAdd={addFlashDealToCart} />
              ))}
            </div>
          </section>
        )}

        {/* ===== Available Vouchers ===== */}
        {vouchers.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-3 text-sm font-bold text-slate-700">🏷️ Available Vouchers</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {vouchers.slice(0, 6).map((v) => (
                <VoucherBadge key={v.id} voucher={v} />
              ))}
            </div>
          </section>
        )}

        {/* ===== Bundles ===== */}
        {bundles.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-3 text-sm font-bold text-slate-700">🎁 Bundle Deals</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {bundles.map((b) => (
                <BundleCard key={b.id} bundle={b} onAdd={addBundleToCart} />
              ))}
            </div>
          </section>
        )}

        {/* ===== Category tabs ===== */}
        <section className="mb-6">
          <div className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 pb-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition ${
                  activeCategory === cat
                    ? 'bg-blue-600 text-white shadow-[0_2px_8px_-2px_rgba(37,99,235,.5)]'
                    : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* ===== Product Grid ===== */}
        <section>
          <h2 className="mb-4 text-sm font-bold text-slate-700">
            All Products {activeCategory !== 'All' && `· ${activeCategory}`}
          </h2>
          {filteredProducts.length === 0 ? (
            <div className="rounded-2xl bg-white py-16 text-center text-slate-400 shadow-sm">
              <p className="text-sm">No products found.</p>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} onAdd={addProductToCart} />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* ===== Cart Drawer ===== */}
      <CartDrawer
        open={cartOpen}
        items={cart}
        onClose={() => setCartOpen(false)}
        onUpdateQty={updateCartQty}
        onRemove={removeFromCart}
        voucherCode={voucherCode}
        onVoucherCodeChange={setVoucherCode}
        onApplyVoucher={handleApplyVoucher}
        voucherMessage={voucherMessage}
        voucherDiscount={voucherDiscount}
        isApplyingVoucher={isApplyingVoucher}
        onCheckout={handleCheckout}
        isCheckingOut={isCheckingOut}
      />

      <AddonSuggestionModal
        open={addonModalOpen}
        suggestions={addonModalItems}
        onClose={() => setAddonModalOpen(false)}
        onAddAddon={addAddonToCart}
      />

      {/* ===== Checkout Success Modal ===== */}
      <CheckoutSuccessModal
        show={showSuccess}
        result={checkoutResult}
        onClose={() => setShowSuccess(false)}
      />

      {/* ===== Floating Actions ===== */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        <button
          onClick={handleReset}
          disabled={isResetting}
          className="flex h-12 items-center gap-2 rounded-2xl bg-white px-5 text-xs font-semibold text-slate-600 shadow-[0_8px_30px_-8px_rgba(0,0,0,.2)] ring-1 ring-slate-200/80 transition hover:ring-blue-300 hover:text-blue-600 disabled:opacity-50"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M1 4V10H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3.51 15A9 9 0 1 0 5.64 5.64L1 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {isResetting ? 'Resetting…' : 'Reset Demo'}
        </button>
      </div>
    </div>
  )
}

export default ShopDemoPage

