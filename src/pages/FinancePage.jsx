import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import {
  ArrowDownRight, ArrowUpRight, Building2, Boxes, CircleDollarSign,
  FileText, Landmark, PackageCheck, Plus, ReceiptText, ShoppingCart, WalletCards
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CostEntryModal from '@/components/finance/CostEntryModal';
import { useCostEntries } from '@/hooks/useFinance';
import { formatCurrency } from '@/utils/financeUtils';

const MetricCard = ({ label, value, icon: Icon, hint }) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-sm">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm text-slate-400">{label}</p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-white">{value}</p>
        {hint && <p className="mt-2 text-xs text-slate-500">{hint}</p>}
      </div>
      <div className="rounded-xl border border-slate-700 bg-slate-800/80 p-2.5 text-slate-300">
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </div>
);

const EmptyState = ({ title, description }) => (
  <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 px-6 py-12 text-center">
    <p className="font-medium text-slate-200">{title}</p>
    <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">{description}</p>
  </div>
);

const FinancePage = () => {
  const { createCostEntry } = useCostEntries();
  const [costModalOpen, setCostModalOpen] = useState(false);
  const [entity, setEntity] = useState('all');
  const [period, setPeriod] = useState('mtd');
  const [currency, setCurrency] = useState('EUR');

  // UI v2 deliberately renders no invented finance values.
  // These zero states are replaced by source-backed aggregates in the data integration step.
  const company = useMemo(() => ({
    revenue: 0,
    expenses: 0,
    grossProfit: 0,
    netProfit: 0,
    cashInvested: 0,
    inventoryValue: 0,
    payables: 0,
    transactions: 0,
  }), [entity, period, currency]);

  // Amazon metrics must be populated only from Amazon Ops Hub.
  const amazon = useMemo(() => ({
    sales: 0,
    orders: 0,
    units: 0,
    averageOrderValue: 0,
    fees: 0,
    ppc: 0,
    profit: 0,
    inventoryUnits: 0,
  }), [period, currency]);

  const handleCreateCost = async (data) => {
    await createCostEntry(data);
    setCostModalOpen(false);
  };

  const money = (value) => formatCurrency(value, currency);

  return (
    <div className="space-y-6">
      <Helmet><title>Financial Command Center - AMZ 1NLT</title></Helmet>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
            <Landmark className="h-4 w-4" /> AMZ 1NLT / Financial
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Financial Command Center</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Group financial position with Amazon performance sourced from Amazon Ops Hub.
          </p>
        </div>
        <Button onClick={() => setCostModalOpen(true)} className="bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))]">
          <Plus className="mr-2 h-4 w-4" /> Add Transaction
        </Button>
      </div>

      <div className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 md:grid-cols-3">
        <label className="space-y-1.5 text-xs text-slate-400">
          Company
          <select value={entity} onChange={(e) => setEntity(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white">
            <option value="all">All Companies</option>
            <option value="framelens">Framelens OÜ</option>
          </select>
        </label>
        <label className="space-y-1.5 text-xs text-slate-400">
          Period
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white">
            <option value="mtd">Month to date</option>
            <option value="qtd">Quarter to date</option>
            <option value="ytd">Year to date</option>
            <option value="all">All time</option>
          </select>
        </label>
        <label className="space-y-1.5 text-xs text-slate-400">
          Reporting currency
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white">
            <option>EUR</option><option>USD</option><option>GBP</option><option>SAR</option>
          </select>
        </label>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-slate-900 border border-slate-800">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="amazon">Amazon & Inventory</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-8">
          <section>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-white"><Building2 className="h-5 w-5" /> Company Financial Overview</h2>
                <p className="mt-1 text-sm text-slate-500">Consolidated financial layer. No mock values.</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Total Revenue" value={money(company.revenue)} icon={ArrowUpRight} />
              <MetricCard label="Total Expenses" value={money(company.expenses)} icon={ArrowDownRight} />
              <MetricCard label="Gross Profit" value={money(company.grossProfit)} icon={CircleDollarSign} />
              <MetricCard label="Net Profit / Loss" value={money(company.netProfit)} icon={WalletCards} />
              <MetricCard label="Cash Invested / Funding" value={money(company.cashInvested)} icon={Landmark} />
              <MetricCard label="Inventory Value" value={money(company.inventoryValue)} icon={Boxes} />
              <MetricCard label="Outstanding Payables" value={money(company.payables)} icon={ReceiptText} />
              <MetricCard label="Transactions" value={company.transactions.toLocaleString()} icon={FileText} />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
            <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-white"><ShoppingCart className="h-5 w-5" /> Amazon Sales</h2>
                <p className="mt-1 text-sm text-slate-500">Operational source: Amazon Ops Hub only.</p>
              </div>
              <span className="w-fit rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs text-slate-400">Source: Amazon Ops Hub</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Sales" value={money(amazon.sales)} icon={CircleDollarSign} />
              <MetricCard label="Orders" value={amazon.orders.toLocaleString()} icon={ShoppingCart} />
              <MetricCard label="Units Sold" value={amazon.units.toLocaleString()} icon={PackageCheck} />
              <MetricCard label="Average Order Value" value={money(amazon.averageOrderValue)} icon={ReceiptText} />
              <MetricCard label="Amazon Fees" value={money(amazon.fees)} icon={ArrowDownRight} />
              <MetricCard label="PPC Spend" value={money(amazon.ppc)} icon={ArrowDownRight} />
              <MetricCard label="Amazon Profit" value={money(amazon.profit)} icon={ArrowUpRight} />
              <MetricCard label="Inventory Units" value={amazon.inventoryUnits.toLocaleString()} icon={Boxes} />
            </div>
          </section>
        </TabsContent>

        <TabsContent value="transactions" className="mt-6">
          <EmptyState title="Transactions workspace" description="The next integration step connects this view to the new financial_transactions ledger and keeps normal entry simple." />
        </TabsContent>
        <TabsContent value="amazon" className="mt-6">
          <EmptyState title="Amazon & Inventory drill-down" description="This area will read sales, fees, orders, SKUs and inventory directly from Amazon Ops Hub without duplicating operational data." />
        </TabsContent>
        <TabsContent value="reports" className="mt-6">
          <EmptyState title="Financial reports" description="P&L, cash flow, balance sheet, VAT/tax, profitability and inventory valuation will be generated from source-backed financial data." />
        </TabsContent>
      </Tabs>

      <CostEntryModal isOpen={costModalOpen} onClose={() => setCostModalOpen(false)} onSave={handleCreateCost} />
    </div>
  );
};

export default FinancePage;
