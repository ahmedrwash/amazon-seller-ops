import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadOpsHubDashboard } from '@/services/opsHubDashboard';
import { freshness, numeric, productMetrics, sumKnown } from '@/utils/opsHubMetrics';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle, BarChart3, DollarSign, Loader2, Package,
  RefreshCw, ShieldCheck, ShoppingCart, Upload
} from 'lucide-react';

const money = (v, currency) => numeric(v) == null || !currency ? 'Not available' : new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(v);
const num = (v, digits = 0) => numeric(v) == null ? 'Not available' : Number(v).toLocaleString('en-US', { maximumFractionDigits: digits });
const pct = (v) => numeric(v) == null ? 'Not available' : `${Number(v).toFixed(1)}%`;

function Metric({ label, value, sub, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
        {Icon && <Icon className="w-4 h-4 text-[hsl(var(--terracotta))]" />}
      </div>
      <div className="mt-1 text-2xl font-semibold text-[hsl(var(--cinder))]">{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-400">{sub}</div>}
    </div>
  );
}

function HealthPill({ label, status }) {
  const tone = status === 'ok' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : status === 'missing' || status === 'attention' ? 'bg-red-50 text-red-700 border-red-200'
      : 'bg-amber-50 text-amber-700 border-amber-200';
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${tone}`}>{label}</span>;
}

export default function OpsHubDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [economics, setEconomics] = useState([]);
  const [reportSummary, setReportSummary] = useState(null);
  const [reportMatrix, setReportMatrix] = useState([]);
  const [weekly, setWeekly] = useState([]);
  const [ads, setAds] = useState([]);
  const [snapshot, setSnapshot] = useState(null);
  const [sourceErrors, setSourceErrors] = useState([]);
  const adRowCount = ads.length;
  const [activeTab,setActiveTab] = useState('overview');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSourceErrors([]);
    setSnapshot(null);
    setProducts([]); setPerformance([]); setInventory([]); setEconomics([]); setWeekly([]); setAds([]); setReportSummary(null); setReportMatrix([]);
    try {
      const result = await loadOpsHubDashboard();
      const sources = result.sources;
      setSnapshot(result);
      setProducts(sources.products.rows);
      setPerformance(sources.sales.rows);
      setInventory(sources.inventory.rows);
      setEconomics(sources.economics.rows);
      setWeekly(sources.weekly.rows);
      setAds(sources.ads.rows);
      setReportSummary(sources.summary.rows[0] || null);
      setReportMatrix(sources.matrix.rows);
      setSourceErrors(Object.entries(sources).filter(([,source]) => source.error));
    } catch (err) { setError(err.message || 'Could not load Amazon Operations Hub.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const productCards = useMemo(() => products.map(pm => {
    const card = productMetrics(pm, { sales: performance, ads, inventory, economics, weekly }, snapshot.window);
    return { ...card, latest: card.sales.at(-1), weeklyLatest: card.weekly, revenue7: card.revenue, units7: card.units,
      adSpend7: card.spend, acos7: card.acos, tacos7: card.tacos, hasAds: card.ads.length > 0 };
  }), [products, performance, ads, inventory, economics, weekly, snapshot]);
  const currencies = [...new Set(products.map(pm => pm.currency).filter(Boolean))];
  const currency = currencies.length === 1 && products.every(pm => pm.currency === currencies[0]) ? currencies[0] : null;
  const totals = {
    revenue: sumKnown(productCards, 'revenue7'), units: sumKnown(productCards, 'units7'), adSpend: sumKnown(productCards, 'adSpend7'),
    inventory: productCards.length > 0 && productCards.every(card => numeric(card.inv?.available) != null) ? productCards.reduce((sum,card) => sum + numeric(card.inv.available),0) : null,
    hasAds: productCards.some(card => card.hasAds)
  };
  const windowLabel = snapshot?.window.start ? snapshot.window.start + ' – ' + snapshot.window.end : 'No daily period available';
  const weeklyCards = productCards.filter(card => card.weeklyLatest);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--terracotta))]" /></div>;

  return (
    <div className="min-h-screen bg-[hsl(var(--parchment))] pb-12">
      <div className="bg-[hsl(var(--cinder))] text-white px-6 py-5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl">Amazon Operations Hub</h1>
            <p className="text-slate-400 text-sm mt-1">Normalized sales, advertising, inventory and profitability control center</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={load} className="border-white/20 text-white hover:bg-white/10 bg-transparent"><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
            <Button onClick={() => navigate('/ops-hub/import')} className="bg-[hsl(var(--terracotta))] hover:opacity-90 text-white"><Upload className="w-4 h-4 mr-2" />Report Center</Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 mt-6 space-y-6">
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">{[['overview','Overview'],['sales','Sales & Traffic'],['ads','Advertising'],['stock','Inventory'],['finance','Finance'],['products','Products'],['quality','Data Quality']].map(([key,label])=><button type="button" aria-current={activeTab===key ? 'page' : undefined} key={key} onClick={()=>setActiveTab(key)} className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${activeTab===key?'bg-slate-900 text-white':'bg-white text-slate-600 hover:bg-slate-100'}`}>{label}</button>)}</div>
        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{error}</div>}

        {sourceErrors.map(([name,source]) => <div key={name} role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{name}: {source.error}. This source is unavailable.</div>)}
        {snapshot && <p className="text-xs text-slate-600">Daily window: {windowLabel} · Latest recorded sales: {freshness(snapshot.window.end)} · Refreshed {new Date(snapshot.loadedAt).toLocaleString()}. Missing values are not treated as zero.</p>}
        {(activeTab==='overview'||activeTab==='sales') && <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <Metric label="Recorded 7D Revenue" value={money(totals.revenue, currency)} sub={windowLabel} icon={DollarSign} />
          <Metric label="Recorded 7D Units" value={num(totals.units)} icon={ShoppingCart} />
          <Metric label="7D Ad Spend" value={totals.hasAds ? money(totals.adSpend, currency) : 'Not available'} icon={BarChart3} />
          <Metric label="FBA Available" value={num(totals.inventory)} icon={Package} />
          <Metric label="Data Readiness" value={pct(reportSummary?.readiness_pct)} sub={reportSummary ? reportSummary.reports_missing + ' reports missing' : 'No readiness source'} icon={ShieldCheck} />
        </div>}

        {(activeTab==='overview'||activeTab==='sales') && <section className="rounded-2xl border border-[hsl(var(--border))] bg-white p-5 shadow-sm">
          <h2 className="font-heading text-xl">Latest Weekly Workflow Report</h2>
          <p className="text-xs text-slate-500 mt-1">Source: Amazon Business Reports Workflow. Weekly aggregates remain separate from daily totals; STORE_TOTAL and PREVIOUS_PERIOD rows are excluded.</p>
          {weeklyCards.length ? weeklyCards.map(({pm, weeklyLatest:w}) => <div key={pm.id} className="mt-4 space-y-3">
            <p className="text-sm font-semibold">{pm.products?.product_name || pm.asin} · {w.marketplace} · {w.period_start} – {w.period_end}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3"><Metric label="Weekly Revenue" value={money(w.revenue, pm.currency)} /><Metric label="Weekly Units" value={num(w.units_ordered)} /><Metric label="Sessions" value={num(w.sessions)} /><Metric label="Reported Conversion" value={pct(w.conversion_rate)} /></div>
            <p className="break-all text-xs text-slate-500">Source: {w.source_file || 'Unavailable'} · Period freshness: {freshness(w.period_end)} · Imported {w.imported_at ? new Date(w.imported_at).toLocaleString() : 'Unavailable'}</p>
          </div>) : <p className="text-sm text-amber-700 mt-3">No matching weekly workflow reports available.</p>}
        </section>}

        {(activeTab==='overview'||activeTab==='quality') && <section className="rounded-2xl border border-[hsl(var(--border))] bg-white shadow-sm overflow-hidden">
          <div className="p-5 border-b border-[hsl(var(--border))] flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div><h2 className="font-heading text-xl">Data Readiness</h2><p className="text-xs text-slate-400">Source freshness and reporting completeness</p></div>
            <Button variant="outline" size="sm" onClick={() => navigate('/ops-hub/import')}>Open Report Center</Button>
          </div>
          <div className="p-4 space-y-3"><p className="text-sm text-slate-600">Weekly rows match owner, ASIN and marketplace. Import and Delta Update behavior are preserved.</p>{productCards.map(card => <p key={card.pm.id} className="text-xs text-slate-500">{card.pm.asin}: {card.coverage}/7 sales dates · {card.adCoverage}/7 advertising dates · Inventory {freshness(card.inv?.snapshot_date)}</p>)}<div className="flex flex-wrap gap-2">
            {reportMatrix.map(r => <HealthPill key={`${r.report_type_code}-${r.marketplace_code}`} label={`${r.marketplace_code} · ${r.report_name}: ${r.readiness_status}${r.stale ? " · Stale" : ""}`} status={r.readiness_status} />)}
            {!reportMatrix.length && <span className="text-sm text-slate-400">No operating schedule configured.</span>}
          </div></div>
        </section>}

        {(activeTab==='overview'||activeTab==='ads') && <section className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm"><h2 className="font-heading text-xl">Advertising Performance</h2>{adRowCount===0?<div className="text-center py-10"><BarChart3 className="mx-auto text-slate-300 w-10 h-10"/><p className="font-semibold mt-3">No advertising data available in this window</p><p className="text-sm text-slate-500 mt-1">Import campaign reports to calculate ACoS and ROAS. TACoS requires seven matching sales and advertising dates.</p><Button onClick={()=>navigate('/ops-hub/import')} className="mt-4">Import PPC Report</Button></div>:<div className="mt-3 space-y-3">{productCards.map(card => <p key={card.pm.id} className="text-sm">{card.pm.asin} · Spend {money(card.spend, card.pm.currency)} · Ad sales {money(card.adSales, card.pm.currency)} · ACoS {pct(card.acos)} · ROAS {num(card.roas, 2)} · TACoS {pct(card.tacos)} · {card.adCoverage}/7 dates</p>)}</div>}</section>}

        {(activeTab==='overview'||activeTab==='stock') && <section className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm"><h2 className="font-heading text-xl">Inventory Freshness</h2><p className="text-sm text-slate-600 mt-2">Latest stored snapshot: {freshness(inventory.map(row => row.snapshot_date).sort().at(-1))}. Stock values are historical snapshots, not live inventory.</p><Button variant="outline" className="mt-3" onClick={()=>navigate('/ops-hub/import')}>Import Updated Inventory</Button></section>}

        {(activeTab==='overview'||activeTab==='finance') && <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-heading text-xl">Finance</h2><p className="mt-1 text-xs text-slate-500">Versioned unit economics are estimates, not realized profit or cash balances.</p>{productCards.map(card => <div key={card.pm.id} className="mt-4 rounded-xl bg-slate-50 p-4"><p className="font-semibold">{card.pm.products?.product_name || card.pm.asin}</p><p className="mt-1 text-sm">Estimated contribution / unit {money(card.econ?.pre_ad_contribution_per_unit,card.econ?.currency)} · Break-even ACoS {pct(card.econ?.break_even_acos_pct)}</p><p className="mt-2 text-xs text-slate-500">Price: {card.econ?.price_status || 'missing'} · Costs: {card.econ?.cost_status || 'missing'} · Fees: {card.econ?.fee_status || 'missing'}. Source: current unit economics view; no report freshness timestamp.</p></div>)}<p className="mt-3 text-sm text-slate-600">Realized net profit and cash balance are not available from these sources.</p><Button variant="outline" className="mt-3" onClick={()=>navigate('/finance')}>Open Finance</Button></section>}
        {(activeTab==='overview'||activeTab==='sales'||activeTab==='stock'||activeTab==='products') && (productCards.length === 0 ? (
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-white p-16 text-center shadow-sm">
            <Package className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <h2 className="font-heading text-2xl">No product marketplaces</h2>
            <p className="text-slate-500 mt-2">Configure a product and marketplace before importing Amazon data.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {productCards.map(({ pm, latest, weeklyLatest, revenue7, units7, adSpend7, acos7, tacos7, inv, econ, daysCover, hasAds, coverage, sessions, conversion, sales }) => (
              <article key={pm.id} className="rounded-2xl border border-[hsl(var(--border))] bg-white shadow-sm overflow-hidden">
                <div className="bg-[hsl(var(--cinder))] text-white p-5">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-slate-400">{pm.products?.brand || 'Amazon'} · {pm.marketplaces?.code || 'Unavailable'}</div>
                      <h3 className="font-heading text-xl mt-1">{pm.products?.product_name || pm.asin || pm.sku}</h3>
                      <div className="text-xs text-slate-400 mt-1">ASIN {pm.asin || '—'} · SKU {pm.sku || '—'}</div>
                    </div>
                    <span className="text-xs bg-white/10 rounded-full px-2.5 py-1">{pm.listing_status || 'Unknown'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-100 border-b">
                  <div className="bg-white p-4"><div className="text-xs text-slate-400">Recorded 7D Revenue</div><div className="font-semibold mt-1">{money(revenue7, pm.currency)}</div></div>
                  <div className="bg-white p-4"><div className="text-xs text-slate-400">Recorded 7D Units</div><div className="font-semibold mt-1">{num(units7)}</div></div>
                  <div className="bg-white p-4"><div className="text-xs text-slate-400">ACoS</div><div className="font-semibold mt-1">{pct(acos7)}</div></div>
                  <div className="bg-white p-4"><div className="text-xs text-slate-400">TACoS</div><div className="font-semibold mt-1">{hasAds ? pct(tacos7) : '—'}</div></div>
                </div>

                <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div><div className="text-xs text-slate-400">Available</div><div className="font-semibold mt-1">{num(inv?.available)}</div></div>
                  <div><div className="text-xs text-slate-400">Days cover</div><div className="font-semibold mt-1">{daysCover == null ? '—' : `${num(daysCover)} d`}</div></div>
                  <div><div className="text-xs text-slate-400">Estimated contribution / unit</div><div className="font-semibold mt-1">{money(econ?.pre_ad_contribution_per_unit, econ?.currency)}</div></div>
                  <div><div className="text-xs text-slate-400">Break-even ACoS</div><div className="font-semibold mt-1">{pct(econ?.break_even_acos_pct)}</div></div>
                </div>

                <div className="px-5 pb-4 text-xs text-slate-500">{coverage}/7 daily dates · Sessions {num(sessions)} · Conversion {pct(conversion)} · Source: {[...new Set(sales.map(row => row.source_ref || row.source))].join(', ') || 'Unavailable'} · Unit economics: {econ?.cost_status || 'missing'} costs / {econ?.fee_status || 'missing'} fees</div>
                <div className="px-5 py-3 bg-slate-50 border-t text-xs text-slate-500 flex flex-wrap justify-between gap-2">
                  <span>Latest daily sales: {freshness(snapshot?.window.end)} · Weekly report: {weeklyLatest?.period_end || 'Not available'}</span>
                  <span>Latest inventory: {freshness(inv?.snapshot_date)}</span>
                </div>
              </article>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
