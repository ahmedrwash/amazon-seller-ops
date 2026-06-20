import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  ArrowLeft, Loader2, TrendingUp, TrendingDown, Minus, PenLine, Upload, Package,
} from 'lucide-react';

// ─── Brand palette for charts ────────────────────────────────────────────────
const C = {
  terracotta: '#C0613F',
  cinder: '#1C1917',
  blue: '#3B82F6',
  green: '#10B981',
  amber: '#F59E0B',
  purple: '#8B5CF6',
  slate: '#94A3B8',
  grid: '#E7E1D8',
};

const fmt = (n, type = 'number') => {
  if (n === null || n === undefined || isNaN(n)) return '—';
  if (type === 'currency') return `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  if (type === 'currency2') return `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (type === 'percent') return `${Number(n).toFixed(1)}%`;
  if (type === 'int') return Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
  return Number(n).toLocaleString('en-US', { maximumFractionDigits: 1 });
};

// Compute derived analytics from a raw weekly row
function derive(d) {
  if (!d) return {};
  const sessions = d.sessions || 0;
  const units = d.units_sold_this_week || 0;
  const gmv = d.gmv_this_week || 0;
  const ppcSpend = d.ppc_spend_this_week || 0;
  const ppcRev = d.ppc_revenue_this_week || 0;
  const ppcOrders = d.orders_from_ppc || 0;
  const clicks = d.clicks || 0;

  return {
    conversion: sessions > 0 ? (units / sessions) * 100 : null,
    rps: sessions > 0 ? gmv / sessions : null,
    pvPerSession: sessions > 0 && d.page_views ? d.page_views / sessions : null,
    tacos: gmv > 0 ? (ppcSpend / gmv) * 100 : null,
    acos: ppcRev > 0 ? (ppcSpend / ppcRev) * 100 : null,
    organicUnits: units - ppcOrders >= 0 ? units - ppcOrders : null,
    cpc: clicks > 0 ? ppcSpend / clicks : null,
    ppcCvr: clicks > 0 ? (ppcOrders / clicks) * 100 : null,
  };
}

