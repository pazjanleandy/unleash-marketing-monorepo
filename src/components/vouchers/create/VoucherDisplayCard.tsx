import VoucherDisplaySettingsSection from './VoucherDisplaySettingsSection'
import type { CreateVoucherForm, VoucherType } from './types'

type VoucherDisplayCardProps = {
  voucherType: VoucherType
  value: CreateVoucherForm
  onChange: (value: CreateVoucherForm) => void
  onProductScopeChange?: (value: CreateVoucherForm['productScope']) => void
  displaySettingError?: string
  displaySettingInputIds?: {
    allPages: string
    voucherCode: string
  }
}

const VOUCHER_TYPE_TITLES: Record<VoucherType, string> = {
  shop: 'Voucher Display & Applicable Products',
  product: 'Product Selection',
  private: 'Private Distribution',
  live: 'Livestream Settings',
  video: 'Video Settings',
}

function VoucherDisplayCard({
  voucherType,
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
          {VOUCHER_TYPE_TITLES[voucherType]}
        </h2>
      </header>

      <div className="px-5 py-5">
        <VoucherDisplaySettingsSection
          voucherType={voucherType}
          displaySetting={value.displaySetting}
          productScope={value.productScope}
          selectedProductIds={value.selectedProductIds}
          livestreamUrl={value.livestreamUrl}
          videoUrl={value.videoUrl}
          onDisplaySettingChange={setDisplaySetting}
          onProductScopeChange={onProductScopeChange}
          onSelectedProductIdsChange={(ids) => onChange({ ...value, selectedProductIds: ids })}
          onLivestreamUrlChange={(url) => onChange({ ...value, livestreamUrl: url })}
          onVideoUrlChange={(url) => onChange({ ...value, videoUrl: url })}
          displaySettingError={displaySettingError}
          displaySettingInputIds={displaySettingInputIds}
        />
      </div>
    </article>
  )
}

export default VoucherDisplayCard
