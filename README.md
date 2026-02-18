# Unleash Marketing Centre (Frontend)

Frontend-only Marketing Centre built with React + TypeScript + Vite + Tailwind.

## Tech Stack
- React 19
- TypeScript
- Vite
- Tailwind CSS

## Views and Navigation
- `marketing`
  - Main Marketing Centre landing view.
- `discount`
  - Discount promotions dashboard.
- `create-discount-promotion`
  - Create/Edit discount promotion flow.
- `view-discount-promotion`
  - Read-only discount promotion detail view.
- `flash-deals`
  - Flash deals dashboard.
- `vouchers`
  - Voucher listing and management UI.
- `create-voucher`
  - Voucher creation/edit flow.

Routing is view-state based in `src/App.tsx`:
- Clicking `Discount`, `Flash Deals`, or `Vouchers` from Marketing Tools opens their pages.
- Discount `Edit` on Discount Promotion rows opens prefilled edit form (`create-discount-promotion` in edit mode).
- Discount `View` opens read-only detail page (`view-discount-promotion`).
- Voucher `Edit` opens prefilled voucher edit form.
- Back/Cancel actions return to the previous parent view.

## Daily Update
### 2026-02-18

#### 1) Discount Module Added and Componentized
- Added full discount dashboard flow with desktop + mobile layouts.
- Added create section, performance section, promotion list section, and mobile status panel.
- Added action wiring for edit/view from both desktop and mobile discount lists.

#### 2) Create/Edit Discount Promotion Flow
- Added componentized create page and breadcrumb.
- Added mode support (`create` and `edit`) with mode-specific headers (`Edit Discount`).
- Added prefill mapping from promotion table rows into edit form state.
- Added conditional form visibility so discount details appear after product selection.

#### 3) Product Selection and Per-Product Discount UI
- Added Select Products modal with desktop and mobile layouts, backdrop, and body scroll lock.
- Added placeholder product image shapes in list rows.
- Added selected-product detail rows with:
  - product preview shape
  - per-product `% OFF` input
  - discounted price preview
  - remove product action
- Added product discount state map in form model (`productDiscounts`).

#### 4) Mobile Date + Time Picker (Reusable)
- Added reusable `MobileDateTimePicker` component.
- Implemented bottom-sheet modal with backdrop, sticky header/footer, safe-area padding, and scrollable content.
- Added calendar month grid + mobile-friendly time selectors (hour, minute, AM/PM).
- Added `disablePast`, `minDate`, `maxDate`, and invalid-selection prevention.
- Fixed immediate selected-state highlight priority and strict disabled behavior for date/time taps.

#### 5) View Discount Promotion Page (Read-Only)
- Added read-only discount detail page for `View` actions.
- Added non-editable basic info and product rows.
- Added small promotion data section (`Availed`, `Buyers`, `Orders`, `Sales`).

#### 6) Flash Deals Page Added (Componentized)
- Added flash deals page aligned to Unleash blue theme and existing UI language.
- Added performance metrics section.
- Added promotion list section with tabs, filter, toggles, and actions.
- Wired Marketing Tool card (`My Shop's Flash Deals`) to open this page.

#### 7) Action Rules + Styling Standardization
- Discount actions normalized to:
  - `Upcoming`/`Ongoing`: `Edit`, `Duplicate`, `Delete`
  - `Expired`: `View`, `Delete`
- Applied orange danger style for `Delete` actions to match vouchers.

#### 8) Currency Standardization to PHP
- Updated form-related currency displays/inputs from dollar format to PHP/Peso formatting.
- Applied to voucher forms/previews and discount create/view currency formatters.

#### 9) Added Files on 2026-02-18
- `src/components/common/MobileDateTimePicker.tsx`
- `src/components/discount/create/CreateDiscountPromotionPage.tsx`
- `src/components/discount/create/CreateDiscountPromotionBreadcrumb.tsx`
- `src/components/discount/create/DiscountPromotionBasicInformationCard.tsx`
- `src/components/discount/create/DiscountPromotionProductsCard.tsx`
- `src/components/discount/create/types.ts`
- `src/components/discount/view/ViewDiscountPromotionPage.tsx`
- `src/components/flash-deals/FlashDealsPage.tsx`
- `src/components/flash-deals/FlashDealsPerformanceSection.tsx`
- `src/components/flash-deals/FlashDealsPromotionListSection.tsx`
- `src/components/flash-deals/data.ts`
- `src/components/flash-deals/types.ts`

### 2026-02-17

#### 1) Create Voucher Flow Added and Componentized
- Added a dedicated `create-voucher` view and wired create actions from `VouchersPage`.
- Added componentized create screen structure:
  - `CreateVoucherPage`
  - `CreateVoucherBreadcrumb`
  - `RewardSettingsCard`
  - `VoucherDisplayCard`
  - `VoucherDisplaySettingsSection`
  - `VoucherPreviewPanel`
  - `create/types.ts`

