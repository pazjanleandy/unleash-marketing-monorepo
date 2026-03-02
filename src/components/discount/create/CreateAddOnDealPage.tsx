import CreateDiscountPromotionPage from './CreateDiscountPromotionPage'

type CreateAddOnDealPageProps = {
  onBack: () => void
  onConfirm?: () => void
}

function CreateAddOnDealPage({
  onBack,
  onConfirm,
}: CreateAddOnDealPageProps) {
  return (
    <CreateDiscountPromotionPage
      onBack={onBack}
      onConfirm={onConfirm}
      toolType="add-on-deal"
    />
  )
}

export default CreateAddOnDealPage
