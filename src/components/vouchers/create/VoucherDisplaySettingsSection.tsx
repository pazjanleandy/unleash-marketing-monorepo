import { useId, useState, useEffect } from 'react'
import type { ProductScope, VoucherDisplaySetting, VoucherType } from './types'
import { getCurrentUserShopId, listShopProducts } from '../../../services/market/vouchers.repo'

type ShopProduct = {
  product_id: string
  prodname: string
  price: number | null
  image: string | null
  status: string
}

type VoucherDisplaySettingsSectionProps = {
  voucherType: VoucherType
  displaySetting: VoucherDisplaySetting
  productScope: ProductScope
  selectedProductIds: string[]
  livestreamUrl: string
  videoUrl: string
  onDisplaySettingChange: (value: VoucherDisplaySetting) => void
  onProductScopeChange?: (value: ProductScope) => void
  onSelectedProductIdsChange?: (value: string[]) => void
  onLivestreamUrlChange?: (value: string) => void
  onVideoUrlChange?: (value: string) => void
  displaySettingError?: string
  displaySettingInputIds?: {
    allPages: string
    voucherCode: string
  }
}

function VoucherDisplaySettingsSection({
  voucherType,
  displaySetting,
  productScope,
  selectedProductIds,
  livestreamUrl,
  videoUrl,
  onDisplaySettingChange,
  onSelectedProductIdsChange,
  onLivestreamUrlChange,
  onVideoUrlChange,
  displaySettingError,
  displaySettingInputIds,
}: VoucherDisplaySettingsSectionProps) {
  const displaySettingGroupName = useId()
  const [shopProducts, setShopProducts] = useState<ShopProduct[]>([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [productSearchQuery, setProductSearchQuery] = useState('')

  const showDisplayToggle = voucherType === 'shop'
  const showProductPicker = voucherType === 'product'
  const showLivestreamInput = voucherType === 'live'
  const showVideoInput = voucherType === 'video'
  const isPrivate = voucherType === 'private'

  useEffect(() => {
    if (!showProductPicker) {
      return
    }

    let cancelled = false

    const loadProducts = async () => {
      setProductsLoading(true)

      try {
        const { shopId } = await getCurrentUserShopId()
        if (!shopId || cancelled) {
          return
        }

        const products = await listShopProducts(shopId)
        if (!cancelled && products) {
          setShopProducts(products as ShopProduct[])
        }
      } catch {
        // Silently fail, products will be empty
      } finally {
        if (!cancelled) {
          setProductsLoading(false)
        }
      }
    }

    void loadProducts()

    return () => {
      cancelled = true
    }
  }, [showProductPicker])

  const filteredProducts = productSearchQuery.trim()
    ? shopProducts.filter((p) =>
      p.prodname.toLowerCase().includes(productSearchQuery.trim().toLowerCase()),
    )
    : shopProducts

  const toggleProduct = (productId: string) => {
    if (!onSelectedProductIdsChange) {
      return
    }
    if (selectedProductIds.includes(productId)) {
      onSelectedProductIdsChange(selectedProductIds.filter((id) => id !== productId))
    } else {
      onSelectedProductIdsChange([...selectedProductIds, productId])
    }
  }

  const applicableProductsLabel =
    productScope === 'specific-products'
      ? `${selectedProductIds.length} product${selectedProductIds.length !== 1 ? 's' : ''} selected`
      : 'all products'

  return (
    <section className="rounded-lg border border-[#E6EBFF] bg-[#f8fbff] px-5 py-5">
      {/* Display Setting Toggle – only for Shop Voucher */}
      {showDisplayToggle ? (
        <div className="grid gap-4 sm:grid-cols-[190px_minmax(0,1fr)] sm:items-start">
          <fieldset className="sm:col-span-2">
            <div className="flex items-center justify-between gap-2">
              <legend className="text-sm font-medium text-slate-700">
                Voucher Display Setting
              </legend>
              <a href="#" className="text-xs font-medium text-[#3347A8] hover:underline">
                Learn more
              </a>
            </div>

            <div
              className="mt-2 grid gap-2 sm:grid-cols-2"
              role="radiogroup"
              aria-invalid={Boolean(displaySettingError)}
            >
              <label className="block">
                <input
                  id={displaySettingInputIds?.allPages}
                  type="radio"
                  name={displaySettingGroupName}
                  checked={displaySetting === 'all-pages'}
                  onChange={() => onDisplaySettingChange('all-pages')}
                  aria-invalid={Boolean(displaySettingError)}
                  className="peer sr-only"
                />
                <span className="inline-flex min-h-[52px] w-full cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-3 text-center text-[13px] font-medium leading-snug text-slate-700 shadow-sm transition duration-150 hover:bg-slate-50 active:scale-[0.98] active:bg-slate-100 peer-checked:border-indigo-600 peer-checked:bg-indigo-600 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-[#B1C2EC] peer-focus-visible:ring-offset-1">
                  Display on all pages
                </span>
              </label>

              <label className="block">
                <input
                  id={displaySettingInputIds?.voucherCode}
                  type="radio"
                  name={displaySettingGroupName}
                  checked={displaySetting === 'voucher-code'}
                  onChange={() => onDisplaySettingChange('voucher-code')}
                  aria-invalid={Boolean(displaySettingError)}
                  className="peer sr-only"
                />
                <span className="inline-flex min-h-[52px] w-full cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-3 text-center text-[13px] font-medium leading-snug text-slate-700 shadow-sm transition duration-150 hover:bg-slate-50 active:scale-[0.98] active:bg-slate-100 peer-checked:border-indigo-600 peer-checked:bg-indigo-600 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-[#B1C2EC] peer-focus-visible:ring-offset-1">
                  Shared through voucher code
                </span>
              </label>
            </div>
          </fieldset>
        </div>
      ) : null}

      {displaySettingError ? (
        <p className="mt-2 text-[13px] text-[#b91c1c]">{displaySettingError}</p>
      ) : null}

      {/* Private Voucher Notice */}
      {isPrivate ? (
        <div className="rounded-lg border border-[#c4b5fd] bg-[#f5f3ff] px-4 py-3">
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[#7c3aed]">
              <path d="M12 2C9.24 2 7 4.24 7 7V10H5V22H19V10H17V7C17 4.24 14.76 2 12 2ZM12 4C13.66 4 15 5.34 15 7V10H9V7C9 5.34 10.34 4 12 4ZM12 17C10.9 17 10 16.1 10 15C10 13.9 10.9 13 12 13C13.1 13 14 13.9 14 15C14 16.1 13.1 17 12 17Z" fill="currentColor" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-[#5b21b6]">Private Distribution</p>
              <p className="mt-0.5 text-xs text-[#7c3aed]">
                This voucher is code-only. It will not appear on your shop page. Share the code directly with specific customers via email, messaging, or social media.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Livestream URL Input */}
      {showLivestreamInput ? (
        <div className="space-y-2">
          <div className="rounded-lg border border-[#fbbf24] bg-[#fffbeb] px-4 py-3">
            <div className="flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[#d97706]">
                <circle cx="12" cy="12" r="3" fill="currentColor" />
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12" stroke="currentColor" strokeWidth="1.8" />
                <path d="M17 7L22 2M22 2V7M22 2H17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-[#92400e]">Livestream Voucher</p>
                <p className="mt-0.5 text-xs text-[#b45309]">
                  Viewers can claim this voucher during your live session. It will only be active while the livestream is happening.
                </p>
              </div>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="voucher-livestream-url">
              Livestream URL <span className="text-xs font-normal text-slate-400">(optional)</span>
            </label>
            <input
              id="voucher-livestream-url"
              type="url"
              value={livestreamUrl}
              onChange={(e) => onLivestreamUrlChange?.(e.target.value)}
              placeholder="https://example.com/live/your-stream"
              className="mt-1.5 h-11 w-full rounded-md border border-[#b8c2d3] bg-white px-3 text-[14px] text-slate-900 placeholder:text-slate-400 focus:border-[#3A56C5] focus:outline-none focus:ring-1 focus:ring-[#B1C2EC]"
            />
          </div>
        </div>
      ) : null}

      {/* Video URL Input */}
      {showVideoInput ? (
        <div className="space-y-2">
          <div className="rounded-lg border border-[#f9a8d4] bg-[#fdf2f8] px-4 py-3">
            <div className="flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[#db2777]">
                <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.8" />
                <path d="M10 8.5L16 12L10 15.5V8.5Z" fill="currentColor" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-[#9d174d]">Video Voucher</p>
                <p className="mt-0.5 text-xs text-[#be185d]">
                  This voucher is linked to a product video. Viewers can claim it while watching, encouraging engagement and conversions.
                </p>
              </div>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="voucher-video-url">
              Video URL <span className="text-xs font-normal text-slate-400">(optional)</span>
            </label>
            <input
              id="voucher-video-url"
              type="url"
              value={videoUrl}
              onChange={(e) => onVideoUrlChange?.(e.target.value)}
              placeholder="https://example.com/video/your-product-video"
              className="mt-1.5 h-11 w-full rounded-md border border-[#b8c2d3] bg-white px-3 text-[14px] text-slate-900 placeholder:text-slate-400 focus:border-[#3A56C5] focus:outline-none focus:ring-1 focus:ring-[#B1C2EC]"
            />
          </div>
        </div>
      ) : null}

      {/* Product Picker for Product Voucher */}
      {showProductPicker ? (
        <div className="space-y-3">
          <div className="rounded-lg border border-[#86efac] bg-[#f0fdf4] px-4 py-3">
            <div className="flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[#16a34a]">
                <path d="M20 7L12 3L4 7V17L12 21L20 17V7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M12 12L4 7M12 12L20 7M12 12V21" stroke="currentColor" strokeWidth="1.8" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-[#15803d]">Product-Specific Voucher</p>
                <p className="mt-0.5 text-xs text-[#16a34a]">
                  Select the products this voucher applies to. Customers can only use it on the chosen items.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="voucher-product-search">
              Select Products
            </label>
            <input
              id="voucher-product-search"
              type="text"
              value={productSearchQuery}
              onChange={(e) => setProductSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="mt-1.5 h-10 w-full rounded-md border border-[#b8c2d3] bg-white px-3 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-[#3A56C5] focus:outline-none focus:ring-1 focus:ring-[#B1C2EC]"
            />
          </div>

          {productsLoading ? (
            <p className="py-4 text-center text-sm text-slate-500">Loading products...</p>
          ) : filteredProducts.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-500">
              {productSearchQuery.trim() ? 'No products match your search.' : 'No products available.'}
            </p>
          ) : (
            <div className="max-h-[260px] space-y-1 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2">
              {filteredProducts.map((product) => {
                const isSelected = selectedProductIds.includes(product.product_id)
                return (
                  <label
                    key={product.product_id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition ${isSelected
                        ? 'bg-[#F2F4FF] ring-1 ring-[#D0DBF7]'
                        : 'hover:bg-slate-50'
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleProduct(product.product_id)}
                      className="h-4 w-4 rounded border-slate-300 text-[#3A56C5] focus:ring-[#B1C2EC]"
                    />
                    {product.image ? (
                      <img
                        src={product.image}
                        alt=""
                        className="h-9 w-9 rounded-md border border-slate-200 object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-slate-100 text-[10px] font-medium text-slate-400">
                        IMG
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-slate-800">
                        {product.prodname}
                      </p>
                      {product.price !== null ? (
                        <p className="text-[11px] text-slate-500">
                          PHP {product.price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </p>
                      ) : null}
                    </div>
                  </label>
                )
              })}
            </div>
          )}

          {selectedProductIds.length > 0 ? (
            <p className="text-xs font-medium text-[#3347A8]">
              {selectedProductIds.length} product{selectedProductIds.length !== 1 ? 's' : ''} selected
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Applicable Products summary */}
      {!showProductPicker ? (
        <div className={`grid gap-3 border-t border-[#e2e8f0] pt-4 sm:grid-cols-[190px_minmax(0,1fr)] sm:items-start ${showDisplayToggle || isPrivate || showLivestreamInput || showVideoInput ? 'mt-5' : ''}`}>
          <p className="pt-1 text-sm text-slate-700">Applicable Products</p>
          <div>
            <p className="text-sm font-medium text-slate-900">{applicableProductsLabel}</p>
            <p className="mt-1 text-xs text-slate-500">
              {isPrivate
                ? 'This voucher applies to all products but is only accessible via code.'
                : 'Buyers can use this voucher for all products in the shop.'}
            </p>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default VoucherDisplaySettingsSection

