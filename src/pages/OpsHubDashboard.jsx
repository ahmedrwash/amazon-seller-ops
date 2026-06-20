import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Plus, TrendingUp, TrendingDown, Package, PenLine, AlertTriangle, Upload, Target } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const fmt = (n, type = 'number') => {
  if (n === null || n === undefined || isNaN(n)) return '—';
  if (type === 'currency') return `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (type === 'percent') return `${Number(n).toFixed(1)}%`;
  if (type === 'int') return Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
  return Number(n).toLocaleString('en-US', { maximumFractionDigits: 1 });
};

function healthColor(metric, value) {
  if (value === null || value === undefined) return 'text-slate-400';
  if (metric === 'margin') return value >= 25 ? 'text-green-600' : value >= 10 ? 'text-amber-500' : 'text-red-500';
  if (metric === 'acos') return value <= 25 ? 'text-green-600' : value <= 35 ? 'text-amber-500' : 'text-red-500';
  if (metric === 'inventory') return value >= 30 ? 'text-green-600' : value >= 14 ? 'text-amber-500' : 'text-red-500';
  return 'text-[hsl(var(--cinder))]';
}

function StatusDot({ value, metric }) {
  const color = healthColor(metric, value);
  const bg = color.includes('green') ? 'bg-green-500' : color.includes('amber') ? 'bg-amber-400' : color.includes('red') ? 'bg-red-500' : 'bg-slate-300';
  return <span className={`inline-block w-2 h-2 rounded-full ${bg} mr-1.5`} />;
}

export default function OpsHubDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [products, setProducts] = useState([]);
  const [latestData, setLatestData] = useState({});
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ product_name: '', sku: '', asin: '', main_category: '' });
  const [saving, setSaving] = useState(false);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const { data: prods } = await supabase
        .from('products')
        .select('id, product_name, sku, asin, main_category, status, created_at')
        .order('created_at', { ascending: false });

      if (!prods?.length) { setProducts([]); setLoading(false); return; }
      setProducts(prods);

      // Load latest week data for each product
      const latest = {};
      await Promise.all(prods.map(async (p) => {
        const { data } = await supabase
          .from('product_weekly_data')
          .select('week_number, gmv_this_week, units_sold_this_week, ppc_spend_this_week, ppc_revenue_this_week, inventory_at_fba, selling_price, cogs_per_unit, fba_fulfillment_fee, amazon_referral_fee_percent, inbound_freight_per_unit, import_tariff_per_unit, ppc_cost_per_unit, bsr, total_reviews, average_star_rating, updated_at')
          .eq('product_id', p.id)
          .order('week_number', { ascending: false })
          .limit(1)
          .maybeSingle();
        latest[p.id] = data;
      }));
      setLatestData(latest);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDashboard(); }, []);

  const calcMetrics = (d) => {
    if (!d) return {};
    const acos = d.ppc_revenue_this_week > 0 ? (d.ppc_spend_this_week / d.ppc_revenue_this_week) * 100 : null;
    const refFee = d.selling_price * ((d.amazon_referral_fee_percent || 0) / 100);
    const totalCost = (d.cogs_per_unit || 0) + (d.fba_fulfillment_fee || 0) + refFee + (d.inbound_freight_per_unit || 0) + (d.import_tariff_per_unit || 0) + (d.ppc_cost_per_unit || 0);
    const margin = d.selling_price > 0 ? ((d.selling_price - totalCost) / d.selling_price) * 100 : null;
    const daysInventory = d.units_sold_this_week > 0 ? (d.inventory_at_fba / (d.units_sold_this_week / 7)) : null;
    return { acos, margin, daysInventory };
  };

  const handleAddProduct = async () => {
    if (!newProduct.product_name.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('products').insert({
        product_name: newProduct.product_name.trim(),
        sku: newProduct.sku.trim() || null,
        asin: newProduct.asin.trim() || null,
        main_category: newProduct.main_category.trim() || null,
        created_by: user?.id,
        owner_id: user?.id,
        status: 'active',
      });
      if (error) throw error;
      toast({ title: 'Product added' });
      setIsAddOpen(false);
      setNewProduct({ product_name: '', sku: '', asin: '', main_category: '' });
      loadDashboard();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--terracotta))]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--parchment))] pb-12">
      {/* Header */}
      <div className="bg-[hsl(var(--cinder))] text-white px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl">Amazon Operations Hub</h1>
            <p className="text-slate-400 text-sm mt-1">{products.length} product{products.length !== 1 ? 's' : ''} · Daily performance tracking</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/ops-hub/import')} className="border-white/20 text-white hover:bg-white/10 bg-transparent">
              <Upload className="w-4 h-4 mr-2" /> Import Data
            </Button>
            <Button onClick={() => setIsAddOpen(true)} className="bg-[hsl(var(--terracotta))] hover:opacity-90 text-white">
              <Plus className="w-4 h-4 mr-2" /> Add Product
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 mt-6">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-[hsl(var(--border))]">
            <Package className="w-12 h-12 text-slate-300 mb-4" />
            <h2 className="font-heading text-2xl text-[hsl(var(--cinder))] mb-2">No products yet</h2>
            <p className="text-slate-500 mb-6">Add your first Amazon product to start tracking.</p>
            <Button onClick={() => setIsAddOpen(true)} className="bg-[hsl(var(--terracotta))] hover:opacity-90 text-white">
              <Plus className="w-4 h-4 mr-2" /> Add Product
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {products.map(p => {
              const d = latestData[p.id];
              const { acos, margin, daysInventory } = calcMetrics(d);
              const hasData = !!d;

              return (
                <div key={p.id} className="bg-white rounded-2xl border border-[hsl(var(--border))] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {/* Card header */}
                  <div className="bg-[hsl(var(--cinder))] px-5 py-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-heading text-white text-lg leading-tight truncate" title={p.product_name}>{p.product_name}</h3>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          {p.asin && <span className="text-xs font-mono text-slate-400">{p.asin}</span>}
                          {p.sku && <span className="text-xs text-slate-400">SKU: {p.sku}</span>}
                          {p.main_category && <span className="text-xs text-slate-500 bg-white/10 px-2 py-0.5 rounded-full">{p.main_category}</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Metrics */}
                  {hasData ? (
                    <>
                      <div className="grid grid-cols-2 divide-x divide-[hsl(var(--border))]">
                        <div className="p-4">
                          <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">Revenue (Week {d.week_number})</div>
                          <div className="text-2xl font-mono font-semibold text-[hsl(var(--cinder))]">{fmt(d.gmv_this_week, 'currency')}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{fmt(d.units_sold_this_week, 'int')} units sold</div>
                        </div>
                        <div className="p-4">
                          <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">Net Margin</div>
                          <div className={`text-2xl font-mono font-semibold ${healthColor('margin', margin)}`}>{fmt(margin, 'percent')}</div>
                          <div className="text-xs text-slate-400 mt-0.5">on ${fmt(d.selling_price)} sell price</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 border-t border-[hsl(var(--border))]">
                        <div className="p-3 text-center border-r border-[hsl(var(--border))]">
                          <div className="text-xs text-slate-400 mb-1">ACoS</div>
                          <div className={`text-sm font-mono font-semibold ${healthColor('acos', acos)}`}>
                            <StatusDot value={acos} metric="acos" />{fmt(acos, 'percent')}
                          </div>
                        </div>
                        <div className="p-3 text-center border-r border-[hsl(var(--border))]">
                          <div className="text-xs text-slate-400 mb-1">Inv. Days</div>
                          <div className={`text-sm font-mono font-semibold ${healthColor('inventory', daysInventory)}`}>
                            <StatusDot value={daysInventory} metric="inventory" />{daysInventory ? `${fmt(daysInventory, 'int')}d` : '—'}
                          </div>
                        </div>
                        <div className="p-3 text-center">
                          <div className="text-xs text-slate-400 mb-1">BSR</div>
                          <div className="text-sm font-mono font-semibold text-[hsl(var(--cinder))]">
                            {d.bsr ? `#${fmt(d.bsr, 'int')}` : '—'}
                          </div>
                        </div>
                      </div>

                      {/* Reviews row */}
                      {(d.total_reviews || d.average_star_rating) && (
                        <div className="px-4 py-2 border-t border-[hsl(var(--border))] flex items-center gap-4 text-xs text-slate-500">
                          {d.total_reviews && <span>⭐ {fmt(d.total_reviews, 'int')} reviews</span>}
                          {d.average_star_rating && <span>{fmt(d.average_star_rating)} stars</span>}
                          {d.ppc_spend_this_week > 0 && <span>PPC: {fmt(d.ppc_spend_this_week, 'currency')}</span>}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-6 flex flex-col items-center justify-center text-center gap-2">
                      <AlertTriangle className="w-8 h-8 text-amber-400" />
                      <p className="text-sm text-slate-500">No data entered yet</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="border-t border-[hsl(var(--border))] px-4 py-3 grid grid-cols-3 gap-2 bg-slate-50">
                    <Button
                      size="sm"
                      className="bg-[hsl(var(--terracotta))] hover:opacity-90 text-white"
                      onClick={() => navigate(`/ops-hub/entry?product=${p.id}`)}
                    >
                      <PenLine className="w-3.5 h-3.5 mr-1.5" /> Log
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/ops-hub/product/${p.id}`)}
                    >
                      <TrendingUp className="w-3.5 h-3.5 mr-1.5" /> History
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/ops-hub/scorecard/${p.id}`)}
                    >
                      <Target className="w-3.5 h-3.5 mr-1.5" /> KPIs
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Product Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Product Name *</Label>
              <Input placeholder="e.g. Sneaker Cleaning Kit" value={newProduct.product_name} onChange={e => setNewProduct(p => ({ ...p, product_name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>ASIN</Label>
                <Input placeholder="B0XXXXXXXX" value={newProduct.asin} onChange={e => setNewProduct(p => ({ ...p, asin: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>SKU</Label>
                <Input placeholder="FX-001" value={newProduct.sku} onChange={e => setNewProduct(p => ({ ...p, sku: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input placeholder="e.g. Sports & Outdoors" value={newProduct.main_category} onChange={e => setNewProduct(p => ({ ...p, main_category: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAddProduct} disabled={saving || !newProduct.product_name.trim()} className="bg-[hsl(var(--terracotta))] hover:opacity-90 text-white">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
