import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { CreateDiscountPromotionForm } from './types'
import { listShopProducts, type ShopProduct } from '../../../services/market/products.repo'

type DiscountPromotionProductsCardProps = {
  value: CreateDiscountPromotionForm
  onChange: (value: CreateDiscountPromotionForm) => void
  mobileVariant?: boolean
}

type SearchField = 'Product Name' | 'Product ID'
type PickerTab = 'select' | 'upload'

type DisplayProduct = ShopProduct

function toCurrency(value: number) {
  return `₱${value.toFixed(2)}`
}

function ProductImagePlaceholder({
  name,
  compact = false,
}: {
  name: string
  compact?: boolean
}) {
  return (
    <div
      className={`inline-flex flex-none items-center justify-center border border-[#bfdbfe] bg-gradient-to-br from-[#eff6ff] via-[#dbeafe] to-[#bfdbfe] font-bold text-[#1d4ed8] shadow-[0_8px_14px_-12px_rgba(30,64,175,0.9)] ${
        compact ? 'h-9 w-9 rounded-md text-xs' : 'h-12 w-12 rounded-lg text-sm'
      }`}
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  )
}

function DiscountPromotionProductsCard({
  value,
  onChange,
  mobileVariant = false,
}: DiscountPromotionProductsCardProps) {
  const selectAllRef = useRef<HTMLInputElement>(null)
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<PickerTab>('select')
  const [searchField, setSearchField] = useState<SearchField>('Product Name')
  const [searchInput, setSearchInput] = useState('')
  const [appliedQuery, setAppliedQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All Categories')
  const [showAvailableOnly, setShowAvailableOnly] = useState(true)
  const [draftSelection, setDraftSelection] = useState<string[]>(value.products)
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

  const categories = useMemo(() => {
    const set = new Set(catalogItems.map((product) => product.category))
    return ['All Categories', ...Array.from(set)]
  }, [catalogItems])

  const filteredProducts = useMemo(() => {
    const normalizedQuery = appliedQuery.trim().toLowerCase()

    return catalogItems.filter((product) => {
      if (showAvailableOnly && (product.stock <= 0 || product.status !== 'avail')) {
        return false
      }

      if (
        selectedCategory !== 'All Categories' &&
        product.category !== selectedCategory
      ) {
        return false
      }

      if (!normalizedQuery) {
        return true
      }

      if (searchField === 'Product ID') {
        return product.id.toLowerCase().includes(normalizedQuery)
      }

      return product.name.toLowerCase().includes(normalizedQuery)
    })
  }, [appliedQuery, catalogItems, searchField, selectedCategory, showAvailableOnly])

  const filteredProductIds = useMemo(
    () => filteredProducts.map((product) => product.id),
    [filteredProducts],
  )
  const selectedInFilteredCount = useMemo(
    () => filteredProductIds.filter((id) => draftSelection.includes(id)).length,
    [draftSelection, filteredProductIds],
  )
  const allFilteredSelected =
    filteredProductIds.length > 0 &&
    selectedInFilteredCount === filteredProductIds.length
  const someFilteredSelected =
    selectedInFilteredCount > 0 && !allFilteredSelected

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

  useEffect(() => {
    if (!isPickerOpen) {
      return
    }

    const scrollY = window.scrollY
    const previousOverflow = document.body.style.overflow
    const previousPosition = document.body.style.position
    const previousTop = document.body.style.top
    const previousWidth = document.body.style.width

    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'

    return () => {
      document.body.style.overflow = previousOverflow
      document.body.style.position = previousPosition
      document.body.style.top = previousTop
      document.body.style.width = previousWidth
      window.scrollTo(0, scrollY)
    }
  }, [isPickerOpen])

  useEffect(() => {
    if (!selectAllRef.current) {
      return
    }

    selectAllRef.current.indeterminate = someFilteredSelected
  }, [someFilteredSelected])

  const handleAddProducts = () => {
    if (isAuthRequired || hasNoShop) {
      return
    }

    setDraftSelection(value.products)
    setIsPickerOpen(true)
    setActiveTab('select')
  }

  const handleConfirmSelection = () => {
    const nextDiscounts = draftSelection.reduce<Record<string, string>>(
      (accumulator, productId) => {
        accumulator[productId] = value.productDiscounts[productId] ?? ''
        return accumulator
      },
      {},
    )

    onChange({
      ...value,
      products: draftSelection,
      productDiscounts: nextDiscounts,
    })
    setIsPickerOpen(false)
  }

  const handleRemoveProduct = (index: number) => {
    const nextProducts = value.products.filter(
      (_, productIndex) => productIndex !== index,
    )
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

  const handleToggleProduct = (productId: string) => {
    setDraftSelection((previous) =>
      previous.includes(productId)
        ? previous.filter((id) => id !== productId)
        : [...previous, productId],
    )
  }

  const handleSearch = () => {
    setAppliedQuery(searchInput)
  }

  const handleToggleSelectAll = () => {
    if (filteredProductIds.length === 0) {
      return
    }

    if (allFilteredSelected) {
      setDraftSelection((previous) =>
        previous.filter((id) => !filteredProductIds.includes(id)),
      )
      return
    }

    setDraftSelection((previous) => {
      const next = new Set(previous)
      filteredProductIds.forEach((id) => next.add(id))
      return Array.from(next)
    })
  }

  const handleResetFilters = () => {
    setSearchInput('')
    setAppliedQuery('')
    setSelectedCategory('All Categories')
    setSearchField('Product Name')
    setShowAvailableOnly(true)
  }

  const handleDiscountInputChange = (productId: string, nextValue: string) => {
    let sanitized = nextValue.replace(/[^\d.]/g, '')
    const firstDot = sanitized.indexOf('.')

    if (firstDot !== -1) {
      sanitized =
        sanitized.slice(0, firstDot + 1) +
        sanitized.slice(firstDot + 1).replace(/\./g, '')
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

  const pickerModal =
    isPickerOpen && typeof document !== 'undefined'
      ? createPortal(
          <div className="fixed inset-0 z-50">
            <button
              type="button"
              aria-label="Close product selector"
              onClick={() => setIsPickerOpen(false)}
              className="absolute inset-0 bg-black/50"
            />

            <div className="absolute inset-0 flex items-end sm:items-center sm:justify-center sm:p-6">
              <article className="relative z-10 flex w-full max-h-[85vh] flex-col overflow-hidden rounded-t-2xl border border-[#dbeafe] bg-white shadow-[0_24px_50px_-25px_rgba(15,23,42,0.45)] animate-[rise-in_240ms_cubic-bezier(0.22,1,0.36,1)_both] sm:max-h-[90vh] sm:max-w-5xl sm:rounded-2xl">
                <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-slate-200 sm:hidden" />

                <header className="sticky top-0 z-10 shrink-0 border-b border-[#dbeafe] bg-white px-3 pb-2.5 pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-5 sm:py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-2">
                      <button
                        type="button"
                        onClick={() => setIsPickerOpen(false)}
                        className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full text-base font-semibold text-[#2563EB] transition hover:bg-[#eff6ff] sm:hidden"
                        aria-label="Back"
                      >
                        &larr;
                      </button>
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold text-[#1E40AF] sm:text-xl">
                          Select Products
                        </h3>
                        <p className="mt-0.5 text-[11px] text-slate-500 sm:hidden">
                          Choose products for this discount promotion.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsPickerOpen(false)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-lg text-slate-500 transition hover:bg-slate-100"
                      aria-label="Close"
                    >
                      x
                    </button>
                  </div>

                  <div className="mt-2 flex gap-4 border-b border-[#dbeafe] text-sm font-semibold">
                    <button
                      type="button"
                      onClick={() => setActiveTab('select')}
                      className={`relative pb-2 ${
                        activeTab === 'select' ? 'text-[#2563EB]' : 'text-slate-500'
                      }`}
                    >
                      Select
                      {activeTab === 'select' ? (
                        <span className="absolute inset-x-0 bottom-0 h-0.5 rounded bg-[#2563EB]" />
                      ) : null}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('upload')}
                      className={`relative pb-2 ${
                        activeTab === 'upload' ? 'text-[#2563EB]' : 'text-slate-500'
                      }`}
                    >
                      Upload Product List
                      {activeTab === 'upload' ? (
                        <span className="absolute inset-x-0 bottom-0 h-0.5 rounded bg-[#2563EB]" />
                      ) : null}
                    </button>
                  </div>
                </header>

                <div className="flex-1 overflow-y-auto px-3 py-2.5 pb-4 sm:px-5 sm:py-3">
                  {activeTab === 'upload' ? (
                    <div className="py-6 text-center text-sm text-slate-500 sm:py-8">
                      Upload flow can be added next. Use Select tab for now.
                    </div>
                  ) : isLoading ? (
                    <div className="py-6 text-center text-sm text-slate-500 sm:py-8">
                      Loading products...
                    </div>
                  ) : isAuthRequired ? (
                    <div className="py-6 text-center text-sm text-slate-500 sm:py-8">
                      Sign in to load shop products.
                    </div>
                  ) : hasNoShop ? (
                    <div className="py-6 text-center text-sm text-slate-500 sm:py-8">
                      No shop found for this account.
                    </div>
                  ) : loadError ? (
                    <div className="space-y-3 py-6 text-center text-sm text-slate-600 sm:py-8">
                      <p>{loadError}</p>
                      <button
                        type="button"
                        onClick={() => void loadProducts()}
                        className="inline-flex h-9 items-center justify-center rounded-md border border-[#93c5fd] bg-[#eff6ff] px-4 text-xs font-semibold text-[#1d4ed8] transition hover:bg-[#dbeafe]"
                      >
                        Retry
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <div className="grid gap-2 sm:grid-cols-[170px_210px_minmax(0,1fr)_auto]">
                          <select
                            value={selectedCategory}
                            onChange={(event) => setSelectedCategory(event.target.value)}
                            className="h-11 w-full rounded-md border border-[#cbd5e1] bg-white px-3 text-sm text-slate-700 focus:border-[#64748b] focus:outline-none sm:h-10"
                          >
                            {categories.map((category) => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                          </select>

                          <select
                            value={searchField}
                            onChange={(event) =>
                              setSearchField(event.target.value as SearchField)
                            }
                            className="h-11 w-full rounded-md border border-[#cbd5e1] bg-white px-3 text-sm text-slate-700 focus:border-[#64748b] focus:outline-none sm:h-10"
                          >
                            <option>Product Name</option>
                            <option>Product ID</option>
                          </select>

                          <input
                            type="text"
                            value={searchInput}
                            onChange={(event) => setSearchInput(event.target.value)}
                            placeholder="Input"
                            className="h-11 w-full rounded-md border border-[#cbd5e1] bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#64748b] focus:outline-none sm:h-10"
                          />

                          <div className="grid grid-cols-2 gap-2 sm:flex">
                            <button
                              type="button"
                              onClick={handleSearch}
                              className="inline-flex h-11 items-center justify-center rounded-md bg-[#2563EB] px-4 text-sm font-semibold text-white transition hover:bg-[#1d4ed8] sm:h-10"
                            >
                              Search
                            </button>
                            <button
                              type="button"
                              onClick={handleResetFilters}
                              className="inline-flex h-11 items-center justify-center rounded-md border border-[#cbd5e1] bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:h-10"
                            >
                              Reset
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <label className="inline-flex min-h-10 items-center gap-3 rounded-md bg-white px-2.5 text-xs text-slate-600">
                            <input
                              type="checkbox"
                              checked={showAvailableOnly}
                              onChange={(event) => setShowAvailableOnly(event.target.checked)}
                              className="h-5 w-5 rounded border-[#cbd5e1] text-[#2563EB] focus:ring-[#93c5fd]"
                            />
                            Show available products only
                          </label>

                          <label className="inline-flex min-h-10 items-center gap-3 rounded-md bg-white px-2.5 text-xs font-semibold text-[#1d4ed8]">
                            <input
                              type="checkbox"
                              checked={allFilteredSelected}
                              onChange={handleToggleSelectAll}
                              className="h-5 w-5 rounded border-[#cbd5e1] text-[#2563EB] focus:ring-[#93c5fd]"
                            />
                            Select all shown products
                          </label>
                        </div>
                      </div>

                      <div className="mt-3 overflow-auto rounded-lg border border-[#dbeafe] bg-[#f8fbff]">
                        <div className="border-b border-[#dbeafe] bg-white px-3 py-2 text-xs font-semibold text-[#1d4ed8] sm:hidden">
                          Selected {draftSelection.length} product
                          {draftSelection.length === 1 ? '' : 's'}
                        </div>

                        <div className="space-y-2 p-2 sm:hidden">
                          {filteredProducts.length > 0 ? (
                            filteredProducts.map((product) => {
                              const isChecked = draftSelection.includes(product.id)

                              return (
                                <label
                                  key={product.id}
                                  className="flex items-start gap-2.5 rounded-lg border border-[#dbeafe] bg-white p-2.5"
                                >
                                  <span className="mt-1 inline-flex h-8 w-8 flex-none items-center justify-center rounded-md bg-[#f8fbff]">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => handleToggleProduct(product.id)}
                                      className="h-5 w-5 rounded border-[#cbd5e1] text-[#2563EB] focus:ring-[#93c5fd]"
                                    />
                                  </span>
                                  <ProductImagePlaceholder name={product.name} />
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-2">
                                      <p className="line-clamp-2 text-[14px] font-semibold leading-snug text-slate-900">
                                        {product.name}
                                      </p>
                                      <span className="shrink-0 text-sm font-bold text-[#1d4ed8]">
                                        {toCurrency(product.price)}
                                      </span>
                                    </div>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                      ID: {product.id} | {product.category}
                                    </p>
                                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                                      <span className="rounded-full bg-[#eff6ff] px-2 py-0.5 font-medium text-[#1d4ed8]">
                                        Sales {product.sales}
                                      </span>
                                      <span className="rounded-full bg-[#f1f5f9] px-2 py-0.5 font-medium text-slate-600">
                                        Stock {product.stock}
                                      </span>
                                    </div>
                                  </div>
                                </label>
                              )
                            })
                          ) : (
                            <div className="rounded-lg border border-dashed border-[#bfdbfe] bg-white px-3 py-6 text-center text-sm text-slate-500">
                              No products found for your filters.
                            </div>
                          )}
                        </div>

                        <table className="hidden min-w-[760px] w-full border-separate border-spacing-0 sm:table">
                          <thead>
                            <tr className="bg-white text-left text-xs uppercase tracking-wide text-[#1d4ed8]">
                              <th className="px-3 py-2.5 font-semibold">
                                <input
                                  ref={selectAllRef}
                                  type="checkbox"
                                  checked={allFilteredSelected}
                                  onChange={handleToggleSelectAll}
                                  aria-label="Select all filtered products"
                                  className="h-4 w-4 rounded border-[#cbd5e1] text-[#2563EB] focus:ring-[#93c5fd]"
                                />
                              </th>
                              <th className="px-3 py-2.5 font-semibold">Products</th>
                              <th className="px-3 py-2.5 font-semibold">Sales</th>
                              <th className="px-3 py-2.5 font-semibold">Price</th>
                              <th className="px-3 py-2.5 font-semibold">Stock</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredProducts.length > 0 ? (
                              filteredProducts.map((product) => {
                                const isChecked = draftSelection.includes(product.id)

                                return (
                                  <tr key={product.id} className="bg-white text-sm text-slate-700">
                                    <td className="px-3 py-2.5">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => handleToggleProduct(product.id)}
                                        className="h-4 w-4 rounded border-[#cbd5e1] text-[#2563EB] focus:ring-[#93c5fd]"
                                      />
                                    </td>
                                    <td className="px-3 py-2.5">
                                      <div className="flex items-start gap-2.5">
                                        <ProductImagePlaceholder
                                          name={product.name}
                                          compact
                                        />
                                        <div className="min-w-0">
                                          <p className="font-medium text-slate-900">
                                            {product.name}
                                          </p>
                                          <p className="text-xs text-slate-500">
                                            ID: {product.id} | {product.category}
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-3 py-2.5">{product.sales}</td>
                                    <td className="px-3 py-2.5 font-medium text-slate-900">
                                      {toCurrency(product.price)}
                                    </td>
                                    <td className="px-3 py-2.5">{product.stock}</td>
                                  </tr>
                                )
                              })
                            ) : (
                              <tr>
                                <td
                                  className="px-3 py-8 text-center text-sm text-slate-500"
                                  colSpan={5}
                                >
                                  No products found for your filters.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>

                <footer className="sticky bottom-0 z-10 shrink-0 border-t border-[#dbeafe] bg-white px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2.5 sm:px-5 sm:py-3">
                  <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:flex sm:justify-end">
                    <button
                      type="button"
                      onClick={() => setIsPickerOpen(false)}
                      className="inline-flex h-11 items-center justify-center rounded-md border border-[#cbd5e1] bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:h-10"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmSelection}
                      disabled={!canManageProducts}
                      className="inline-flex h-11 items-center justify-center rounded-md bg-[#2563EB] px-4 text-sm font-semibold text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-45 sm:h-10"
                    >
                      Confirm
                    </button>
                  </div>
                </footer>
              </article>
            </div>
          </div>,
          document.body,
        )
      : null

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
                    <ProductImagePlaceholder name={product.name} />
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
                      {toCurrency(product.price)} {'->'}{' '}
                      <span className="font-semibold text-[#1d4ed8]">
                        {toCurrency(discountedPrice)}
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
                      <span className="ml-1 text-[11px] font-semibold text-slate-400">
                        % OFF
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : null}

        {pickerModal}
      </article>
    )
  }

  return (
    <article className="rounded-xl border border-[#dbeafe] bg-white p-4 shadow-[0_10px_30px_-28px_rgba(15,23,42,0.8)] sm:p-5">
      <header>
        <h2 className="text-xl font-semibold text-[#1E40AF]">Discount Promotion Products</h2>
        <p className="mt-1 text-sm text-slate-600">
          Add products to discount promotion and set discount prices.
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
                    <ProductImagePlaceholder name={product.name} compact />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {product.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        ID: {product.id} | {product.category}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm font-medium text-slate-700">
                    {toCurrency(product.price)}
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
                      className="w-16 border-0 bg-transparent text-right text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    />
                    <span className="ml-1 text-[11px] font-semibold text-slate-400">
                      % OFF
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-[#1d4ed8]">
                    {toCurrency(discountedPrice)}
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
          No products added yet.
        </div>
      )}

      {pickerModal}
    </article>
  )
}

export default DiscountPromotionProductsCard
