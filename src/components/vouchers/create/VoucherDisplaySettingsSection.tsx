import { useId } from 'react'
import type { ProductScope, VoucherDisplaySetting } from './types'

type VoucherDisplaySettingsSectionProps = {
  displaySetting: VoucherDisplaySetting
  productScope: ProductScope
  onDisplaySettingChange: (value: VoucherDisplaySetting) => void
  onProductScopeChange?: (value: ProductScope) => void
  displaySettingError?: string
  displaySettingInputIds?: {
    allPages: string
    voucherCode: string
  }
}

function VoucherDisplaySettingsSection({
  displaySetting,
  productScope,
  onDisplaySettingChange,
  onProductScopeChange,
  displaySettingError,
  displaySettingInputIds,
}: VoucherDisplaySettingsSectionProps) {
  const displaySettingGroupName = useId()
  const applicableProductsLabel =
    productScope === 'specific-products' ? 'specific products' : 'all products'

  return (
    <section className="rounded-lg border border-[#dbeafe] bg-[#f8fbff] px-5 py-5">
      <div className="grid gap-4 sm:grid-cols-[190px_minmax(0,1fr)] sm:items-start">
        <fieldset className="sm:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <legend className="text-sm font-medium text-slate-700">
              Voucher Display Setting
            </legend>
            <a href="#" className="text-xs font-medium text-[#1d4ed8] hover:underline">
              Learn more
            </a>
          </div>

          <div
            className="mt-2 grid grid-cols-2 gap-2"
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
              <span className="inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-center text-[13px] font-medium leading-tight text-slate-700 shadow-sm transition duration-150 hover:bg-slate-50 active:scale-[0.98] active:bg-slate-100 peer-checked:border-blue-600 peer-checked:bg-blue-600 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-[#93c5fd] peer-focus-visible:ring-offset-1">
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
              <span className="inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-center text-[13px] font-medium leading-tight text-slate-700 shadow-sm transition duration-150 hover:bg-slate-50 active:scale-[0.98] active:bg-slate-100 peer-checked:border-blue-600 peer-checked:bg-blue-600 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-[#93c5fd] peer-focus-visible:ring-offset-1">
                Shared through voucher code
              </span>
            </label>
          </div>
        </fieldset>
      </div>
      {displaySettingError ? (
        <p className="mt-2 text-[13px] text-[#b91c1c]">{displaySettingError}</p>
      ) : null}

      <div className="mt-5 grid gap-3 border-t border-[#e2e8f0] pt-4 sm:grid-cols-[190px_minmax(0,1fr)] sm:items-start">
        <p className="pt-1 text-sm text-slate-700">Applicable Products</p>

        <div>
          <p className="text-sm font-medium text-slate-900">{applicableProductsLabel}</p>
          <p className="mt-1 text-xs text-slate-500">
            For selected products only, some products are prohibited from promotions
            due to regulations in your country.
            <a href="#" className="ml-1 text-[#1d4ed8] hover:underline">
              Learn More
            </a>
          </p>
          {productScope === 'specific-products' ? (
            <div className="mt-3 rounded-md border border-[#fde68a] bg-[#fffbeb] px-3 py-2 text-xs text-[#92400e]">
              Specific-product vouchers are not available in this release.
              {onProductScopeChange ? (
                <button
                  type="button"
                  onClick={() => onProductScopeChange('all-products')}
                  className="ml-2 font-semibold text-[#1d4ed8] hover:underline"
                >
                  Switch to all products
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export default VoucherDisplaySettingsSection