// ─── KPI card with WoW delta ──────────────────────────────────────────────────
function Delta({ curr, prev, invert = false, suffix = '', isPct = false }) {
  if (curr == null || prev == null || prev === 0) return null;
  const change = ((curr - prev) / Math.abs(prev)) * 100;
  if (!isFinite(change) || Math.abs(change) < 0.05) {
    return <span className="flex items-center gap-0.5 text-xs text-slate-400"><Minus className="w-3 h-3" />0%</span>;
  }
  const up = change > 0;
  const good = invert ? !up : up;
  return (
    <span className={`flex items-center gap-0.5 text-xs font-medium ${good ? 'text-green-600' : 'text-red-500'}`}>
      {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {Math.abs(change).toFixed(0)}%
    </span>
  );
}

function Kpi({ label, value, curr, prev, invert, hint }) {
  return (
    <div className="bg-white border border-[hsl(var(--border))] rounded-xl p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-400 uppercase tracking-wide">{label}</span>
        <Delta curr={curr} prev={prev} invert={invert} />
      </div>
      <div className="text-xl font-mono font-semibold text-[hsl(var(--cinder))]">{value}</div>
      {hint && <div className="text-xs text-slate-400 mt-0.5">{hint}</div>}
    </div>
  );
}

// ─── Chart wrapper ────────────────────────────────────────────────────────────
function ChartCard({ title, subtitle, children }) {
  return (
    <div className="bg-white border border-[hsl(var(--border))] rounded-2xl p-5">
      <div className="mb-3">
        <h3 className="font-heading text-lg text-[hsl(var(--cinder))]">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const tooltipStyle = {
  backgroundColor: '#fff', borderColor: C.grid, borderRadius: 8,
  fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
};

export default function OpsHubProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [weeks, setWeeks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [{ data: prod }, { data: rows }] = await Promise.all([
          supabase.from('products').select('id, product_name, sku, asin, main_category').eq('id', id).maybeSingle(),
          supabase.from('product_weekly_data')
            .select('year, week_number, period_start, period_end, gmv_this_week, units_sold_this_week, sessions, page_views, buy_box_percentage, ppc_spend_this_week, ppc_revenue_this_week, clicks, orders_from_ppc, bsr, total_reviews, average_star_rating, primary_keyword_rank, inventory_at_fba, selling_price, updated_at')
            .eq('product_id', id)
            .order('year', { ascending: true })
            .order('week_number', { ascending: true }),
        ]);
        setProduct(prod);
        setWeeks(rows || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Build chart series with derived metrics
  const series = useMemo(() => weeks.map(w => {
    const dv = derive(w);
    return {
      week: `W${w.week_number}`,
      weekNum: w.week_number,
      revenue: w.gmv_this_week ?? null,
      units: w.units_sold_this_week ?? null,
      sessions: w.sessions ?? null,
      pageViews: w.page_views ?? null,
      buyBox: w.buy_box_percentage ?? null,
      bsr: w.bsr ?? null,
      conversion: dv.conversion != null ? +dv.conversion.toFixed(2) : null,
      rps: dv.rps != null ? +dv.rps.toFixed(2) : null,
      tacos: dv.tacos != null ? +dv.tacos.toFixed(1) : null,
      acos: dv.acos != null ? +dv.acos.toFixed(1) : null,
      ppcSpend: w.ppc_spend_this_week ?? null,
      organicUnits: dv.organicUnits,
      ppcOrders: w.orders_from_ppc ?? null,
    };
  }), [weeks]);

  const latest = weeks[weeks.length - 1];
  const prev = weeks[weeks.length - 2];
  const dLatest = derive(latest);
  const dPrev = derive(prev);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--terracotta))]" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[hsl(var(--parchment))] flex flex-col items-center justify-center gap-4">
        <Package className="w-12 h-12 text-slate-300" />
        <p className="text-slate-500">Product not found.</p>
        <Button onClick={() => navigate('/ops-hub')} variant="outline">Back to Hub</Button>
      </div>
    );
  }

  const hasData = weeks.length > 0;

  return (
    <div className="min-h-screen bg-[hsl(var(--parchment))] pb-16">
      {/* Header */}
      <div className="bg-[hsl(var(--cinder))] text-white px-6 py-5 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <button onClick={() => navigate('/ops-hub')} className="text-slate-400 hover:text-white transition-colors flex-shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="font-heading text-2xl truncate">{product.product_name}</h1>
              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                {product.asin && <span className="text-xs font-mono text-slate-400">{product.asin}</span>}
                {product.sku && <span className="text-xs text-slate-400">SKU: {product.sku}</span>}
                <span className="text-xs text-slate-500">{weeks.length} week{weeks.length !== 1 ? 's' : ''} tracked</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="outline" onClick={() => navigate(`/ops-hub/import`)} className="border-white/20 text-white hover:bg-white/10 bg-transparent h-9">
              <Upload className="w-4 h-4 mr-2" /> Import
            </Button>
            <Button onClick={() => navigate(`/ops-hub/entry?product=${product.id}`)} className="bg-[hsl(var(--terracotta))] hover:opacity-90 text-white h-9">
              <PenLine className="w-4 h-4 mr-2" /> Log Data
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 md:px-8 mt-8 space-y-8">

        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-[hsl(var(--border))]">
            <TrendingUp className="w-12 h-12 text-slate-300 mb-4" />
            <h2 className="font-heading text-2xl text-[hsl(var(--cinder))] mb-2">No weekly data yet</h2>
            <p className="text-slate-500 mb-6">Import an Amazon report or log a week to see trends.</p>
            <div className="flex gap-2">
              <Button onClick={() => navigate('/ops-hub/import')} variant="outline"><Upload className="w-4 h-4 mr-2" /> Import Report</Button>
              <Button onClick={() => navigate(`/ops-hub/entry?product=${product.id}`)} className="bg-[hsl(var(--terracotta))] text-white"><PenLine className="w-4 h-4 mr-2" /> Log Data</Button>
            </div>
          </div>
        ) : (
          <>
            {/* KPI summary — latest week with WoW delta */}
            <div>
              <p className="text-sm font-medium text-slate-500 mb-3">
                Latest: Week {latest.week_number} {prev && <span className="text-slate-400">· vs Week {prev.week_number}</span>}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Kpi label="Revenue" value={fmt(latest.gmv_this_week, 'currency')} curr={latest.gmv_this_week} prev={prev?.gmv_this_week} hint={`${fmt(latest.units_sold_this_week, 'int')} units`} />
                <Kpi label="Conversion" value={dLatest.conversion != null ? fmt(dLatest.conversion, 'percent') : '—'} curr={dLatest.conversion} prev={dPrev.conversion} hint="units ÷ sessions" />
                <Kpi label="Sessions" value={fmt(latest.sessions, 'int')} curr={latest.sessions} prev={prev?.sessions} hint={`${fmt(latest.page_views, 'int')} page views`} />
                <Kpi label="Rev / Session" value={dLatest.rps != null ? fmt(dLatest.rps, 'currency2') : '—'} curr={dLatest.rps} prev={dPrev.rps} hint="monetization" />
                <Kpi label="TACoS" value={dLatest.tacos != null ? fmt(dLatest.tacos, 'percent') : '—'} curr={dLatest.tacos} prev={dPrev.tacos} invert hint="ad spend ÷ revenue" />
                <Kpi label="ACoS" value={dLatest.acos != null ? fmt(dLatest.acos, 'percent') : '—'} curr={dLatest.acos} prev={dPrev.acos} invert hint="spend ÷ ad revenue" />
                <Kpi label="Buy Box" value={latest.buy_box_percentage != null ? fmt(latest.buy_box_percentage, 'percent') : '—'} curr={latest.buy_box_percentage} prev={prev?.buy_box_percentage} hint="featured offer win" />
                <Kpi label="BSR" value={latest.bsr ? `#${fmt(latest.bsr, 'int')}` : '—'} curr={latest.bsr} prev={prev?.bsr} invert hint="category rank" />
              </div>
            </div>

            {/* Charts grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              {/* Revenue & Units */}
              <ChartCard title="Revenue & Units" subtitle="Weekly sales performance">
                <BarChart data={series} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
                  <XAxis dataKey="week" stroke={C.slate} fontSize={12} />
                  <YAxis yAxisId="l" stroke={C.slate} fontSize={12} tickFormatter={v => `$${v}`} />
                  <YAxis yAxisId="r" orientation="right" stroke={C.slate} fontSize={12} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => n === 'Revenue' ? fmt(v, 'currency') : v} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar yAxisId="l" dataKey="revenue" name="Revenue" fill={C.terracotta} radius={[4, 4, 0, 0]} />
                  <Line yAxisId="r" type="monotone" dataKey="units" name="Units" stroke={C.cinder} strokeWidth={2} dot={{ r: 3 }} />
                </BarChart>
              </ChartCard>

              {/* Conversion Rate */}
              <ChartCard title="Conversion Rate" subtitle="Units ÷ sessions — listing health (10–15% is healthy)">
                <AreaChart data={series} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cvr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.green} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={C.green} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
                  <XAxis dataKey="week" stroke={C.slate} fontSize={12} />
                  <YAxis stroke={C.slate} fontSize={12} tickFormatter={v => `${v}%`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={v => `${v}%`} />
                  <Area type="monotone" dataKey="conversion" name="Conversion" stroke={C.green} strokeWidth={2} fill="url(#cvr)" />
                </AreaChart>
              </ChartCard>

              {/* Traffic: Sessions & Page Views */}
              <ChartCard title="Traffic" subtitle="Sessions & page views">
                <LineChart data={series} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
                  <XAxis dataKey="week" stroke={C.slate} fontSize={12} />
                  <YAxis stroke={C.slate} fontSize={12} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="sessions" name="Sessions" stroke={C.blue} strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="pageViews" name="Page Views" stroke={C.purple} strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ChartCard>

              {/* Ad efficiency: TACoS & ACoS */}
              <ChartCard title="Ad Efficiency" subtitle="TACoS (total) vs ACoS (ad-only) — lower is better">
                <LineChart data={series} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
                  <XAxis dataKey="week" stroke={C.slate} fontSize={12} />
                  <YAxis stroke={C.slate} fontSize={12} tickFormatter={v => `${v}%`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={v => `${v}%`} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="tacos" name="TACoS" stroke={C.terracotta} strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="acos" name="ACoS" stroke={C.amber} strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
                </LineChart>
              </ChartCard>

              {/* Organic vs Paid units */}
              <ChartCard title="Organic vs Paid Units" subtitle="How much sells without ads">
                <BarChart data={series} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
                  <XAxis dataKey="week" stroke={C.slate} fontSize={12} />
                  <YAxis stroke={C.slate} fontSize={12} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="organicUnits" name="Organic" stackId="u" fill={C.green} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="ppcOrders" name="Paid (PPC)" stackId="u" fill={C.amber} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartCard>

              {/* Buy Box & BSR */}
              <ChartCard title="Buy Box % & BSR" subtitle="Listing dominance & category rank (BSR axis inverted)">
                <LineChart data={series} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
                  <XAxis dataKey="week" stroke={C.slate} fontSize={12} />
                  <YAxis yAxisId="bb" stroke={C.slate} fontSize={12} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                  <YAxis yAxisId="bsr" orientation="right" stroke={C.slate} fontSize={12} reversed />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line yAxisId="bb" type="monotone" dataKey="buyBox" name="Buy Box %" stroke={C.blue} strokeWidth={2} dot={{ r: 3 }} />
                  <Line yAxisId="bsr" type="monotone" dataKey="bsr" name="BSR" stroke={C.purple} strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ChartCard>
            </div>

            {/* Weekly data table */}
            <div className="bg-white border border-[hsl(var(--border))] rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-[hsl(var(--border))]">
                <h3 className="font-heading text-lg text-[hsl(var(--cinder))]">Weekly Detail</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                    <tr>
                      {['Week', 'Revenue', 'Units', 'Sessions', 'Page Views', 'CVR', 'Rev/Sess', 'Buy Box', 'TACoS', 'ACoS', 'BSR'].map(h => (
                        <th key={h} className="px-3 py-2 text-right first:text-left whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...weeks].reverse().map(w => {
                      const dv = derive(w);
                      return (
                        <tr key={w.week_number} className="border-t border-[hsl(var(--border))] hover:bg-slate-50/60 font-mono">
                          <td className="px-3 py-2 font-sans font-medium text-[hsl(var(--cinder))]">Week {w.week_number}</td>
                          <td className="px-3 py-2 text-right">{fmt(w.gmv_this_week, 'currency')}</td>
                          <td className="px-3 py-2 text-right">{fmt(w.units_sold_this_week, 'int')}</td>
                          <td className="px-3 py-2 text-right">{fmt(w.sessions, 'int')}</td>
                          <td className="px-3 py-2 text-right">{fmt(w.page_views, 'int')}</td>
                          <td className="px-3 py-2 text-right">{dv.conversion != null ? fmt(dv.conversion, 'percent') : '—'}</td>
                          <td className="px-3 py-2 text-right">{dv.rps != null ? fmt(dv.rps, 'currency2') : '—'}</td>
                          <td className="px-3 py-2 text-right">{w.buy_box_percentage != null ? fmt(w.buy_box_percentage, 'percent') : '—'}</td>
                          <td className="px-3 py-2 text-right">{dv.tacos != null ? fmt(dv.tacos, 'percent') : '—'}</td>
                          <td className="px-3 py-2 text-right">{dv.acos != null ? fmt(dv.acos, 'percent') : '—'}</td>
                          <td className="px-3 py-2 text-right">{w.bsr ? `#${fmt(w.bsr, 'int')}` : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
