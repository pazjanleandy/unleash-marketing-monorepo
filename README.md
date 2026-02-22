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
- `create-flash-deal`
  - Create flash deal flow (setup, products, set discount).
- `vouchers`
  - Voucher listing and management UI.
- `create-voucher`
  - Voucher creation/edit flow.

Routing is URL-based in `src/App.tsx` with `react-router-dom`:
- `/` redirects to `/market-centre`
- `/market-centre` renders the full Marketing Centre page in `src/pages/marketCentre.tsx`
- `*` (unknown routes) redirects to `/market-centre`

Inside `src/pages/marketCentre.tsx`, view-state navigation remains for internal module flows:
- Clicking `Discount`, `Flash Deals`, or `Vouchers` from Marketing Tools opens their pages.
- Flash Deals `Create` opens the create flow (`create-flash-deal`).
- Discount `Edit` on Discount Promotion rows opens prefilled edit form (`create-discount-promotion` in edit mode).
- Discount `View` opens read-only detail page (`view-discount-promotion`).
- Voucher `Edit` opens prefilled voucher edit form.
- Back/Cancel actions return to the previous parent view.

## Daily Update
### 2026-02-22

#### 1) Market Centre Refactor: App Router + Page Ownership Split
- Moved the entire Market Centre orchestration logic from `src/App.tsx` to `src/pages/marketCentre.tsx`.
- `src/App.tsx` now acts as router-only app composition using `BrowserRouter`, `Routes`, `Route`, and `Navigate`.
- Added route redirects so both `/` and unknown paths resolve to `/market-centre`.

#### 2) Sidebar Alignment with Market Centre Types
- Updated `src/sidebar/sidebar.tsx` to reuse `MarketCentreView` from `src/pages/marketCentre.tsx`.
- Removed duplicated view-type definitions between app shell and sidebar for safer maintenance.

#### 3) Dependency Update
- Added `react-router-dom` to dependencies for route handling in the app shell.

### 2026-02-19

#### 1) Create Flash Deal Flow Added (Desktop + Mobile)
- Added a dedicated `create-flash-deal` route and page wiring from Flash Deals.
- Implemented 3-step flow:
  - Step 1: Select Period
  - Step 2: Add Products
  - Step 3: Set Discount
- Fixed mobile step progression so Step 3 can be opened and navigated consistently.

#### 2) Step 1 (Select Period) UX Refresh
- Updated Step 1 UI to blue-themed mobile-first layout with clearer hierarchy.
- Added date window navigation (forward/back) and time-slot selection behavior tuned for mobile.
- Improved unavailable date/time states with stronger disabled styling for scanability.
- Kept date/time picking on reusable `MobileDateTimePicker` modal.

#### 3) Step 2 (Add Products) Modal and Selection Improvements
- Updated Flash Deal Add Products modal to match Create Discount modal structure and behavior.
- Includes:
  - Select/Upload tabs
  - category + search filters
  - available-only toggle
  - select-all and mass selection flows
  - mobile card list + desktop table layout
- Preserved existing confirm/cancel behavior and product selection state mapping.

#### 4) Step 2 Mobile Readability Improvements
- Improved product row spacing and density for mobile scanning.
- Kept checkbox selection with better touch targets and cleaner visual grouping.

#### 5) Step 3 (Set Discount) Mobile Refactor + Bulk Apply
- Refactored Step 3 mobile product cards for readability:
  - compact header with thumbnail/title/meta
  - clear per-product input grouping
  - top-right enabled toggle and remove action
- Added mobile `Bulk apply` section with:
  - Discount (%) OR Discounted Price (mutually exclusive)
  - Campaign Stock
  - Purchase Limit + No-limit checkbox
  - optional apply-to-enabled-only targeting
- Added Enter-to-apply behavior for bulk form submission.

#### 6) Step 3 Desktop Batch Controls Cleanup
- Improved spacing/layout of desktop batch controls for cleaner visual grouping.
- Updated batch actions to:
  - `Update All` (apply inputs)
  - `Clear` (clears only batch input fields)
  - `Delete All` (removes selected items)
- Removed desktop batch `Enable` / `Disable` actions.

#### 7) Flash Deals Mobile Dashboard CTA
- Added persistent mobile floating create button (`+`) on Flash Deals page so create action remains accessible while scrolling.

#### 8) Flash Deals Create Files (Current)
- `src/components/flash-deals/create/CreateFlashDealPage.tsx`
- `src/components/flash-deals/create/CreateFlashDealBreadcrumb.tsx`
- `src/components/flash-deals/create/FlashDealProductsModal.tsx`

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

#### 10) Marketing Home Visual Hierarchy Refresh
- Updated Marketing Centre home visual hierarchy for clearer scan order.
- Standardized Marketing Tool icon tones to one blue system.
- Rebalanced typography contrast (reduced heavy black text across titles/body).
- Updated hero branding to use `public/unleash_banner.png` above `Marketing-Centre`.

#### 11) Vouchers Page Layout Rework (Desktop) + Mobile Density Tuning
- Reworked desktop Vouchers into Shopee-style sections:
  - `Create Voucher` grouped cards
  - `Voucher Performance` metrics strip
  - `Vouchers List` with tabs/search/table
- Added reusable desktop UI blocks inside `VouchersPage` for create-type cards and metric tiles.
- Added working desktop filtering by tab and search query.
- Updated voucher sample data for richer statuses and standardized `PHP` display values.
- Reduced mobile voucher card visual bulk for high-density lists:
  - smaller card paddings/type scales
  - compact stats summary line
  - smaller action buttons
  - removed extra loading strip above list

#### 12) Flash Deals Mobile UX and Readability Improvements
- Replaced mobile filter carousel with fixed 4-tab pill filter style (`All/Upcoming/Ongoing/Expired`).
- Refined mobile flash-deal cards for readability and scanability:
  - primary focus on time and status
  - cleaner metric zones (`Enabled`, `Available`)
  - clearer action row with readable touch targets
- Added optional mobile date grouping so repeated dates render once as section headers.
- Improved time-slot parsing so displayed time includes full ranges.
- Mapped mobile `Expired` status label to `Ended` for clearer user meaning.

#### 13) Flash Deals Action Consistency
- Updated Flash Deals desktop table `Actions` column to match other pages:
  - stacked per-action links
  - blue default action links
  - orange/red danger styling for destructive actions (`Delete` / `End`)

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
  - Defines top-level routes and redirects
  - Mounts `MarketCentrePage` at `/market-centre`
- `src/pages/marketCentre.tsx`
  - Controls active views and cross-view navigation callbacks
  - Handles form prefill mapping for voucher and discount edit flows
  - Composes sidebar + Market Centre module screens

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

### Create Flash Deal Components
- `src/components/flash-deals/create/CreateFlashDealPage.tsx`
- `src/components/flash-deals/create/CreateFlashDealBreadcrumb.tsx`
- `src/components/flash-deals/create/FlashDealProductsModal.tsx`

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
