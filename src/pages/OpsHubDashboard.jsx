import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle, BarChart3, DollarSign, Loader2, Package,
  RefreshCw, ShieldCheck, ShoppingCart, Upload
} from 'lucide-react';

const money = (v) => v == null ? '—' : `$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const num = (v, digits = 0) => v == null ? '—' : Number(v).toLocaleString('en-US', { maximumFractionDigits: digits });
const pct = (v) => v == null ? '—' : `${Number(v).toFixed(1)}%`;

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

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [pmRes, perfRes, invRes, econRes, reportRes, matrixRes] = await Promise.all([
        supabase.from('product_marketplaces').select('id,product_id,asin,sku,currency,listing_status,products(id,product_name,brand,main_category),marketplaces(code,name)').order('created_at', { ascending: false }),
        supabase.from('v_product_daily_performance').select('*').order('sales_date', { ascending: false }).limit(250),
        supabase.from('inventory_snapshots').select('*').order('snapshot_date', { ascending: false }).limit(250),
        supabase.from('v_current_unit_economics').select('*'),
        supabase.from('v_amazon_ops_dashboard_summary').select('*').maybeSingle(),
        supabase.from('v_amazon_ops_report_matrix').select('*').order('report_name'),
      ]);

      for (const r of [pmRes, perfRes, invRes, econRes, reportRes, matrixRes]) if (r.error) throw r.error;
      setProducts(pmRes.data || []);
      setPerformance(perfRes.data || []);
      setInventory(invRes.data || []);
      setEconomics(econRes.data || []);
      setReportSummary(reportRes.data || null);
      setReportMatrix(matrixRes.data || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Could not load Amazon Operations Hub.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const productCards = useMemo(() => products.map(pm => {
    const perfRows = performance.filter(r => r.product_marketplace_id === pm.id).sort((a, b) => String(b.sales_date).localeCompare(String(a.sales_date)));
    const latest = perfRows[0] || null;
    const last7 = perfRows.slice(0, 7);
    const revenue7 = last7.reduce((s, r) => s + Number(r.revenue || 0), 0);
    const units7 = last7.reduce((s, r) => s + Number(r.units_ordered || 0), 0);
    const adSpend7 = last7.reduce((s, r) => s + Number(r.ad_spend || 0), 0);
    const adSales7 = last7.reduce((s, r) => s + Number(r.ad_sales || 0), 0);
    const tacos7 = revenue7 > 0 ? (adSpend7 / revenue7) * 100 : null;
    const acos7 = adSales7 > 0 ? (adSpend7 / adSales7) * 100 : null;
    const inv = inventory.filter(x => x.product_marketplace_id === pm.id).sort((a, b) => String(b.snapshot_date).localeCompare(String(a.snapshot_date)))[0] || null;
    const econ = economics.find(x => x.product_marketplace_id === pm.id) || null;
    const velocity = units7 > 0 ? units7 / Math.max(last7.length, 1) : 0;
    const daysCover = inv && velocity > 0 ? Number(inv.available || 0) / velocity : null;
    return { pm, latest, revenue7, units7, adSpend7, acos7, tacos7, inv, econ, daysCover };
  }), [products, performance, inventory, economics]);

  const totals = useMemo(() => productCards.reduce((a, x) => {
    a.revenue += x.revenue7;
    a.units += x.units7;
    a.adSpend += x.adSpend7;
    a.inventory += Number(x.inv?.available || 0);
    return a;
  }, { revenue: 0, units: 0, adSpend: 0, inventory: 0 }), [productCards]);

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
        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{error}</div>}

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <Metric label="7D Revenue" value={money(totals.revenue)} icon={DollarSign} />
          <Metric label="7D Units" value={num(totals.units)} icon={ShoppingCart} />
          <Metric label="7D Ad Spend" value={money(totals.adSpend)} icon={BarChart3} />
          <Metric label="FBA Available" value={num(totals.inventory)} icon={Package} />
          <Metric label="Data Readiness" value={`${Number(reportSummary?.readiness_pct || 0).toFixed(0)}%`} sub={`${reportSummary?.reports_missing || 0} reports missing`} icon={ShieldCheck} />
        </div>

        <section className="rounded-2xl border border-[hsl(var(--border))] bg-white shadow-sm overflow-hidden">
          <div className="p-5 border-b border-[hsl(var(--border))] flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div><h2 className="font-heading text-xl">Data Readiness</h2><p className="text-xs text-slate-400">What the operating team still needs to upload</p></div>
            <Button variant="outline" size="sm" onClick={() => navigate('/ops-hub/import')}>Open Report Center</Button>
          </div>
          <div className="p-4 flex flex-wrap gap-2">
            {reportMatrix.map(r => <HealthPill key={`${r.report_type_code}-${r.marketplace_code}`} label={`${r.report_name}: ${r.readiness_status}`} status={r.readiness_status} />)}
            {!reportMatrix.length && <span className="text-sm text-slate-400">No operating schedule configured.</span>}
          </div>
        </section>

        {productCards.length === 0 ? (
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-white p-16 text-center shadow-sm">
            <Package className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <h2 className="font-heading text-2xl">No product marketplaces</h2>
            <p className="text-slate-500 mt-2">Configure a product and marketplace before importing Amazon data.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {productCards.map(({ pm, latest, revenue7, units7, adSpend7, acos7, tacos7, inv, econ, daysCover }) => (
              <article key={pm.id} className="rounded-2xl border border-[hsl(var(--border))] bg-white shadow-sm overflow-hidden">
                <div className="bg-[hsl(var(--cinder))] text-white p-5">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-slate-400">{pm.products?.brand || 'Amazon'} · {pm.marketplaces?.code || 'US'}</div>
                      <h3 className="font-heading text-xl mt-1">{pm.products?.product_name || pm.asin || pm.sku}</h3>
                      <div className="text-xs text-slate-400 mt-1">ASIN {pm.asin || '—'} · SKU {pm.sku || '—'}</div>
                    </div>
                    <span className="text-xs bg-white/10 rounded-full px-2.5 py-1">{pm.listing_status || 'Unknown'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-100 border-b">
                  <div className="bg-white p-4"><div className="text-xs text-slate-400">7D Revenue</div><div className="font-semibold mt-1">{money(revenue7)}</div></div>
                  <div className="bg-white p-4"><div className="text-xs text-slate-400">7D Units</div><div className="font-semibold mt-1">{num(units7)}</div></div>
                  <div className="bg-white p-4"><div className="text-xs text-slate-400">ACoS</div><div className="font-semibold mt-1">{pct(acos7)}</div></div>
                  <div className="bg-white p-4"><div className="text-xs text-slate-400">TACoS</div><div className="font-semibold mt-1">{pct(tacos7)}</div></div>
                </div>

                <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div><div className="text-xs text-slate-400">Available</div><div className="font-semibold mt-1">{num(inv?.available)}</div></div>
                  <div><div className="text-xs text-slate-400">Days cover</div><div className="font-semibold mt-1">{daysCover == null ? '—' : `${num(daysCover)} d`}</div></div>
                  <div><div className="text-xs text-slate-400">Contribution / unit</div><div className="font-semibold mt-1">{money(econ?.pre_ad_contribution_per_unit)}</div></div>
                  <div><div className="text-xs text-slate-400">Break-even ACoS</div><div className="font-semibold mt-1">{pct(econ?.break_even_acos_pct)}</div></div>
                </div>

                <div className="px-5 py-3 bg-slate-50 border-t text-xs text-slate-500 flex flex-wrap justify-between gap-2">
                  <span>Latest sales date: {latest?.sales_date || 'No actual sales report yet'}</span>
                  <span>Latest inventory: {inv?.snapshot_date || 'Not uploaded'}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
