# AMZ 1NLT — Financial Module Architecture & Implementation Guide

**Status:** Living documentation  
**Repository:** ahmedrwash/amazon-seller-ops  
**Working branch:** feature/financial-module-v2  
**Last updated:** 2026-10-04

> This document is the source of truth for the Financial Module design and implementation. Contributors must review it before changing financial data structures, calculations, integrations, or UI.

## 1. Design Principles
- Extend the existing Financial module; do not create a disconnected replacement.
- Simple frontend, accounting-grade backend.
- Multi-company / multi-legal-entity from the start.
- Multi-currency: preserve original transaction currency and amount.
- Amazon Ops Hub is the source of truth for Amazon operational data; Financial must not duplicate it.
- Supabase is the financial accounting, classification, relationship, and consolidation layer.
- Google Drive is the official document archive; Financial stores document metadata and links.
- Chat can be an input channel for transactions, but persisted system records are the source of truth.
- Every financial number should be traceable to source data or a financial transaction.

## 2. Business Hierarchy
Group → Legal Entity → Channel → Marketplace/Store → Brand → Product/SKU → Transaction.

The system must support Framelens OÜ now and additional US / Middle East legal entities later.

## 3. Core Accounting Model
### Chart of Accounts
Group-level COA with entity applicability and dimensions.

Main groups:
- 1000 Assets
- 2000 Liabilities
- 3000 Equity
- 4000 Revenue
- 5000 COGS
- 6000 Selling & Marketplace Expenses
- 7000 Operating Expenses
- 8000 Other Income / Expenses

### General Ledger
Use journal headers + balanced journal lines behind the simple transaction UI. Users should not need to manually create double-entry journals for normal workflows.

### Dimensions
Keep accounting accounts separate from analysis dimensions:
- Legal Entity
- Channel
- Marketplace
- Brand
- SKU / Product
- Vendor / Customer
- Cost Center
- Tax Code
- Currency
- Source / Source Reference
- Document

## 4. Multi-Company
Each Legal Entity should have:
- legal name and country
- registration identifiers
- functional/reporting currency
- fiscal year settings
- tax/VAT profile
- bank/payment accounts
- status

Support entity-level reporting and Group consolidation. Intercompany transactions must be identifiable for future elimination during consolidation.

## 5. Multi-Currency
Every financial transaction must preserve:
- original amount
- original currency
- FX rate
- FX rate date
- converted/reporting amount
- reporting currency

Do not overwrite original values after conversion. Accounting conversion should use the applicable transaction-date policy, not today's spot rate.

## 6. Tax / VAT
Tax configuration is per Legal Entity and jurisdiction, not global.

Support:
- tax registration / VAT number
- tax codes and rates
- input tax
- output tax
- tax payable / receivable
- tax periods
- filing/status metadata

Jurisdiction-specific tax rules must be configured when an entity is activated in that jurisdiction.

## 7. Amazon Ops Hub Boundary
**Amazon Ops Hub is the sole operational source for Amazon data.**

Examples:
- sales
- orders
- units
- products / SKUs
- inventory
- Amazon fees
- settlements / payouts
- returns
- PPC / advertising when available

The Financial Module reads/aggregates these sources for accounting and reporting. It must not create a second operational copy of Amazon data.

Current relevant Supabase objects include:
- amazon_financial_transactions
- inventory and inventory history/movements/snapshots
- amazon report ingestion tables
- v_amazon_ops_* views

## 8. Financial Data Layer
Current finance foundation includes:
- cost_entries
- revenue_entries
- financial_targets
- financial_notes
- cashflow_history

These are existing assets to extend/migrate carefully. Do not destructively replace them without migration and reconciliation.

Target financial capabilities:
- legal entities
- chart of accounts
- tax profiles/codes
- financial transactions
- journal entries / journal lines
- FX rates
- documents / source links
- vendors/customers
- bank/payment accounts
- payables/receivables
- budgets
- accounting periods
- audit trail
- allocation rules

## 9. Documents
Google Drive is the official document archive.

Suggested structure:
Framelens / Financial / Year / Document Type

Financial records store metadata + Drive link for invoices, receipts, contracts and supporting evidence. Provide a **View Document** action from the application.

## 10. User Experience
Keep navigation small and intuitive:
1. Overview
2. Transactions
3. Amazon & Inventory
4. Reports

Complex accounting mechanics should run behind the UI.

### Transaction Entry
Normal entry should require only what is necessary:
- Legal Entity
- Date
- Amount
- Currency
- Type/category
- Vendor/customer where relevant
- Amazon/Product/SKU link when relevant
- Payment status
- Supporting document

The backend determines COA mapping, tax treatment, FX conversion and journal entries where rules are sufficiently defined. Ambiguous classifications require confirmation.

## 11. Executive Dashboard — First Page
The first Financial page must be an Executive Dashboard.

### Company Financial Overview
Include, where data supports it:
- Total Revenue
- Total Expenses
- Gross Profit
- Net Profit/Loss
- Cash Invested / Funding
- Inventory Value
- Outstanding Payables
- Transaction / document counts

### Amazon Sales Dashboard
Read from Amazon Ops Hub:
- Total Sales
- Orders
- Units Sold
- Average Selling Price / AOV as appropriate
- Amazon Fees
- PPC Spend when available
- Profit / Margin
- Inventory Units
- SKU/Product performance

