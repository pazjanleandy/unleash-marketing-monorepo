import { useEffect, useMemo, useState } from 'react'
import ProductThumbnail from '../../common/ProductThumbnail'
import type { CreateDiscountPromotionForm } from './types'
import { listShopProducts, type ShopProduct } from '../../../services/market/products.repo'
import ProductPickerModal from './ProductPickerModal'

type DiscountPromotionProductsCardProps = {
  value: CreateDiscountPromotionForm
  onChange: (value: CreateDiscountPromotionForm) => void
  mobileVariant?: boolean
}

type DisplayProduct = ShopProduct

function toCurrency(value: number) {
  return value.toFixed(2)
}

function DiscountPromotionProductsCard({
  value,
  onChange,
  mobileVariant = false,
}: DiscountPromotionProductsCardProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [catalogItems, setCatalogItems] = useState<DisplayProduct[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [isAuthRequired, setIsAuthRequired] = useState(false)
  const [hasNoShop, setHasNoShop] = useState(false)

  const loadProducts = async () => {
    setIsLoading(true)
    setLoadError('')

    try {
      const result = await listShopProducts()
      setCatalogItems(result.items)
      setIsAuthRequired(result.authRequired)
      setHasNoShop(result.noShop)
    } catch (error) {
      setCatalogItems([])
      setIsAuthRequired(false)
      setHasNoShop(false)
      setLoadError(error instanceof Error ? error.message : 'Unable to load products.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadProducts()
  }, [])

  const selectedProducts = useMemo<DisplayProduct[]>(
    () =>
      value.products.map((productId, index) => {
        const foundProduct = catalogItems.find((product) => product.id === productId)

        if (foundProduct) {
          return foundProduct
        }

        return {
          id: productId || `LEGACY-${index + 1}`,
          name: productId || `Legacy Product ${index + 1}`,
          category: 'Legacy Product',
          price: 0,
          stock: 0,
          sales: 0,
          status: 'avail',
          image: null,
        }
      }),
    [catalogItems, value.products],
  )

  const handleAddProducts = () => {
    if (isAuthRequired || hasNoShop) {
      return
    }

    setIsPickerOpen(true)
  }

  const handleConfirmSelection = (nextSelection: string[]) => {
    const nextDiscounts = nextSelection.reduce<Record<string, string>>(
      (accumulator, productId) => {
        accumulator[productId] = value.productDiscounts[productId] ?? ''
        return accumulator
      },
      {},
    )

    onChange({
      ...value,
      products: nextSelection,
      productDiscounts: nextDiscounts,
    })
    setIsPickerOpen(false)
  }

  const handleRemoveProduct = (index: number) => {
    const nextProducts = value.products.filter((_, productIndex) => productIndex !== index)
    const nextDiscounts = nextProducts.reduce<Record<string, string>>(
      (accumulator, productId) => {
        accumulator[productId] = value.productDiscounts[productId] ?? ''
        return accumulator
      },
      {},
    )

    onChange({
      ...value,
      products: nextProducts,
      productDiscounts: nextDiscounts,
    })
  }

  const handleDiscountInputChange = (productId: string, nextValue: string) => {
    let sanitized = nextValue.replace(/[^\d.]/g, '')
    const firstDot = sanitized.indexOf('.')

    if (firstDot !== -1) {
      sanitized = sanitized.slice(0, firstDot + 1) + sanitized.slice(firstDot + 1).replace(/\./g, '')
    }

    if (sanitized.startsWith('.')) {
      sanitized = `0${sanitized}`
    }

    if (sanitized) {
      const parsed = Number(sanitized)
      if (!Number.isNaN(parsed) && parsed > 100) {
        sanitized = '100'
      }
    }

    onChange({
      ...value,
      productDiscounts: {
        ...value.productDiscounts,
        [productId]: sanitized,
      },
    })
  }

  const getDiscountedPrice = (price: number, discountText: string) => {
    if (!discountText) {
      return price
    }

    const parsedDiscount = Number(discountText)
    if (Number.isNaN(parsedDiscount)) {
      return price
    }

    const normalizedDiscount = Math.min(Math.max(parsedDiscount, 0), 100)
    return price * (1 - normalizedDiscount / 100)
  }

  const canManageProducts = !isAuthRequired && !hasNoShop

  if (mobileVariant) {
    return (
      <article className="px-4 py-3">
        <div className="flex items-start justify-between gap-4">
          <p className="pt-1 text-[13px] font-medium text-slate-700">Products</p>
          <button
            type="button"
            onClick={handleAddProducts}
            disabled={!canManageProducts || isLoading}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#bfdbfe] bg-white px-3 text-xs font-semibold text-[#1d4ed8] transition hover:bg-[#f8fbff] active:bg-[#eff6ff] disabled:cursor-not-allowed disabled:opacity-45"
          >
            <span className="text-base leading-none">+</span>
            <span>Add Product(s)</span>
          </button>
        </div>
        {isLoading ? (
          <p className="mt-2 text-xs text-slate-500">Loading products...</p>
        ) : isAuthRequired ? (
          <p className="mt-2 text-xs text-slate-500">Sign in to manage products.</p>
        ) : hasNoShop ? (
          <p className="mt-2 text-xs text-slate-500">No shop found for this account.</p>
        ) : loadError ? (
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
            <span>{loadError}</span>
            <button
              type="button"
              onClick={() => void loadProducts()}
              className="font-semibold text-[#1d4ed8] hover:underline"
            >
              Retry
            </button>
          </div>
        ) : null}

        {selectedProducts.length > 0 ? (
          <div className="mt-3 space-y-2.5">
            {selectedProducts.map((product, index) => {
              const discountValue = value.productDiscounts[product.id] ?? ''
              const discountedPrice = getDiscountedPrice(product.price, discountValue)

              return (
                <div
                  key={`${product.name}-${index}`}
                  className="rounded-xl border border-[#dbeafe] bg-[#f8fbff] p-2.5"
                >
                  <div className="flex items-start gap-2.5">
                    <ProductThumbnail name={product.name} image={product.image} />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-semibold text-slate-900">
                        {product.name}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        ID: {product.id} | {product.category}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveProduct(index)}
                      className="rounded-md border border-[#fdc4ac] bg-white px-2 py-1 text-[11px] font-semibold text-[#dc4f1f] transition hover:bg-[#fff4ef]"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <p className="text-xs text-slate-600">
                      PHP {toCurrency(product.price)} {'->'}{' '}
                      <span className="font-semibold text-[#1d4ed8]">
                        PHP {toCurrency(discountedPrice)}
                      </span>
                    </p>
                    <div className="flex h-9 items-center rounded-md border border-[#cbd5e1] bg-white px-2">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={discountValue}
                        onChange={(event) =>
                          handleDiscountInputChange(product.id, event.target.value)
                        }
                        placeholder="0"
                        className="w-14 border-0 bg-transparent text-right text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                      />
                      <span className="ml-1 text-[11px] font-semibold text-slate-400">% OFF</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : null}

        <ProductPickerModal
          isOpen={isPickerOpen}
          onClose={() => setIsPickerOpen(false)}
          catalogItems={catalogItems}
          isLoading={isLoading}
          loadError={loadError}
          isAuthRequired={isAuthRequired}
          hasNoShop={hasNoShop}
          onRetry={() => void loadProducts()}
          selectedProductIds={value.products}
          onConfirmSelection={handleConfirmSelection}
          subtitle="Choose products for this discount promotion."
        />
      </article>
    )
  }

  return (
    <article className="rounded-xl border border-[#dbeafe] bg-white p-4 shadow-[0_10px_30px_-28px_rgba(15,23,42,0.8)] sm:p-5">
      <header>
        <h2 className="text-xl font-semibold text-[#1E40AF]">Discount Promotion Products</h2>
        <p className="mt-1 text-sm text-slate-600">
          Add products to discount promotion and set discount prices..
        </p>
      </header>

      <div className="mt-4">
        <button
          type="button"
          onClick={handleAddProducts}
          disabled={!canManageProducts || isLoading}
          className="inline-flex h-10 items-center rounded-md border border-[#93c5fd] bg-[#eff6ff] px-4 text-sm font-semibold text-[#1d4ed8] transition hover:bg-[#dbeafe] disabled:cursor-not-allowed disabled:opacity-45"
        >
          + Add Products
        </button>
      </div>
      {isLoading ? (
        <p className="mt-2 text-xs text-slate-500">Loading products...</p>
      ) : isAuthRequired ? (
        <p className="mt-2 text-xs text-slate-500">Sign in to manage products.</p>
      ) : hasNoShop ? (
        <p className="mt-2 text-xs text-slate-500">No shop found for this account.</p>
      ) : loadError ? (
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
          <span>{loadError}</span>
          <button
            type="button"
            onClick={() => void loadProducts()}
            className="font-semibold text-[#1d4ed8] hover:underline"
          >
            Retry
          </button>
        </div>
      ) : null}

      {selectedProducts.length > 0 ? (
        <div className="mt-4 overflow-hidden rounded-lg border border-[#dbeafe]">
          <div className="grid grid-cols-[minmax(0,1fr)_130px_130px_130px_78px] border-b border-[#dbeafe] bg-[#f8fbff] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#1d4ed8]">
            <p>Product</p>
            <p>Original</p>
            <p>Discount</p>
            <p>Now</p>
            <p>Action</p>
          </div>

          <div className="divide-y divide-[#dbeafe] bg-white">
            {selectedProducts.map((product, index) => {
              const discountValue = value.productDiscounts[product.id] ?? ''
              const discountedPrice = getDiscountedPrice(product.price, discountValue)

              return (
                <div
                  key={`${product.name}-${index}`}
                  className="grid grid-cols-[minmax(0,1fr)_130px_130px_130px_78px] items-center gap-2 px-3 py-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    <ProductThumbnail name={product.name} image={product.image} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{product.name}</p>
                      <p className="text-xs text-slate-500">
                        ID: {product.id} | {product.category}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm font-medium text-slate-700">
                    PHP {toCurrency(product.price)}
                  </p>

                  <div className="flex h-9 items-center rounded-md border border-[#cbd5e1] bg-white px-2">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={discountValue}
                      onChange={(event) => handleDiscountInputChange(product.id, event.target.value)}
                      placeholder="0"
                      className="w-16 border-0 bg-transparent text-right text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    />
                    <span className="ml-1 text-[11px] font-semibold text-slate-400">% OFF</span>
                  </div>

                  <p className="text-sm font-semibold text-[#1d4ed8]">
                    PHP {toCurrency(discountedPrice)}
                  </p>

                  <button
                    type="button"
                    onClick={() => handleRemoveProduct(index)}
                    className="inline-flex h-8 items-center justify-center rounded-md border border-[#fdc4ac] bg-white px-2 text-xs font-semibold text-[#dc4f1f] transition hover:bg-[#fff4ef]"
                  >
                    Delete
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-dashed border-[#bfdbfe] bg-[#f8fbff] px-3 py-5 text-sm text-slate-500">
          No products added yet..
        </div>
      )}

      <ProductPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        catalogItems={catalogItems}
        isLoading={isLoading}
        loadError={loadError}
        isAuthRequired={isAuthRequired}
        hasNoShop={hasNoShop}
        onRetry={() => void loadProducts()}
        selectedProductIds={value.products}
        onConfirmSelection={handleConfirmSelection}
        subtitle="Choose products for this discount promotion."
      />
    </article>
  )
}

export default DiscountPromotionProductsCard
