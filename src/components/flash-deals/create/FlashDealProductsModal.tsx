import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type FlashDealProductsModalProps = {
  isOpen: boolean
  selectedProducts: string[]
  onClose: () => void
  onConfirm: (products: string[]) => void
}

type FlashDealProduct = {
  id: string
  name: string
  category: string
  sales: number
  price: number
  stock: number
}

type PickerTab = 'select' | 'upload'
type SearchField = 'Product Name' | 'Product ID'

const flashDealProductCatalog: FlashDealProduct[] = [
  {
    id: 'FD-41775186070',
    name: 'Petsup Freeze-Dried Cat Food 1kg',
    category: 'Pet Food',
    sales: 0,
    price: 297,
    stock: 3,
  },
  {
    id: 'FD-23641075967',
    name: 'Petsup Freeze-Dried Meat Pet Treats 30g',
    category: 'Pet Food',
    sales: 8,
    price: 98,
    stock: 22,
  },
  {
    id: 'FD-25896794112',
    name: "Nature's Protection Cat Food with Fish",
    category: 'Pet Food',
    sales: 0,
    price: 61,
    stock: 6,
  },
  {
    id: 'FD-27741987504',
    name: 'Natures Protection Cat Food Pouch Fish',
    category: 'Pet Food',
    sales: 0,
    price: 62,
    stock: 6,
  },
  {
    id: 'FD-41777194845',
    name: 'Pedigree Puppy Chicken Flavour',
    category: 'Pet Food',
    sales: 12,
    price: 82,
    stock: 2,
  },
  {
    id: 'FD-22778139912',
    name: 'PetSoft Clumping Cat Litter 10L',
    category: 'Litter & Toilet',
    sales: 21,
    price: 149,
    stock: 18,
  },
  {
    id: 'FD-19877553121',
    name: 'PawCare Ear Cleaner 100ml',
    category: 'Pet Healthcare',
    sales: 11,
    price: 75,
    stock: 9,
  },
  {
    id: 'FD-33872654190',
    name: 'Glow Fur Gentle Shampoo 500ml',
    category: 'Pet Grooming',
    sales: 14,
    price: 109,
    stock: 7,
  },
]

function ProductImageStub({
  name,
  compact = false,
}: {
  name: string
  compact?: boolean
}) {
  return (
    <span
      className={`inline-flex flex-none items-center justify-center border border-[#bfdbfe] bg-gradient-to-br from-[#eff6ff] via-[#dbeafe] to-[#bfdbfe] font-bold text-[#1d4ed8] shadow-[0_8px_14px_-12px_rgba(30,64,175,0.9)] ${
        compact ? 'h-9 w-9 rounded-md text-xs' : 'h-12 w-12 rounded-lg text-sm'
      }`}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  )
}

function toPriceLabel(value: number) {
  return `PHP ${value.toLocaleString('en-US')}`
}

