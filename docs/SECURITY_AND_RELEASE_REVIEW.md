# Security and release review — 2026-10-12

## Scope and release gate

Repository: `ahmedrwash/amazon-seller-ops`. Existing production: `https://amz.1nlt.com/ops-hub`.
No website, DNS record, domain, or email plan was created or replaced.
The approved design reference was not provided; the existing parchment/cinder/terracotta visual style was preserved with all seven requested sections.

## Dependency audit

The checked-out baseline was `16bf58f8`. `npm ci` succeeded after explicit workspace write access resolved Windows EPERM errors.
Baseline `npm audit`: **19 packages: 14 High, 5 Moderate**.
Baseline `npm audit --omit=dev`: **17 packages: 12 High, 5 Moderate**.
Hostinger's reported 39 (20 High, 17 Moderate, with two other severities unspecified) was not reproduced against this lockfile. Its deployment-specific scan must be retrieved after the hosting connector is loaded; an older lockfile, different scan time, or different counting may explain the mismatch, but that is not verified.

Compatible transitive fixes were applied with `npm audit fix --package-lock-only`, then installed and locked. `npm audit fix --force` was not used.
React Router DOM was explicitly assessed and upgraded to **7.18.4** to address redirects and hydration advisories. This application uses React 18, Node 22 in CI, BrowserRouter/Routes, and absolute navigation paths; it has no nested splat route, data router loaders/actions, or SSR hydration. Version 7 retains these DOM exports. Full lint/build verification and routing smoke tests are release gates.
`tailwindcss-animate` was moved to devDependencies because it is used only by the Tailwind build configuration. This also correctly classifies the Tailwind peer dependency as build-time. The browser crypto dependency was removed after disabling client-side password encryption.

Final production dependency audit: **0 findings**. Full audit: **8 packages: 5 High, 3 Moderate**:

| Package | Severity | Scope / action |
| --- | --- | --- |
| braces | High | Build-time pattern parsing; advisory GHSA-vfj7-8cjw-p6xm includes all available 3.x releases |
| chokidar | High | Inherits braces finding via Tailwind |
| fast-glob | High | Inherits micromatch/braces finding via Tailwind |
| micromatch | High | Inherits braces finding via Tailwind |
| tailwindcss | High | Inherits build dependency findings; retain 3.x pending assessed CSS migration |
| postcss-selector-parser | Moderate | GHSA-rj75-hqrm-r3gf; nested parser in Tailwind 3.x |
| postcss-nested | Moderate | Inherits selector-parser finding |
| tailwindcss-animate | Moderate | npm 10 reports the Tailwind peer finding through this build plugin |

These are eight affected package nodes, not eight independent vulnerabilities. Do not feed untrusted patterns/CSS to the build tools. They do not ship as runtime server packages in this static Vite application. A Tailwind 4 migration needs separate visual regression testing; no breaking forced migration was performed here.
`react-beautiful-dnd` and Recharts 2.x remain deprecated. No audit finding was returned for them; replacing them is separate work.

## Frontend security

- Email HTML now renders in an iframe with an empty sandbox and restrictive CSP. Scripts, forms, external resources and same-origin access are blocked. This intentionally removes remote image loading.
- Frontend `VITE_EMAIL_ENCRYPTION_KEY` and the public demo AES key were removed. New credential creation/password updates fail closed with an explanatory message until secure server-side storage is implemented. Existing metadata updates remain available. Credential listing excludes password columns.
- **Remaining High risk:** one legacy credential record exists. Its stored ciphertext uses the previous client-visible key scheme. Migrate it to server-side secrets and rotate the mailbox credential through the account owner's secure workflow. Frontend changes do not retroactively secure it; privileged database clients may still retrieve ciphertext.
- Client role provisioning defaults to viewer, never user-editable metadata.
- Production builds omit Horizons console/error/fetch hooks that posted runtime details to a wildcard parent origin. Development CORS is restricted to localhost.
- The committed Supabase JWT is a public **anon** key, not a service_role key. No secret key was found in the inspected frontend configuration. Hostinger's actual environment variables remain uninspected until direct hosting access is available.

## Supabase

Project `ehanopftvshlbanmhrxu` was inspected directly. All public base tables have RLS enabled. All 14 public views use `security_invoker=true`. Sales, ads, inventory and weekly workflow policies scope reads by authenticated owner; sales/ads/inventory updates also check the owner.
Anonymous REST requests exposed zero rows: weekly returned an empty array; sales, ads, inventory and profiles returned permission denied.

