import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import {
  ArrowLeft, Loader2, Target, Pencil, Save, X, CheckCircle2, AlertTriangle, XCircle, Package,
} from 'lucide-react';

const fmt = (n, type = 'number') => {
  if (n === null || n === undefined || isNaN(n)) return '—';
  if (type === 'currency') return `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  if (type === 'percent') return `${Number(n).toFixed(1)}%`;
  if (type === 'int') return Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
  return Number(n).toLocaleString('en-US', { maximumFractionDigits: 1 });
};

const DEFAULT_TARGETS = {
  net_margin_target: 30, tacos_target: 20, acos_target: 25, conversion_target: 12,
  buy_box_target: 95, rating_target: 4.3, reviews_target: 25, monthly_units_target: 300, bsr_target: null,
};

// Compute weekly actuals (mirrors dashboard logic)
function computeActuals(d) {
  if (!d) return {};
  const refFee = (d.selling_price || 0) * ((d.amazon_referral_fee_percent || 0) / 100);
  const totalCost = (d.cogs_per_unit || 0) + (d.fba_fulfillment_fee || 0) + refFee
    + (d.inbound_freight_per_unit || 0) + (d.import_tariff_per_unit || 0) + (d.ppc_cost_per_unit || 0);
  const margin = d.selling_price > 0 ? ((d.selling_price - totalCost) / d.selling_price) * 100 : null;
  const acos = d.ppc_revenue_this_week > 0 ? (d.ppc_spend_this_week / d.ppc_revenue_this_week) * 100 : null;
  const tacos = d.gmv_this_week > 0 ? (d.ppc_spend_this_week / d.gmv_this_week) * 100 : null;
  const conversion = d.sessions > 0 ? (d.units_sold_this_week / d.sessions) * 100 : null;
  return {
    net_margin: margin,
    tacos, acos, conversion,
    buy_box: d.buy_box_percentage ?? null,
    rating: d.average_star_rating ?? null,
    reviews: d.total_reviews ?? null,
    monthly_units: d.units_sold_this_week != null ? d.units_sold_this_week * 4.3 : null, // weekly→monthly est.
    bsr: d.bsr ?? null,
  };
}

// status: compare actual to target. dir 'high' = higher is better, 'low' = lower is better
function statusOf(actual, target, dir) {
  if (actual == null || target == null) return 'none';
  const ratio = dir === 'high' ? actual / target : target / actual;
  if (ratio >= 1) return 'good';
  if (ratio >= 0.8) return 'warn';
  return 'bad';
}

const STATUS_UI = {
  good: { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', bar: 'bg-green-500', Icon: CheckCircle2, label: 'On Target' },
  warn: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', bar: 'bg-amber-400', Icon: AlertTriangle, label: 'Close' },
  bad:  { color: 'text-red-600',   bg: 'bg-red-50',   border: 'border-red-200',   bar: 'bg-red-500',   Icon: XCircle,       label: 'Off Target' },
  none: { color: 'text-slate-400', bg: 'bg-slate-50', border: 'border-slate-200', bar: 'bg-slate-300', Icon: Minus_,        label: 'No Data' },
};
function Minus_(props) { return <span {...props}>—</span>; }

export default function OpsHubScorecard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [product, setProduct] = useState(null);
  const [latest, setLatest] = useState(null);
  const [targets, setTargets] = useState(DEFAULT_TARGETS);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(DEFAULT_TARGETS);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [{ data: prod }, { data: wk }, { data: tgt }] = await Promise.all([
        supabase.from('products').select('id, product_name, sku, asin').eq('id', id).maybeSingle(),
        supabase.from('product_weekly_data')
          .select('year, week_number, period_start, period_end, gmv_this_week, units_sold_this_week, sessions, buy_box_percentage, ppc_spend_this_week, ppc_revenue_this_week, bsr, total_reviews, average_star_rating, selling_price, cogs_per_unit, fba_fulfillment_fee, amazon_referral_fee_percent, inbound_freight_per_unit, import_tariff_per_unit, ppc_cost_per_unit')
          .eq('product_id', id).order('year', { ascending: false }).order('week_number', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('kpi_targets').select('*').eq('product_id', id).maybeSingle(),
      ]);
      setProduct(prod);
      setLatest(wk);
      const t = tgt ? { ...DEFAULT_TARGETS, ...tgt } : DEFAULT_TARGETS;
      setTargets(t);
      setDraft(t);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const actuals = useMemo(() => computeActuals(latest), [latest]);

  const saveTargets = async () => {
    setSaving(true);
    try {
      const payload = {
        product_id: id,
        user_id: user?.id,
        net_margin_target: Number(draft.net_margin_target) || null,
        tacos_target: Number(draft.tacos_target) || null,
        acos_target: Number(draft.acos_target) || null,
        conversion_target: Number(draft.conversion_target) || null,
        buy_box_target: Number(draft.buy_box_target) || null,
        rating_target: Number(draft.rating_target) || null,
        reviews_target: parseInt(draft.reviews_target) || null,
        monthly_units_target: parseInt(draft.monthly_units_target) || null,
        bsr_target: draft.bsr_target ? parseInt(draft.bsr_target) : null,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('kpi_targets').upsert(payload, { onConflict: 'product_id' });
      if (error) throw error;
      setTargets({ ...DEFAULT_TARGETS, ...payload });
      setEditing(false);
      toast({ title: 'Targets saved' });
    } catch (err) {
      toast({ title: 'Save failed', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // KPI row definitions
  const rows = [
    { key: 'net_margin', label: 'Net Margin', tgtKey: 'net_margin_target', dir: 'high', type: 'percent', hint: 'Target 25–35%' },
    { key: 'tacos', label: 'TACoS', tgtKey: 'tacos_target', dir: 'low', type: 'percent', hint: 'Total ad spend ÷ revenue' },
    { key: 'acos', label: 'ACoS', tgtKey: 'acos_target', dir: 'low', type: 'percent', hint: 'Ad spend ÷ ad revenue' },
    { key: 'conversion', label: 'Conversion Rate', tgtKey: 'conversion_target', dir: 'high', type: 'percent', hint: 'Units ÷ sessions' },
    { key: 'buy_box', label: 'Buy Box %', tgtKey: 'buy_box_target', dir: 'high', type: 'percent', hint: 'Featured offer win rate' },
    { key: 'rating', label: 'Avg Rating', tgtKey: 'rating_target', dir: 'high', type: 'number', hint: 'Star rating (0–5)' },
    { key: 'reviews', label: 'Total Reviews', tgtKey: 'reviews_target', dir: 'high', type: 'int', hint: 'Cumulative reviews' },
    { key: 'monthly_units', label: 'Monthly Units (est.)', tgtKey: 'monthly_units_target', dir: 'high', type: 'int', hint: 'Weekly × 4.3' },
    { key: 'bsr', label: 'BSR', tgtKey: 'bsr_target', dir: 'low', type: 'int', hint: 'Category rank (lower better)' },
  ];

  const scored = rows.map(r => {
    const actual = actuals[r.key];
    const target = targets[r.tgtKey];
    const status = statusOf(actual, target, r.dir);
    let pct = 0;
    if (actual != null && target != null && target !== 0) {
      pct = r.dir === 'high' ? (actual / target) * 100 : (target / actual) * 100;
      pct = Math.max(0, Math.min(100, pct));
    }
    return { ...r, actual, target, status, pct };
  });

  const counted = scored.filter(s => s.status !== 'none');
  const healthScore = counted.length
    ? Math.round(counted.reduce((sum, s) => sum + (s.status === 'good' ? 100 : s.status === 'warn' ? 60 : 20), 0) / counted.length)
    : null;
  const healthUI = healthScore == null ? STATUS_UI.none
    : healthScore >= 80 ? STATUS_UI.good : healthScore >= 55 ? STATUS_UI.warn : STATUS_UI.bad;

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--terracotta))]" /></div>;
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

  const editField = (key, label, step = '1', suffix = '') => (
    <div className="space-y-1">
      <Label className="text-xs text-slate-500">{label}</Label>
      <div className="relative">
        <Input type="number" step={step} value={draft[key] ?? ''} onChange={e => setDraft(d => ({ ...d, [key]: e.target.value }))} className="h-9 font-mono text-sm pr-8" />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">{suffix}</span>}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[hsl(var(--parchment))] pb-16">
      {/* Header */}
      <div className="bg-[hsl(var(--cinder))] text-white px-6 py-5 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <button onClick={() => navigate('/ops-hub')} className="text-slate-400 hover:text-white transition-colors flex-shrink-0"><ArrowLeft className="w-5 h-5" /></button>
            <div className="min-w-0">
              <h1 className="font-heading text-2xl truncate flex items-center gap-2"><Target className="w-5 h-5 text-[hsl(var(--terracotta))]" /> KPI Scorecard</h1>
              <p className="text-slate-400 text-sm mt-0.5 truncate">{product.product_name}{latest ? ` · Week ${latest.week_number}` : ' · no data yet'}</p>
            </div>
          </div>
          {!editing ? (
            <Button onClick={() => { setDraft(targets); setEditing(true); }} variant="outline" className="border-white/20 text-white hover:bg-white/10 bg-transparent h-9 flex-shrink-0">
              <Pencil className="w-4 h-4 mr-2" /> Edit Targets
            </Button>
          ) : (
            <div className="flex gap-2 flex-shrink-0">
              <Button onClick={() => setEditing(false)} variant="outline" className="border-white/20 text-white hover:bg-white/10 bg-transparent h-9"><X className="w-4 h-4" /></Button>
              <Button onClick={saveTargets} disabled={saving} className="bg-[hsl(var(--terracotta))] hover:opacity-90 text-white h-9">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 md:px-8 mt-8 space-y-6">

        {/* Overall health */}
        <div className={`rounded-2xl border ${healthUI.border} ${healthUI.bg} p-5 flex items-center gap-5`}>
          <div className={`w-20 h-20 rounded-full border-4 ${healthUI.border} bg-white flex items-center justify-center flex-shrink-0`}>
            <span className={`text-2xl font-mono font-bold ${healthUI.color}`}>{healthScore != null ? healthScore : '—'}</span>
          </div>
          <div>
            <p className={`font-heading text-xl ${healthUI.color}`}>
              {healthScore == null ? 'Awaiting data' : healthScore >= 80 ? 'Healthy' : healthScore >= 55 ? 'Needs attention' : 'At risk'}
            </p>
            <p className="text-sm text-slate-600 mt-0.5">
              {counted.length ? `${counted.filter(s => s.status === 'good').length} of ${counted.length} KPIs on target` : 'Import or log a week to compute the scorecard.'}
            </p>
          </div>
        </div>

        {/* Edit panel */}
        {editing && (
          <div className="bg-white border border-[hsl(var(--border))] rounded-2xl p-5">
            <p className="text-sm font-semibold text-slate-700 mb-4">Set Targets</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {editField('net_margin_target', 'Net Margin', '1', '%')}
              {editField('tacos_target', 'TACoS', '1', '%')}
              {editField('acos_target', 'ACoS', '1', '%')}
              {editField('conversion_target', 'Conversion Rate', '0.5', '%')}
              {editField('buy_box_target', 'Buy Box', '1', '%')}
              {editField('rating_target', 'Avg Rating', '0.1', '★')}
              {editField('reviews_target', 'Total Reviews', '1')}
              {editField('monthly_units_target', 'Monthly Units', '10')}
              {editField('bsr_target', 'BSR Target', '100', '#')}
            </div>
          </div>
        )}

        {/* KPI rows */}
        <div className="space-y-3">
          {scored.map(s => {
            const ui = STATUS_UI[s.status];
            const fmtVal = (v) => v == null ? '—' : s.type === 'percent' ? fmt(v, 'percent') : s.type === 'int' ? (s.key === 'bsr' ? `#${fmt(v, 'int')}` : fmt(v, 'int')) : fmt(v, 'number');
            return (
              <div key={s.key} className={`bg-white border ${ui.border} rounded-xl p-4`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <ui.Icon className={`w-4 h-4 ${ui.color} flex-shrink-0`} />
                      <span className="font-medium text-[hsl(var(--cinder))]">{s.label}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${ui.bg} ${ui.color}`}>{ui.label}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 ml-6">{s.hint}</p>
                  </div>
                  <div className="flex items-center gap-6 flex-shrink-0 text-right">
                    <div>
                      <div className="text-xs text-slate-400">Actual</div>
                      <div className={`text-lg font-mono font-semibold ${ui.color}`}>{fmtVal(s.actual)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Target</div>
                      <div className="text-lg font-mono font-semibold text-slate-500">{fmtVal(s.target)}</div>
                    </div>
                  </div>
                </div>
                {/* progress bar */}
                <div className="mt-3 ml-6">
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${ui.bar} transition-all`} style={{ width: `${s.pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-slate-400 text-center">
          Actuals computed from the latest tracked week. Margin uses your cost inputs; TACoS/ACoS/Conversion use weekly sales & traffic.
        </p>
      </div>
    </div>
  );
}