function FlashDealProductsModal({
  isOpen,
  selectedProducts,
  onClose,
  onConfirm,
}: FlashDealProductsModalProps) {
  const selectAllRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState<PickerTab>('select')
  const [searchField, setSearchField] = useState<SearchField>('Product Name')
  const [searchInput, setSearchInput] = useState('')
  const [appliedQuery, setAppliedQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All Categories')
  const [showAvailableOnly, setShowAvailableOnly] = useState(true)
  const [draftSelection, setDraftSelection] = useState<string[]>(selectedProducts)

  const categories = useMemo(() => {
    const values = new Set(flashDealProductCatalog.map((product) => product.category))
    return ['All Categories', ...Array.from(values)]
  }, [])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setActiveTab('select')
    setDraftSelection(selectedProducts)
  }, [isOpen, selectedProducts])

  useEffect(() => {
    if (!isOpen) {
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
  }, [isOpen])

  const filteredProducts = useMemo(() => {
    const query = appliedQuery.trim().toLowerCase()

    return flashDealProductCatalog.filter((product) => {
      if (showAvailableOnly && product.stock <= 0) {
        return false
      }

      if (selectedCategory !== 'All Categories' && product.category !== selectedCategory) {
        return false
      }

      if (!query) {
        return true
      }

      if (searchField === 'Product ID') {
        return product.id.toLowerCase().includes(query)
      }

      return product.name.toLowerCase().includes(query)
    })
  }, [appliedQuery, searchField, selectedCategory, showAvailableOnly])

  const filteredProductNames = useMemo(
    () => filteredProducts.map((product) => product.name),
    [filteredProducts],
  )

  const selectedInFilteredCount = useMemo(
    () => filteredProductNames.filter((name) => draftSelection.includes(name)).length,
    [draftSelection, filteredProductNames],
  )

  const allFilteredSelected =
    filteredProductNames.length > 0 &&
    selectedInFilteredCount === filteredProductNames.length
  const someFilteredSelected =
    selectedInFilteredCount > 0 && !allFilteredSelected

  useEffect(() => {
    if (!selectAllRef.current) {
      return
    }

    selectAllRef.current.indeterminate = someFilteredSelected
  }, [someFilteredSelected])

  const handleToggleProduct = (productName: string) => {
    setDraftSelection((previous) =>
      previous.includes(productName)
        ? previous.filter((name) => name !== productName)
        : [...previous, productName],
    )
  }

  const handleSearch = () => {
    setAppliedQuery(searchInput)
  }

  const handleToggleSelectAll = () => {
    if (filteredProductNames.length === 0) {
      return
    }

    if (allFilteredSelected) {
      setDraftSelection((previous) =>
        previous.filter((name) => !filteredProductNames.includes(name)),
      )
      return
    }

    setDraftSelection((previous) => {
      const next = new Set(previous)
      filteredProductNames.forEach((name) => next.add(name))
      return Array.from(next)
    })
  }

  const handleReset = () => {
    setSearchField('Product Name')
    setSearchInput('')
    setAppliedQuery('')
    setSelectedCategory('All Categories')
    setShowAvailableOnly(true)
  }

  const handleConfirm = () => {
    onConfirm(draftSelection)
  }

  if (!isOpen || typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close product selector"
        onClick={onClose}
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
                  onClick={onClose}
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
                    Choose products for this flash deal.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
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
                      onChange={(event) => setSearchField(event.target.value as SearchField)}
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
                        onClick={handleReset}
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
                        const isChecked = draftSelection.includes(product.name)

                        return (
                          <label
                            key={product.id}
                            className="flex items-start gap-2.5 rounded-lg border border-[#dbeafe] bg-white p-2.5"
                          >
                            <span className="mt-1 inline-flex h-8 w-8 flex-none items-center justify-center rounded-md bg-[#f8fbff]">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleProduct(product.name)}
                                className="h-5 w-5 rounded border-[#cbd5e1] text-[#2563EB] focus:ring-[#93c5fd]"
                              />
                            </span>
                            <ProductImageStub name={product.name} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <p className="line-clamp-2 text-[14px] font-semibold leading-snug text-slate-900">
                                  {product.name}
                                </p>
                                <span className="shrink-0 text-sm font-bold text-[#1d4ed8]">
                                  {toPriceLabel(product.price)}
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
                          const isChecked = draftSelection.includes(product.name)

                          return (
                            <tr key={product.id} className="bg-white text-sm text-slate-700">
                              <td className="px-3 py-2.5">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleProduct(product.name)}
                                  className="h-4 w-4 rounded border-[#cbd5e1] text-[#2563EB] focus:ring-[#93c5fd]"
                                />
                              </td>
                              <td className="px-3 py-2.5">
                                <div className="flex items-start gap-2.5">
                                  <ProductImageStub name={product.name} compact />
                                  <div className="min-w-0">
                                    <p className="font-medium text-slate-900">{product.name}</p>
                                    <p className="text-xs text-slate-500">
                                      ID: {product.id} | {product.category}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-2.5">{product.sales}</td>
                              <td className="px-3 py-2.5 font-medium text-slate-900">
                                {toPriceLabel(product.price)}
                              </td>
                              <td className="px-3 py-2.5">{product.stock}</td>
                            </tr>
                          )
                        })
                      ) : (
                        <tr>
                          <td className="px-3 py-8 text-center text-sm text-slate-500" colSpan={5}>
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
                onClick={onClose}
                className="inline-flex h-11 items-center justify-center rounded-md border border-[#cbd5e1] bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:h-10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="inline-flex h-11 items-center justify-center rounded-md bg-[#2563EB] px-4 text-sm font-semibold text-white transition hover:bg-[#1d4ed8] sm:h-10"
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
}

export default FlashDealProductsModal