Applied migration `20261011211551_harden_profile_identity.sql`:

- Derives profile email from `auth.users`, preventing client identity spoofing in invited-role provisioning.
- Resets privilege flags on profile insertion, while preserving trusted invitation-role lookup and existing primary-admin identity.
- Adds a private trigger guarding identity and authorization fields on updates; non-admins cannot alter role, active state, module flags or allowed marketplaces.
- Trigger function execution is revoked from PUBLIC/anon/authenticated; it is not a public RPC.

Rollback-only authenticated-viewer probes confirmed privilege escalation is denied, spoofed profile email is replaced by its Auth email, the user remains a viewer, and the viewer can read its own profile. No persistent test account or modified profile remains.
The Supabase CLI was blocked by Windows Device Guard, so the remote migration API generated the actual migration version; its exact SQL and version are committed for reproducibility.

Four advisor notices remain:

- `public.can_edit()`, `public.is_admin()`, `public.is_editor()` are intentional role-check helpers: fixed search_path, no caller parameters, read only `auth.uid()`'s trusted profile, return a boolean. Removing their privileges indiscriminately would break policies. They remain reviewed warnings. [Advisor remediation](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).
- Leaked-password protection is disabled. Enable it in Supabase Auth after confirming plan support. [Password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## Data lineage and freshness

Live source evidence at review time:

| Domain | Source | Observed |
| --- | --- | --- |
| Daily sales | sales_daily / BusinessReport-10-01-26.csv | Latest date 2026-09-30; recorded 7-day window 2026-09-24–30: USD 387.81, 20 units, 160 sessions, 7 dates |
| Weekly | amazon_weekly_workflow_reports | CURRENT_PERIOD / ASIN B0H2ZS7DP9 / Amazon US, 2026-10-03–09: USD 419.75, 21 units, 127 sessions, reported conversion 16.54%; imported 2026-10-11 20:24:51 UTC |
| Advertising | ad_performance_daily | Zero records; spend, ACoS, ROAS and TACoS unavailable |
| Inventory | inventory_snapshots | 179 available; 2026-08-22, seller_central_report; stale historical stock |
| Finance | v_current_unit_economics | Price/cost/fee statuses all planned; contribution USD 10.59 is an estimate, not realized profit |

Dashboard reads owner-scoped Supabase sources with pagination and independent source errors. Seven days means a calendar window ending at the latest recorded daily sale, explicitly dated and labelled; it is not presented as current rolling sales. No weekly revenue is added to daily revenue. Weekly selection excludes store totals and previous periods and matches owner, marketplace and ASIN. Missing metrics remain unavailable; observed zero advertising spend remains zero. Missing currency suppresses combined monetary totals. TACoS needs complete matching seven-day coverage.
Import/write/Delta Update code was not changed. `sales_daily` retains its unique product-marketplace/date constraint. Live Delta Update execution was not attempted because it writes business facts; non-destructive lineage tests cover separation, not the untracked deployed Edge Function internals.

## Validation and deployment

The first Linux CI run exposed missing optional `@emnapi` lock entries. The lockfile was reconciled with npm 10.9.9 (matching CI), including platform-independent optional dependencies; the npm 10 clean-install dry run passed. The feature branch incorporates staging's existing Data Sources Hub and LLMS generator changes to test the full integration.

- `npm ci`, `npm run lint`, `npm test` (four data-lineage tests), `npm run build`: local checks passed.
- Build emits full commit metadata; production debug-hook absence was checked in generated HTML.
- Current production baseline loaded in the authenticated browser, including daily/weekly metrics and PPC empty state. This validates the existing release, not deployment of this branch.
- Build warning: main JS chunk is approximately 1.9 MB before gzip; consider route splitting later.
- CI now also runs data-lineage tests and `npm audit --omit=dev`.

Existing documented release mechanism is Hostinger GitHub auto-deployment: staging branch → `amz-staging.1nlt.com`, main → `amz.1nlt.com`, identified by `/build-info.json`. This is repository documentation, not yet independently confirmed in hPanel. Production metadata at initial check showed `16bf58f8` / main.
Direct Hostinger MCP servers were registered, but the app must restart to load them. No AI Builder was used for changes. No production files have been uploaded.
After tools are loaded: inspect the existing website/account/build settings and security scan, verify staging for the tested commit, promote that commit, compare production build-info, then smoke-test authenticated dashboard, all seven sections, report center, finance permissions, refresh and browser errors. Do not call production deployment verified before these pass.
