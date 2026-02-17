type CreateVoucherBreadcrumbProps = {
  onBack: () => void
}

function CreateVoucherBreadcrumb({ onBack }: CreateVoucherBreadcrumbProps) {
  return (
    <nav
      className="hidden items-center gap-2 overflow-hidden whitespace-nowrap text-sm text-slate-500 sm:flex"
      aria-label="Breadcrumb"
    >
      <button
        type="button"
        onClick={onBack}
        className="max-w-[96px] truncate font-medium text-[#1d4ed8] transition hover:text-[#1e3a8a]"
      >
        Home
      </button>
      <span className="text-slate-400">&gt;</span>
      <button
        type="button"
        onClick={onBack}
        className="max-w-[170px] truncate font-medium text-[#1d4ed8] transition hover:text-[#1e3a8a]"
      >
        Marketing Centre
      </button>
      <span className="text-slate-400">&gt;</span>
      <button
        type="button"
        onClick={onBack}
        className="max-w-[120px] truncate font-medium text-[#1d4ed8] transition hover:text-[#1e3a8a]"
      >
        Vouchers
      </button>
      <span className="text-slate-400">&gt;</span>
      <span className="truncate font-semibold text-slate-700">Create New Voucher</span>
    </nav>
  )
}

export default CreateVoucherBreadcrumb
