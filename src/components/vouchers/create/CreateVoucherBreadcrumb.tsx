type CreateVoucherBreadcrumbProps = {
  onBack: () => void
  currentLabel: string
}

function CreateVoucherBreadcrumb({
  onBack,
  currentLabel,
}: CreateVoucherBreadcrumbProps) {
  return (
    <nav
      className="hidden items-center gap-2 overflow-hidden whitespace-nowrap text-sm text-slate-500 sm:flex"
      aria-label="Breadcrumb"
    >
      <button
        type="button"
        onClick={onBack}
        className="max-w-[96px] truncate font-medium text-[#3347A8] transition hover:text-[#2F3F7E]"
      >
        Home
      </button>
      <span className="text-slate-400">&gt;</span>
      <button
        type="button"
        onClick={onBack}
        className="max-w-[170px] truncate font-medium text-[#3347A8] transition hover:text-[#2F3F7E]"
      >
        Marketing Centre
      </button>
      <span className="text-slate-400">&gt;</span>
      <button
        type="button"
        onClick={onBack}
        className="max-w-[120px] truncate font-medium text-[#3347A8] transition hover:text-[#2F3F7E]"
      >
        Vouchers
      </button>
      <span className="text-slate-400">&gt;</span>
      <span className="truncate font-semibold text-slate-700">{currentLabel}</span>
    </nav>
  )
}

export default CreateVoucherBreadcrumb

