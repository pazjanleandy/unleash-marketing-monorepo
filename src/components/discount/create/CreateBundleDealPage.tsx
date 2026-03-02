import CreateDiscountPromotionPage from './CreateDiscountPromotionPage'

type CreateBundleDealPageProps = {
  onBack: () => void
  onConfirm?: () => void
}

function CreateBundleDealPage({
  onBack,
  onConfirm,
}: CreateBundleDealPageProps) {
  return (
    <CreateDiscountPromotionPage
      onBack={onBack}
      onConfirm={onConfirm}
      toolType="bundle-deal"
    />
  )
}

export default CreateBundleDealPage
