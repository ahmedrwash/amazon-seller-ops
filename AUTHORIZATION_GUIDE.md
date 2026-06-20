# Enterprise Authorization System Guide

## Overview---
This system implements a robust Role-Based Access Control (RBAC) mechanism enriched with marketplace-level scoping and granular permissions. It uses Supabase Row Level Security (RLS) policies as the enforcement layer and React Context for UI state management.

## Architecture

### 1. Database Schema
- **`user_marketplaces`**: Join table controlling explicit access to specific marketplaces per user.
- **`audit_logs`**: Immutable record of all critical system actions (Create, Update, Delete).
- **`profiles`**: Extended with permissions:
  - `allowed_marketplace_ids` (UUID Array for fast caching)
  - `can_manage_users` (Boolean)
  - `can_manage_finance` (Boolean)
  - `ops_hub` (Boolean)
- **Record Ownership**: All major tables (`products`, `tasks`, etc.) now include `owner_id`, `created_by`, `updated_by`.

### 2. Access Control Levels
1.  **System Role** (Admin, Ops, Finance, Viewer): High-level feature gating.
2.  **Marketplace Scope**: Users only see data for marketplaces they are explicitly assigned to.
3.  **Row Ownership**: Users can edit/delete records they created or own (unless Admin).

### 3. RLS Policies
Row Level Security is enabled on all tables.
- **SELECT**: Filters by `allowed_marketplace_ids` OR `is_admin()`.
- **INSERT/UPDATE**: Checks `allowed_marketplace_ids` AND ownership (`auth.uid() = owner_id`).
- **DELETE**: Restricted to Owners or Admins.

## Client-Side Implementation

### Hooks
- **`useAuthorization()`**: Primary hook for access checks.
  - `hasMarketplaceAccess(id)`
  - `canEditRecord(record)`
  - `canDeleteRecord(record)`
  - `canManageUsers`
  - `isAdmin`, `isFinance`, etc.
  
- **`useAuth()`**:
  - Exposes `permissions: { hasOpsHubAccess }` to quickly check user capabilities.

### Contexts
- **`AuthContext`**: Fetches and caches permissions from `profiles` table on login.
- **`MarketplaceContext`**: Validates selected marketplace against allowed list; prevents unauthorized switching.

### UI Components
- **`GlobalMarketplaceSelect`**: Filters dropdown options based on permissions.
- **`UserPermissionsPanel`**: Admin interface to toggle flags and manage marketplace access.
- **`AuditTrail`**: Visualizes history for any record.

## Testing & Usage

### Adding a New Protected Feature
1.  Wrap UI element in conditional:

## New Permission: ops_hub

### What it grants
The `ops_hub` permission grants authenticated users access to the `/ops-hub` route (Amazon Operations Hub) and permits them to interact with the underlying database tables dedicated to Ops Hub metrics, calculations, and tracking.

### Default Policy
- By default, all existing users in the `profiles` table are updated to have `ops_hub = true`.
- New users provisioning an account will receive `ops_hub = true` automatically.
- Admins can restrict access to this hub by revoking the permission on a per-user basis.

### Protected Tables
The following tables are secured using the `ops_hub` permission:
1. `amazon_weekly_data`
2. `amazon_milestones`
3. `amazon_monthly_pnl`
4. `amazon_krolog_checklist`

### Table RLS Policies
- **SELECT / INSERT / UPDATE**:
  - Allowed ONLY IF `auth.uid()` corresponds to a profile where `ops_hub = true`, OR if the user is an `Admin`.
- **DELETE**:
  - Strongly restricted to `Admin` role only via `is_admin()`.

### Granting or Revoking Access
To grant or revoke ops hub access, an administrator can edit the `ops_hub` boolean flag in the user's corresponding `profiles` record in Supabase.