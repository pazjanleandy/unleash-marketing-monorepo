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
- `vouchers`
  - Voucher listing and management UI.
- `create-voucher`
  - Voucher creation flow.

Routing is view-state based in `src/App.tsx`:
- Clicking the `Vouchers` marketing tool opens `vouchers`.
- Clicking `+ Create` from vouchers opens `create-voucher`.
- Back/Cancel actions return to the previous view.

## Daily Update
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
  - Step 2: Voucher Display & Applicable Products
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
- Removed the `Shopee Smart Voucher` row from Reward Settings.
- Updated styling to match the blue theme used across vouchers UI.

#### 4) Voucher Display Settings Improvements
- Reworked `Voucher Display Setting` into accessible segmented controls using radio inputs.
- Improved segmented control visual states (hover, active press, selected, focus ring).
- Fixed mobile interaction issue where segmented buttons could appear to work only once by using instance-unique radio group names (`useId`) to avoid collisions between mobile and hidden desktop instances.

#### 5) Vouchers Mobile Card Redesign
- Refined mobile voucher cards for readability and scanability:
  - prioritized hierarchy (value first)
  - compact amount display (`$20 OFF` style)
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
  - Controls active view (`marketing`, `vouchers`, `create-voucher`)
  - Wires cross-view navigation callbacks

### Marketing Components
- `src/components/marketing/MarketingHero.tsx`
- `src/components/marketing/MarketingToolsPanel.tsx`
- `src/components/marketing/ToolSectionBlock.tsx`
- `src/components/marketing/ToolCardItem.tsx`
- `src/components/marketing/IconMark.tsx`
- `src/components/marketing/data.ts`
- `src/components/marketing/types.ts`

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
