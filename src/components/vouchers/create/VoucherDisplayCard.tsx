import VoucherDisplaySettingsSection from './VoucherDisplaySettingsSection'
import type { CreateVoucherForm } from './types'

type VoucherDisplayCardProps = {
  value: CreateVoucherForm
  onChange: (value: CreateVoucherForm) => void
  onProductScopeChange?: (value: CreateVoucherForm['productScope']) => void
  displaySettingError?: string
  displaySettingInputIds?: {
    allPages: string
    voucherCode: string
  }
}

function VoucherDisplayCard({
  value,
  onChange,
  onProductScopeChange,
  displaySettingError,
  displaySettingInputIds,
}: VoucherDisplayCardProps) {
  const setDisplaySetting = (displaySetting: CreateVoucherForm['displaySetting']) => {
    onChange({ ...value, displaySetting })
  }

  return (
    <article className="rounded-xl border border-[#dfe3ea] bg-white shadow-[0_10px_30px_-28px_rgba(15,23,42,0.8)]">
      <header className="border-b border-[#eef2f7] px-5 py-4">
        <h2 className="text-2xl font-semibold text-slate-900">
          Voucher Display &amp; Applicable Products
        </h2>
      </header>

      <div className="px-5 py-5">
        <VoucherDisplaySettingsSection
          displaySetting={value.displaySetting}
          productScope={value.productScope}
          onDisplaySettingChange={setDisplaySetting}
          onProductScopeChange={onProductScopeChange}
          displaySettingError={displaySettingError}
          displaySettingInputIds={displaySettingInputIds}
        />
      </div>
    </article>
  )
}

export default VoucherDisplayCard
