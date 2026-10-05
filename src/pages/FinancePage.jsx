import React, { useEffect, useMemo, useState } from 'react';
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
import { supabase } from '@/lib/customSupabaseClient';

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
  const [entities, setEntities] = useState([]);
  const [period, setPeriod] = useState('mtd');
  const [currency, setCurrency] = useState('USD');
  const [salesRows, setSalesRows] = useState([]);
  const [companyRows, setCompanyRows] = useState([]);
  const [amazonFinanceRows, setAmazonFinanceRows] = useState([]);
  const [adRows, setAdRows] = useState([]);
  const [inventoryRows, setInventoryRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true); setDataError(null);
      const [sales, companyData, inventory, amazonFinance, ads, entityData] = await Promise.all([
        supabase.from('sales_daily').select('sales_date,ordered_product_sales,units_ordered,total_order_items,refund_amount,currency,source').order('sales_date', { ascending: false }),
        supabase.from('financial_transactions').select('id,legal_entity_id,transaction_date,transaction_type,description,original_amount,original_currency,reporting_amount,reporting_currency,payment_status,document_url,channel,marketplace,brand,sku,source').order('transaction_date', { ascending: false }),
        supabase.from('inventory_snapshots').select('snapshot_date,total_inventory,available,reserved,source').order('snapshot_date', { ascending: false }).limit(1),
        supabase.from('amazon_financial_transactions').select('transaction_date,transaction_type,amount,currency,source').order('transaction_date', { ascending: false }),
        supabase.from('ad_performance_daily').select('performance_date,spend,ad_sales,ad_orders,ad_units,currency,source').order('performance_date', { ascending: false }),
        supabase.from('legal_entities').select('id,legal_name,functional_currency,status').order('legal_name')
      ]);
      const err = sales.error || companyData.error || inventory.error || amazonFinance.error || ads.error || entityData.error;
      if (err) setDataError(err.message);
      setSalesRows(sales.data || []); setCompanyRows(companyData.data || []); setInventoryRows(inventory.data || []);
      setAmazonFinanceRows(amazonFinance.data || []); setAdRows(ads.data || []); setEntities(entityData.data || []); setLoading(false);
    };
    load();
  }, []);

  const periodStart = useMemo(() => {
    if (period === 'all') return null;
    const d = new Date();
    if (period === 'mtd') d.setDate(1);
    if (period === 'qtd') d.setMonth(Math.floor(d.getMonth() / 3) * 3, 1);
    if (period === 'ytd') d.setMonth(0, 1);
    return d.toISOString().slice(0, 10);
  }, [period]);

  const filteredSales = useMemo(() => salesRows.filter(r =>
    r.currency === currency && (!periodStart || r.sales_date >= periodStart)
  ), [salesRows, currency, periodStart]);

  const filteredCompany = useMemo(() => companyRows.filter(r =>
    (r.reporting_currency === currency || r.original_currency === currency) &&
    (entity === 'all' || r.legal_entity_id === entity) &&
    (!periodStart || r.transaction_date >= periodStart)
  ), [companyRows, currency, entity, periodStart]);

  const filteredAmazonFinance = useMemo(() => amazonFinanceRows.filter(r =>
    r.currency === currency && (!periodStart || r.transaction_date >= periodStart)
  ), [amazonFinanceRows, currency, periodStart]);

  const filteredAds = useMemo(() => adRows.filter(r =>
    r.currency === currency && (!periodStart || r.performance_date >= periodStart)
  ), [adRows, currency, periodStart]);

  const amazon = useMemo(() => {
    const sales = filteredSales.reduce((n, r) => n + Number(r.ordered_product_sales || 0), 0);
    const orders = filteredSales.reduce((n, r) => n + Number(r.total_order_items || 0), 0);
    const units = filteredSales.reduce((n, r) => n + Number(r.units_ordered || 0), 0);
    const refunds = filteredSales.reduce((n, r) => n + Number(r.refund_amount || 0), 0);
    const fees = Math.abs(filteredAmazonFinance.filter(r => /fee|commission|fba|storage/i.test(r.transaction_type || '')).reduce((n, r) => n + Number(r.amount || 0), 0));
    const ppc = filteredAds.reduce((n, r) => n + Number(r.spend || 0), 0);
    return { sales, orders, units, refunds, averageOrderValue: orders ? sales / orders : 0,
      fees, ppc, profit: sales - refunds - fees - ppc, inventoryUnits: Number(inventoryRows[0]?.total_inventory || 0) };
  }, [filteredSales, filteredAmazonFinance, filteredAds, inventoryRows]);

  const company = useMemo(() => {
    const amount = (r) => Number(r.reporting_currency === currency ? r.reporting_amount : r.original_amount || 0);
    const revenue = filteredCompany.filter(r => r.transaction_type === 'revenue').reduce((n, r) => n + amount(r), 0) + amazon.sales;
    const expenses = filteredCompany.filter(r => ['expense','refund'].includes(r.transaction_type)).reduce((n, r) => n + amount(r), 0);
    const funding = filteredCompany.filter(r => r.transaction_type === 'funding').reduce((n, r) => n + amount(r), 0);
    const payables = filteredCompany.filter(r => ['due','partial','overdue'].includes(r.payment_status)).reduce((n, r) => n + amount(r), 0);
    return { revenue, expenses, grossProfit: revenue - amazon.refunds - amazon.fees,
      netProfit: revenue - expenses - amazon.refunds - amazon.fees - amazon.ppc, cashInvested: funding, inventoryValue: 0,
      payables, transactions: filteredCompany.length };
  }, [filteredCompany, amazon.sales]);

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
            {entities.map((item) => <option key={item.id} value={item.id}>{item.legal_name}</option>)}
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

        <TabsContent value="overview" className="mt-6 space-y-8">\n          {loading && <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-sm text-slate-400">Loading financial data...</div>}\n          {dataError && <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-4 text-sm text-red-300">Data error: {dataError}</div>}
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
