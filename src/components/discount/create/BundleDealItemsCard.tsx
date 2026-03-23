import { useEffect, useMemo, useState } from 'react'
import ProductThumbnail from '../../common/ProductThumbnail'
import type { BundleDealItem, CreateBundleDealForm } from './types'
import { listShopProducts, type ShopProduct } from '../../../services/market/products.repo'
import ProductPickerModal from './ProductPickerModal'

type BundleDealItemsCardProps = {
  value: CreateBundleDealForm
  onChange: (value: CreateBundleDealForm) => void
  mobileVariant?: boolean
}

type DisplayProduct = ShopProduct

function toCurrency(value: number) {
  return value.toFixed(2)
}

function BundleDealItemsCard({ value, onChange, mobileVariant = false }: BundleDealItemsCardProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [catalogItems, setCatalogItems] = useState<DisplayProduct[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [isAuthRequired, setIsAuthRequired] = useState(false)
  const [hasNoShop, setHasNoShop] = useState(false)
  const [quantityWarningByProductId, setQuantityWarningByProductId] = useState<
    Record<string, string>
  >({})

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
      value.items.map((item, index) => {
        const foundProduct = catalogItems.find((product) => product.id === item.productId)

        if (foundProduct) {
          return foundProduct
        }

        return {
          id: item.productId || `LEGACY-${index + 1}`,
          name: item.productId || `Legacy Product ${index + 1}`,
          category: 'Legacy Product',
          price: 0,
          stock: 0,
          sales: 0,
          status: 'avail',
          image: null,
        }
      }),
    [catalogItems, value.items],
  )

  const handleAddProducts = () => {
    if (isAuthRequired || hasNoShop) {
      return
    }

    setIsPickerOpen(true)
  }

  const handleConfirmSelection = (nextSelection: string[]) => {
    const nextItems = nextSelection.map<BundleDealItem>((productId) => {
      const existing = value.items.find((item) => item.productId === productId)
      // `quantity: 0` represents "unset" in the form; validation blocks submit until it is >= 1.
      return existing ?? { productId, quantity: 0 }
    })

    onChange({
      ...value,
      items: nextItems,
    })
    setIsPickerOpen(false)
  }

  const handleRemoveProduct = (index: number) => {
    const nextItems = value.items.filter((_, itemIndex) => itemIndex !== index)
    onChange({ ...value, items: nextItems })
  }

  const handleQuantityChange = (index: number, nextValue: string, maxStock: number) => {
    const sanitized = nextValue.replace(/\D/g, '')
    const parsed = sanitized.length === 0 ? 0 : Math.max(1, Math.floor(Number(sanitized)))
    const productId = value.items[index]?.productId ?? ''
    const hasMaxStock = Number.isFinite(maxStock) && maxStock >= 0
    const clamped = hasMaxStock ? Math.min(parsed, maxStock) : parsed

    if (productId && parsed > clamped) {
      setQuantityWarningByProductId((previous) => ({
        ...previous,
        [productId]: "Can't input quantity more than the product stock",
      }))
      window.setTimeout(() => {
        setQuantityWarningByProductId((previous) => {
          if (previous[productId] !== "Can't input quantity more than the product stock") {
            return previous
          }
          const next = { ...previous }
          delete next[productId]
          return next
        })
      }, 2500)
    } else if (productId && quantityWarningByProductId[productId]) {
      setQuantityWarningByProductId((previous) => {
        const next = { ...previous }
        delete next[productId]
        return next
      })
    }

    const nextItems = value.items.map((item, itemIndex) =>
      itemIndex === index ? { ...item, quantity: clamped } : item,
    )
    onChange({ ...value, items: nextItems })
  }

  const canManageProducts = !isAuthRequired && !hasNoShop

  if (mobileVariant) {
    return (
      <article className="px-4 py-3">
        <div className="flex items-start justify-between gap-4">
          <p className="pt-1 text-[13px] font-medium text-slate-700">Bundle Items</p>
          <button
            type="button"
            onClick={handleAddProducts}
            disabled={!canManageProducts || isLoading}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#D0DBF7] bg-white px-3 text-xs font-semibold text-[#3347A8] transition hover:bg-[#f8fbff] active:bg-[#F2F4FF] disabled:cursor-not-allowed disabled:opacity-45"
          >
            <span className="text-base leading-none">+</span>
            <span>Add Item(s)</span>
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
              className="font-semibold text-[#3347A8] hover:underline"
            >
              Retry
            </button>
          </div>
        ) : null}

        {selectedProducts.length > 0 ? (
          <div className="mt-3 space-y-2.5">
            {selectedProducts.map((product, index) => {
              const item = value.items[index]

              return (
                <div
                  key={`${product.name}-${index}`}
                  className="rounded-xl border border-[#E6EBFF] bg-[#f8fbff] p-2.5"
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
                      <p className="mt-1 text-xs text-slate-500">
                        Price: PHP {toCurrency(product.price)}
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
                    <p className="text-xs text-slate-600">Quantity</p>
                    <div className="text-right">
                      <div className="flex h-9 items-center rounded-md border border-[#cbd5e1] bg-white px-2">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={item?.quantity ? `${item.quantity}` : ''}
                          onChange={(event) =>
                            handleQuantityChange(index, event.target.value, product.stock)
                          }
                          placeholder="Qty"
                          className="w-12 border-0 bg-transparent text-right text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                        />
                        <span className="ml-1 text-[11px] font-semibold text-slate-400">pcs</span>
                      </div>
                      {item?.productId && quantityWarningByProductId[item.productId] ? (
                        <p className="mt-1 text-[11px] font-medium text-[#b91c1c]">
                          {quantityWarningByProductId[item.productId]}
                        </p>
                      ) : null}
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
          selectedProductIds={value.items.map((item) => item.productId)}
          onConfirmSelection={handleConfirmSelection}
          minSelectionCount={2}
          subtitle="Choose products for this bundle deal."
        />
      </article>
    )
  }

  return (
    <article className="rounded-xl border border-[#E6EBFF] bg-white p-4 shadow-[0_10px_30px_-28px_rgba(15,23,42,0.8)] sm:p-5">
      <header>
        <h2 className="text-xl font-semibold text-[#33458F]">Bundle Items</h2>
        <p className="mt-1 text-sm text-slate-600">
          Add products to include in this bundle and set quantities..
        </p>
      </header>

      <div className="mt-4">
        <button
          type="button"
          onClick={handleAddProducts}
          disabled={!canManageProducts || isLoading}
          className="inline-flex h-10 items-center rounded-md border border-[#B1C2EC] bg-[#F2F4FF] px-4 text-sm font-semibold text-[#3347A8] transition hover:bg-[#E6EBFF] disabled:cursor-not-allowed disabled:opacity-45"
        >
          + Add Items
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
            className="font-semibold text-[#3347A8] hover:underline"
          >
            Retry
          </button>
        </div>
      ) : null}

      {selectedProducts.length > 0 ? (
        <div className="mt-4 overflow-hidden rounded-lg border border-[#E6EBFF]">
          <div className="grid grid-cols-[minmax(0,1fr)_120px_120px_78px] border-b border-[#E6EBFF] bg-[#f8fbff] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#3347A8]">
            <p>Product</p>
            <p>Price</p>
            <p>Quantity</p>
            <p>Action</p>
          </div>

          <div className="divide-y divide-[#E6EBFF] bg-white">
            {selectedProducts.map((product, index) => {
              const item = value.items[index]

              return (
                <div
                  key={`${product.name}-${index}`}
                  className="grid grid-cols-[minmax(0,1fr)_120px_120px_78px] items-center gap-2 px-3 py-2.5"
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

                  <div className="text-right">
                    <div className="flex h-9 items-center rounded-md border border-[#cbd5e1] bg-white px-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={item?.quantity ? `${item.quantity}` : ''}
                        onChange={(event) =>
                          handleQuantityChange(index, event.target.value, product.stock)
                        }
                        placeholder="Qty"
                        className="w-14 border-0 bg-transparent text-right text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                      />
                      <span className="ml-1 text-[11px] font-semibold text-slate-400">pcs</span>
                    </div>
                    {item?.productId && quantityWarningByProductId[item.productId] ? (
                      <p className="mt-1 text-[11px] font-medium text-[#b91c1c]">
                        {quantityWarningByProductId[item.productId]}
                      </p>
                    ) : null}
                  </div>

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
        <div className="mt-4 rounded-lg border border-dashed border-[#D0DBF7] bg-[#f8fbff] px-3 py-5 text-sm text-slate-500">
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
        selectedProductIds={value.items.map((item) => item.productId)}
        onConfirmSelection={handleConfirmSelection}
        minSelectionCount={2}
        subtitle="Choose products for this bundle deal."
      />
    </article>
  )
}

export default BundleDealItemsCard