Top filters:
- Legal Entity / Company
- Period
- Reporting Currency

Cards/metrics should support drill-down to their source/detail where practical.

## 12. Reporting
Planned reports:
- P&L
- Balance Sheet
- Cash Flow
- VAT / Tax
- Product Profitability
- Inventory Valuation / COGS
- Budget vs Actual
- Payables / Receivables
- Entity reports
- Consolidated Group reports

## 13. Controls
Backend-ready controls should include:
- user/entity permissions
- audit trail
- accounting period close/lock
- approval status where needed
- duplicate detection
- reconciliation
- source traceability

Keep these controls unobtrusive in the everyday UI.

## 14. Funding
Owner/shareholder cash must not automatically be treated as expense. Support classification such as:
- Share Capital / Contribution
- Shareholder Loan
- Expense Paid on Behalf of Company

## 15. Current-State Findings — 2026-10-04
- Supabase project **Amazon** is ACTIVE_HEALTHY.
- Existing FinancePage is currently a prototype and contains mock summary metrics and placeholders.
- Existing frontend finance entry is product/marketplace-centric.
- Existing finance utility formatting defaults to USD.
- Amazon financial transactions already preserve a currency field.
- Amazon Ops Hub and newer Amazon operational/reporting tables/views already exist.
- Therefore implementation should extend the existing system, remove mock financial presentation, and introduce company accounting without duplicating Amazon operational data.

## 16. Implementation Roadmap
### Phase 0 — Discovery & Safety
- Inventory current schema, views, RLS/policies, frontend hooks and finance components.
- Map Amazon Ops Hub sources to financial reporting requirements.
- Identify current real records vs test/mock data.
- Define migration/backfill and reconciliation checks.
- Work on a feature branch and avoid destructive changes.

**Acceptance:** documented source map and migration plan; existing Amazon Ops Hub remains intact.

### Phase 1 — Financial Foundation
- Add Group / Legal Entity model.
- Add COA and account mapping.
- Add entity tax profiles/tax codes.
- Add currencies/FX model.
- Add financial transaction + GL journal foundation.
- Add source/document references and audit fields.
- Seed Framelens OÜ and initial COA after configuration is confirmed.

**Acceptance:** a transaction can be stored in original currency, assigned to an entity/account/dimensions, and represented by balanced journal lines.

### Phase 2 — Existing Data Migration
- Map existing cost_entries and other company financial records.
- Preserve source IDs for traceability.
- Classify company vs Amazon-linked costs.
- Reconcile migrated totals against legacy records.
- Do not duplicate Amazon operational transactions.

**Acceptance:** legacy totals reconcile to the new financial layer with documented exceptions.

### Phase 3 — Executive Dashboard
- Replace FinancePage mock metrics.
- Build Company Financial Overview.
- Build Amazon Sales section using Amazon Ops Hub sources.
- Add Company / Period / Currency filters.
- Add drill-down navigation.

**Acceptance:** no mock financial KPI remains; displayed KPIs are source-backed.

### Phase 4 — Simple Transactions
- Build simplified Add/Edit Transaction UX.
- Support company/general and Amazon/SKU-linked transactions.
- Add paid/due/partial status.
- Add document link and source metadata.
- Prepare chat-origin transaction workflow against the same backend.

**Acceptance:** user can record a normal expense/revenue/funding transaction without manually creating accounting journals.

### Phase 5 — Reports
- P&L
- Cash Flow
- Balance Sheet
- VAT/Tax
- Product Profitability
- Inventory/COGS
- Payables/Receivables
- Budget vs Actual

**Acceptance:** reports reconcile to GL/source data and support entity/period/currency filters.

### Phase 6 — Multi-Entity & Consolidation
- Activate additional entities as created.
- Entity-specific tax configuration.
- Intercompany classification.
- Consolidated reporting and elimination logic.

**Acceptance:** individual entity and consolidated group reporting can be produced without double counting intercompany activity.

### Phase 7 — Controls & Automation
- period close
- approval workflow where useful
- reconciliation
- alerts
- forecasting after sufficient history
- enhanced chat-driven classification/entry

## 17. Change Management
When changing the Financial Module:
1. Read this document first.
2. Preserve the Amazon Ops Hub boundary.
3. Do not introduce duplicate sources of truth.
4. Document schema/architecture decisions here.
5. Update roadmap status/acceptance criteria when a phase changes.
6. Use migrations for database changes; avoid ad-hoc destructive production edits.
7. Validate reconciliation before removing or deprecating legacy paths.

## 18. Decision Log
- 2026-10-04: Existing Financial module will be redesigned, not replaced with a disconnected module.
- 2026-10-04: Simple frontend / accounting-grade backend adopted.
- 2026-10-04: Multi-company and entity-specific VAT/Tax adopted.
- 2026-10-04: Multi-currency with preservation of original values adopted.
- 2026-10-04: Amazon Ops Hub designated as sole Amazon operational source.
- 2026-10-04: Google Drive designated official financial document archive.
- 2026-10-04: Chat designated as an input channel; persisted financial system remains source of truth.
- 2026-10-04: First Financial page will contain Company Financial Overview + Amazon Sales Dashboard.
- 2026-10-04: This repository document is the living implementation reference.
