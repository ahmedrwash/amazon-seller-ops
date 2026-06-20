# Amazon Ops Hub Architecture

## Overview
The Amazon Operations Hub is designed as a multi-product management tool specifically tailored for Amazon sellers. It centralizes all core operational logic including Profit & Margin calculations, PPC tracking, Inventory Reordering, Break-Even analysis, and Cash Flow projections.

## Database Schema
The hub relies on three core tables structured to maintain RLS constraints and allow limitless metric expansion through JSONB data columns.

### 1. `amazon_products`
The core entity representing a single Amazon listing or product.
- **Fields**: `id` (UUID), `user_id` (UUID - owner), `product_name`, `sku`, `asin`, `category`, `created_at`.
- **Purpose**: Defines the product list available in the Hub's dropdown selector.

### 2. `product_master_inputs`
Stores the static or slowly-changing parameters used across various operational tabs.
- **Fields**: `id` (UUID), `product_id` (FK to amazon_products), `user_id` (UUID - owner), `data` (JSONB).
- **Purpose**: A single 1-to-1 record per product. The `data` JSONB object stores fields like `selling_price`, `cogs_per_unit`, `target_acos`, etc. 
- **Benefit**: Using JSONB allows adding new fields to new tabs without requiring SQL schema migrations.

### 3. `product_weekly_data`
Stores time-series data reported on a weekly basis.
- **Fields**: `id` (UUID), `product_id` (FK), `user_id` (UUID - owner), `week_number` (INT 1-52), `data` (JSONB).
- **Purpose**: Allows tracking weekly trends. The `data` JSONB stores `ppc_spend_this_week`, `units_sold_this_week`, etc.

## RLS Policies
All three tables have Row Level Security enabled.
- **Policy**: `auth.uid() = user_id`
- **Result**: Users can only Select, Insert, Update, or Delete products and related data that they explicitly created.

## Data Flow
1. **Selection**: User selects a `Product` and `Week` from the header in `AmazonOpsHub.jsx`.
2. **Fetching**: The `useOpsHubData.js` hook queries `product_master_inputs` (for the product) and `product_weekly_data` (for the product + week).
3. **Distribution**: The returned JSON objects (`masterData` and `weeklyData`) are passed down as props to all 9 Tab components.
4. **Calculations**: Inside each Tab, `useMemo` is used to calculate derived metrics (e.g. Net Margin) instantly based on the current state.
5. **Saving**: When a user clicks "Save" inside a tab, the tab calls `onSaveMaster` or `onSaveWeekly` with its locally updated fields, which patches the JSONB data in Supabase.

## Adding New Features
### Adding a New Tab
1. Create a new component in `src/pages/ops/NewTab.jsx`.
2. Accept `masterData`, `weeklyData`, `onSaveMaster`, `onSaveWeekly` props.
3. Initialize local state from `masterData`/`weeklyData`.
4. Add the component to the `TabsContent` in `AmazonOpsHub.jsx`.

### Adding New Fields
Simply add new keys to your component's local state. When you call `onSaveMaster(localState)`, the new keys will automatically be merged into the JSONB object in the database.

## `useOpsHubData` Hook
Centralizes all Supabase interactions.