import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft, Save, ChevronLeft, ChevronRight, Info, Zap } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// Get ISO week number from a date
function getISOWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

function getWeekLabel(weekNum, year) {
  return `Week ${weekNum} · ${year}`;
}

const CURRENT_WEEK = getISOWeek(new Date());
const CURRENT_YEAR = new Date().getFullYear();

const EMPTY = {
  // Sales actuals
  gmv_this_week: '',
  units_sold_this_week: '',
  sessions: '',
  page_views: '',
  buy_box_percentage: '',
  bsr: '',
  total_reviews: '',
  average_star_rating: '',
  primary_keyword_rank: '',
  // PPC
  ppc_spend_this_week: '',
  ppc_revenue_this_week: '',
  clicks: '',
  orders_from_ppc: '',
  // Inventory
  inventory_at_fba: '',
  // Cost inputs (usually stable)
  selling_price: '',
  cogs_per_unit: '',
  fba_fulfillment_fee: '',
  amazon_referral_fee_percent: '',
  inbound_freight_per_unit: '',
  import_tariff_per_unit: '',
  ppc_cost_per_unit: '',
  account_management_fee_monthly: '',
  other_costs_per_unit: '',
};

function Field({ label, name, value, onChange, type = 'number', prefix, suffix, hint, fromApify }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <Label className="text-xs font-medium text-slate-600">{label}</Label>
        {fromApify && value && (
          <span className="flex items-center gap-0.5 text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full leading-none">
            <Zap className="w-2.5 h-2.5" /> Apify
          </span>
        )}
      </div>
      <div className="relative flex items-center">
        {prefix && <span className="absolute left-3 text-slate-400 text-sm pointer-events-none">{prefix}</span>}
        <Input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          step="any"
          min="0"
          className={`font-mono text-sm h-9 ${prefix ? 'pl-7' : ''} ${suffix ? 'pr-10' : ''} ${fromApify && value ? 'border-purple-300 bg-purple-50/30' : ''}`}
          placeholder="0"
        />
        {suffix && <span className="absolute right-3 text-slate-400 text-xs pointer-events-none">{suffix}</span>}
      </div>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function Section({ title, color, children, computed }) {
  return (
    <div className="bg-white rounded-2xl border border-[hsl(var(--border))] overflow-hidden">
      <div className={`px-5 py-3 border-b border-[hsl(var(--border))] flex items-center justify-between ${color}`}>
        <h3 className="font-semibold text-sm">{title}</h3>
        {computed && <div className="flex gap-4">{computed}</div>}
      </div>
      <div className="p-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{children}</div>
    </div>
  );
}

function Computed({ label, value }) {
  return (
    <div className="text-right">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-sm font-mono font-semibold">{value}</div>
    </div>
  );
}

export default function OpsDataEntry() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(searchParams.get('product') || '');
  const [selectedWeek, setSelectedWeek] = useState(parseInt(searchParams.get('week')) || CURRENT_WEEK);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [existingId, setExistingId] = useState(null);
  const [apifyData, setApifyData] = useState(null); // raw apify fields for this week

  // Load products
  useEffect(() => {
    supabase.from('products').select('id, product_name, sku, asin').order('created_at', { ascending: false })
      .then(({ data }) => {
        setProducts(data || []);
        if (!selectedProductId && data?.length) setSelectedProductId(data[0].id);
      });
  }, []);

  // Load existing data when product/week changes
  const loadWeekData = useCallback(async () => {
    if (!selectedProductId) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('product_weekly_data')
        .select('*')
        .eq('product_id', selectedProductId)
        .eq('week_number', selectedWeek)
        .maybeSingle();

      if (data) {
        setExistingId(data.id);
        const filled = {};
        Object.keys(EMPTY).forEach(k => {
          const v = data[k];
          // Treat null, undefined, and 0 as empty (0 means no data entered)
          filled[k] = (v !== null && v !== undefined && v !== 0 && v !== '0') ? String(v) : '';
        });
        setForm(filled);
        // Store apify info if this row was imported from Apify
        if (data.apify_raw) {
          setApifyData({
            fetchedAt: data.apify_fetched_at,
            title: data.apify_raw.title,
            brand: data.apify_raw.brand,
            image: data.apify_raw.thumbnailImage,
            inStock: data.apify_raw.inStock,
            description: data.apify_raw.description,
            apifyFields: ['bsr', 'total_reviews', 'average_star_rating', 'selling_price', 'primary_keyword_rank']
              .filter(f => data[f] !== null && data[f] !== undefined && data[f] !== 0),
          });
        } else {
          setApifyData(null);
        }
      } else {
        setApifyData(null);
        setExistingId(null);
        // Try to pre-fill stable cost inputs from previous week
        const { data: prev } = await supabase
          .from('product_weekly_data')
          .select('selling_price, cogs_per_unit, fba_fulfillment_fee, amazon_referral_fee_percent, inbound_freight_per_unit, import_tariff_per_unit, ppc_cost_per_unit, account_management_fee_monthly, other_costs_per_unit')
          .eq('product_id', selectedProductId)
          .order('week_number', { ascending: false })
          .limit(1)
          .maybeSingle();

        const prefilled = { ...EMPTY };
        if (prev) {
          ['selling_price', 'cogs_per_unit', 'fba_fulfillment_fee', 'amazon_referral_fee_percent',
           'inbound_freight_per_unit', 'import_tariff_per_unit', 'ppc_cost_per_unit',
           'account_management_fee_monthly', 'other_costs_per_unit'].forEach(k => {
            if (prev[k] !== null && prev[k] !== undefined) prefilled[k] = String(prev[k]);
          });
        }
        setForm(prefilled);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedProductId, selectedWeek]);

  useEffect(() => { loadWeekData(); }, [loadWeekData]);

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const parseNum = (v) => {
    const n = parseFloat(v);
    return isNaN(n) ? null : n;
  };

  const handleSave = async () => {
    if (!selectedProductId) return;
    setSaving(true);
    try {
      const payload = {
        product_id: selectedProductId,
        user_id: user?.id,
        week_number: selectedWeek,
        updated_at: new Date().toISOString(),
      };
      Object.keys(EMPTY).forEach(k => {
        payload[k] = parseNum(form[k]);
      });

      const { error } = await supabase
        .from('product_weekly_data')
        .upsert(payload, { onConflict: 'product_id,week_number' });

      if (error) throw error;
      toast({ title: `Week ${selectedWeek} data saved`, description: 'Dashboard updated.' });
      await loadWeekData();
    } catch (err) {
      toast({ title: 'Save failed', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Live calculations
  const sp = parseNum(form.selling_price) || 0;
  const refFee = sp * ((parseNum(form.amazon_referral_fee_percent) || 0) / 100);
  const totalCost = (parseNum(form.cogs_per_unit) || 0) + (parseNum(form.fba_fulfillment_fee) || 0)
    + refFee + (parseNum(form.inbound_freight_per_unit) || 0) + (parseNum(form.import_tariff_per_unit) || 0)
    + (parseNum(form.ppc_cost_per_unit) || 0) + (parseNum(form.other_costs_per_unit) || 0);
  const netProfit = sp - totalCost;
  const margin = sp > 0 ? ((netProfit / sp) * 100).toFixed(1) : '—';

  const ppcSpend = parseNum(form.ppc_spend_this_week) || 0;
  const ppcRev = parseNum(form.ppc_revenue_this_week) || 0;
  const acos = ppcRev > 0 ? ((ppcSpend / ppcRev) * 100).toFixed(1) : '—';

  const units = parseNum(form.units_sold_this_week) || 0;
  const inv = parseNum(form.inventory_at_fba) || 0;
  const daysInv = units > 0 ? Math.round(inv / (units / 7)) : '—';

  const selectedProduct = products.find(p => p.id === selectedProductId);

  return (
    <div className="min-h-screen bg-[hsl(var(--parchment))] pb-16">
      {/* Header */}
      <div className="bg-[hsl(var(--cinder))] text-white px-6 py-4 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/ops-hub')} className="text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-heading text-xl">Log Weekly Data</h1>
              {selectedProduct && <p className="text-slate-400 text-xs mt-0.5">{selectedProduct.product_name}</p>}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Product selector */}
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger className="w-56 bg-white/10 border-white/20 text-white h-9 text-sm">
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {products.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.product_name}{p.sku ? ` (${p.sku})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Week selector */}
            <div className="flex items-center gap-1 bg-white/10 rounded-lg px-2 py-1 border border-white/20">
              <button onClick={() => setSelectedWeek(w => Math.max(1, w - 1))} className="text-slate-400 hover:text-white p-1">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-mono px-2 min-w-[90px] text-center">{getWeekLabel(selectedWeek, CURRENT_YEAR)}</span>
              <button onClick={() => setSelectedWeek(w => Math.min(52, w + 1))} className="text-slate-400 hover:text-white p-1">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Status + Save */}
            <div className="flex items-center gap-2">
              {existingId && <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-1 rounded-full">Saved ✓</span>}
              <Button onClick={handleSave} disabled={saving || !selectedProductId} className="bg-[hsl(var(--terracotta))] hover:opacity-90 text-white h-9">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Week {selectedWeek}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--terracotta))]" />
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-6 md:px-8 mt-8 space-y-6">

          {/* Apify import banner */}
          {apifyData && (
            <div className="bg-white border border-purple-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-purple-600 px-5 py-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-white" />
                <span className="text-sm font-semibold text-white">Imported from Apify</span>
                {apifyData.fetchedAt && (
                  <span className="text-xs text-purple-200 ml-1">{new Date(apifyData.fetchedAt).toLocaleDateString()}</span>
                )}
                <span className={`ml-auto text-xs px-2.5 py-1 rounded-full font-medium ${
                  apifyData.inStock ? 'bg-green-500/30 text-green-100' : 'bg-red-500/30 text-red-200'
                }`}>
                  {apifyData.inStock ? '✓ In Stock' : '✗ Currently Unavailable'}
                </span>
              </div>
              <div className="p-5 flex items-start gap-4">
                {apifyData.image && (
                  <img src={apifyData.image} alt="" className="w-16 h-16 object-contain rounded-xl bg-slate-50 border border-slate-100 p-1 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  {apifyData.title && (
                    <p className="text-sm font-semibold text-[hsl(var(--cinder))] leading-snug mb-1">{apifyData.title}</p>
                  )}
                  {apifyData.brand && (
                    <p className="text-xs text-slate-500 mb-2">Brand: <strong>{apifyData.brand}</strong></p>
                  )}
                  {apifyData.apifyFields.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-xs text-slate-500">Fields from Apify:</span>
                      {apifyData.apifyFields.map(f => (
                        <span key={f} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">{f.replace(/_/g, ' ')}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                      Product is currently unavailable on Amazon — no commercial metrics yet (BSR, price, reviews).
                      Fill the fields below manually from Seller Central, or fetch again once the listing goes live.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Live summary bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Net Margin', value: margin === '—' ? '—' : `${margin}%`, good: parseFloat(margin) >= 25, warn: parseFloat(margin) >= 10 && parseFloat(margin) < 25 },
              { label: 'Net Profit / Unit', value: sp > 0 ? `$${netProfit.toFixed(2)}` : '—', good: netProfit > 0 },
              { label: 'ACoS', value: acos === '—' ? '—' : `${acos}%`, good: parseFloat(acos) <= 25, warn: parseFloat(acos) <= 35 && parseFloat(acos) > 25 },
              { label: 'Inventory Days', value: daysInv === '—' ? '—' : `${daysInv}d`, good: daysInv >= 30, warn: daysInv >= 14 && daysInv < 30 },
            ].map(m => (
              <div key={m.label} className="bg-white rounded-xl border border-[hsl(var(--border))] px-4 py-3">
                <div className="text-xs text-slate-400 uppercase tracking-wide">{m.label}</div>
                <div className={`text-xl font-mono font-semibold mt-1 ${m.good ? 'text-green-600' : m.warn ? 'text-amber-500' : 'text-[hsl(var(--cinder))]'}`}>
                  {m.value}
                </div>
              </div>
            ))}
          </div>

          {/* Sales Section */}
          <Section title="📊 Sales Performance" color="bg-blue-50 text-blue-800">
            <Field label="Revenue / GMV ($)" name="gmv_this_week" value={form.gmv_this_week} onChange={handleChange} prefix="$" hint="Total revenue this week" />
            <Field label="Units Sold" name="units_sold_this_week" value={form.units_sold_this_week} onChange={handleChange} hint="Orders shipped this week" />
            <Field label="Sessions" name="sessions" value={form.sessions} onChange={handleChange} hint="Unique visitor sessions" />
            <Field label="Page Views" name="page_views" value={form.page_views} onChange={handleChange} hint="Total listing page views" />
            <Field label="Buy Box %" name="buy_box_percentage" value={form.buy_box_percentage} onChange={handleChange} suffix="%" hint="Featured Offer win rate" />
            <Field label="BSR (Best Seller Rank)" name="bsr" value={form.bsr} onChange={handleChange} hint="Category rank on Amazon" fromApify={apifyData?.apifyFields.includes('bsr')} />
            <Field label="Total Reviews" name="total_reviews" value={form.total_reviews} onChange={handleChange} fromApify={apifyData?.apifyFields.includes('total_reviews')} />
            <Field label="Avg Star Rating" name="average_star_rating" value={form.average_star_rating} onChange={handleChange} hint="e.g. 4.3" fromApify={apifyData?.apifyFields.includes('average_star_rating')} />
            <Field label="Primary Keyword Rank" name="primary_keyword_rank" value={form.primary_keyword_rank} onChange={handleChange} hint="Search rank for main keyword" fromApify={apifyData?.apifyFields.includes('primary_keyword_rank')} />
          </Section>

          {/* PPC Section */}
          <Section
            title="📢 PPC & Advertising"
            color="bg-amber-50 text-amber-800"
            computed={[
              <Computed key="acos" label="ACoS" value={acos === '—' ? '—' : `${acos}%`} />,
            ]}
          >
            <Field label="PPC Spend ($)" name="ppc_spend_this_week" value={form.ppc_spend_this_week} onChange={handleChange} prefix="$" />
            <Field label="PPC Revenue ($)" name="ppc_revenue_this_week" value={form.ppc_revenue_this_week} onChange={handleChange} prefix="$" hint="Revenue attributed to ads" />
            <Field label="Clicks" name="clicks" value={form.clicks} onChange={handleChange} />
            <Field label="Orders from PPC" name="orders_from_ppc" value={form.orders_from_ppc} onChange={handleChange} />
          </Section>

          {/* Inventory Section */}
          <Section
            title="📦 Inventory"
            color="bg-green-50 text-green-800"
            computed={[
              <Computed key="days" label="Days of Stock" value={daysInv === '—' ? '—' : `${daysInv} days`} />,
            ]}
          >
            <Field label="Units at FBA" name="inventory_at_fba" value={form.inventory_at_fba} onChange={handleChange} hint="Current FBA inventory count" />
          </Section>

          {/* Cost Inputs */}
          <Section
            title="💰 Cost Inputs"
            color="bg-slate-50 text-slate-700"
            computed={[
              <Computed key="margin" label="Net Margin" value={margin === '—' ? '—' : `${margin}%`} />,
              <Computed key="profit" label="Profit/Unit" value={sp > 0 ? `$${netProfit.toFixed(2)}` : '—'} />,
            ]}
          >
            <Field label="Selling Price ($)" name="selling_price" value={form.selling_price} onChange={handleChange} prefix="$" hint="Your Amazon sell price" fromApify={apifyData?.apifyFields.includes('selling_price')} />
            <Field label="COGS / Unit ($)" name="cogs_per_unit" value={form.cogs_per_unit} onChange={handleChange} prefix="$" hint="Factory cost per unit" />
            <Field label="FBA Fulfillment Fee ($)" name="fba_fulfillment_fee" value={form.fba_fulfillment_fee} onChange={handleChange} prefix="$" />
            <Field label="Referral Fee (%)" name="amazon_referral_fee_percent" value={form.amazon_referral_fee_percent} onChange={handleChange} suffix="%" hint="Amazon category %" />
            <Field label="Inbound Freight / Unit ($)" name="inbound_freight_per_unit" value={form.inbound_freight_per_unit} onChange={handleChange} prefix="$" />
            <Field label="Import Tariff / Unit ($)" name="import_tariff_per_unit" value={form.import_tariff_per_unit} onChange={handleChange} prefix="$" />
            <Field label="PPC Cost / Unit ($)" name="ppc_cost_per_unit" value={form.ppc_cost_per_unit} onChange={handleChange} prefix="$" hint="Total PPC ÷ units sold" />
            <Field label="Agency Fee ($/mo)" name="account_management_fee_monthly" value={form.account_management_fee_monthly} onChange={handleChange} prefix="$" hint="Monthly management fee" />
            <Field label="Other Costs / Unit ($)" name="other_costs_per_unit" value={form.other_costs_per_unit} onChange={handleChange} prefix="$" />
          </Section>

          {/* Bottom save */}
          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} disabled={saving || !selectedProductId} size="lg" className="bg-[hsl(var(--terracotta))] hover:opacity-90 text-white px-8">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Week {selectedWeek}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