#### 2) Create Voucher UX + Mobile Wizard
- Implemented a mobile 3-step wizard for create voucher:
  - Step 1: Reward Settings
  - Step 2: Voucher Display and Applicable Products
  - Step 3: Preview
- Added mobile step header (`Step X of 3`) and sticky bottom navigation (`Back` / `Next` / `Create Voucher`).
- Kept desktop/tablet layout visible as full multi-card form.
- Added step-level validation trigger on Next (without changing business rules), including:
  - inline error messages
  - scroll/focus to first invalid field

#### 3) Reward Settings Refactor
- Simplified to one main card structure and reduced nested visual noise.
- Replaced reward type radios with segmented control UI (same underlying state).
- Changed `Discount Type | Amount` label to `Discount`.
- Standardized currency input prefix style for amount fields.
- Removed the smart-voucher row from Reward Settings.
- Updated styling to match the blue theme used across vouchers UI.

#### 4) Voucher Display Settings Improvements
- Reworked `Voucher Display Setting` into accessible segmented controls using radio inputs.
- Improved segmented control visual states (hover, active press, selected, focus ring).
- Fixed mobile interaction issue where segmented buttons could appear to work only once by using instance-unique radio group names (`useId`) to avoid collisions between mobile and hidden desktop instances.

#### 5) Vouchers Mobile Card Redesign
- Refined mobile voucher cards for readability and scanability:
  - prioritized hierarchy (value first)
  - compact amount display
  - status and code grouped clearly
  - claiming dates collapsed into one short line
  - replaced large circular usage rings with compact stat chips
  - emphasized `Unused` stat visually
  - set primary action emphasis for `Edit`
  - removed/de-emphasized swipe instruction text

#### 6) Marketing Tools Mobile Hub Redesign
- Updated mobile Marketing Tools landing to a hub-style layout:
  - title, subtitle, and promotion link header
  - `Recommended for Unleash` section
  - `All Marketing Tools` section
  - reusable tile component with consistent icon circle, label wrapping, focus and active states
- Adjusted mobile `All Marketing Tools` spacing so it is no longer cramped:
  - now `2` columns on very small widths, `3` columns from ~380px up

## Component Map

### App Shell
- `src/App.tsx`
  - Controls active views and cross-view navigation callbacks
  - Handles form prefill mapping for voucher and discount edit flows

### Common Components
- `src/components/common/MobileDateTimePicker.tsx`

### Marketing Components
- `src/components/marketing/MarketingHero.tsx`
- `src/components/marketing/MarketingToolsPanel.tsx`
- `src/components/marketing/ToolSectionBlock.tsx`
- `src/components/marketing/ToolCardItem.tsx`
- `src/components/marketing/IconMark.tsx`
- `src/components/marketing/data.ts`
- `src/components/marketing/types.ts`

### Discount Components
- `src/components/discount/DiscountPage.tsx`
- `src/components/discount/DiscountCreateSection.tsx`
- `src/components/discount/DiscountPerformanceSection.tsx`
- `src/components/discount/DiscountPromotionListSection.tsx`
- `src/components/discount/DiscountMobilePanel.tsx`
- `src/components/discount/data.ts`
- `src/components/discount/types.ts`

### Create Discount Components
- `src/components/discount/create/CreateDiscountPromotionPage.tsx`
- `src/components/discount/create/CreateDiscountPromotionBreadcrumb.tsx`
- `src/components/discount/create/DiscountPromotionBasicInformationCard.tsx`
- `src/components/discount/create/DiscountPromotionProductsCard.tsx`
- `src/components/discount/create/types.ts`

### View Discount Components
- `src/components/discount/view/ViewDiscountPromotionPage.tsx`

### Flash Deals Components
- `src/components/flash-deals/FlashDealsPage.tsx`
- `src/components/flash-deals/FlashDealsPerformanceSection.tsx`
- `src/components/flash-deals/FlashDealsPromotionListSection.tsx`
- `src/components/flash-deals/data.ts`
- `src/components/flash-deals/types.ts`

### Vouchers Components
- `src/components/vouchers/VouchersPage.tsx`
- `src/components/vouchers/data.ts`
- `src/components/vouchers/types.ts`

### Create Voucher Components
- `src/components/vouchers/create/CreateVoucherPage.tsx`
- `src/components/vouchers/create/CreateVoucherBreadcrumb.tsx`
- `src/components/vouchers/create/RewardSettingsCard.tsx`
- `src/components/vouchers/create/VoucherDisplayCard.tsx`
- `src/components/vouchers/create/VoucherDisplaySettingsSection.tsx`
- `src/components/vouchers/create/VoucherPreviewPanel.tsx`
- `src/components/vouchers/create/types.ts`

## Run Locally
```bash
npm install
npm run dev
```

## Build / Lint
```bash
npm run build
npm run preview
npm run lint
```

## Scope Notes
- Current data is frontend-only sample data (no backend integration).
- Action links/buttons are UI-driven and do not persist server state.
