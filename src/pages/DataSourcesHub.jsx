import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Database, FileUp, Loader2, RefreshCw, Search, Server, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { createSourceImportJob, loadDataSourcesHub } from '@/services/dataSources';

const SOURCE_META = {
  amazon_reports: { label: 'Amazon Reports', description: 'Sales, traffic, FBA inventory, finance and advertising reports.' },
  helium10: { label: 'Helium 10', description: 'Cerebro, Magnet and market-research exports for keyword and competitor intelligence.' },
  keepa: { label: 'Keepa', description: 'Historical price, BSR, Buy Box and offer intelligence.' },
  supplier_alibaba: { label: 'Supplier / Alibaba', description: 'Quotes, MOQ, packaging, COGS and supplier comparison data.' },
  financial_bank: { label: 'Financial / Bank', description: 'Bank, Wise and accounting exports for cash-flow and reconciliation.' },
};

function StatusPill({ value }) {
  const ok = ['connected', 'available', 'success', 'completed', 'applied'].includes(value);
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${ok ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>{value || 'available'}</span>;
}

export default function DataSourcesHub() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [data, setData] = useState({ sources: [], productMarketplaces: [], imports: [], keywords: [], competitors: [] });
  const [form, setForm] = useState({ sourceId: '', productMarketplaceId: '', importType: 'helium10_cerebro_keywords', file: null });

  const refresh = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const next = await loadDataSourcesHub(user.id);
      setData(next);
      const h10 = next.sources.find(x => x.source_code === 'helium10');
      if (h10 && !form.sourceId) setForm(p => ({ ...p, sourceId: h10.id }));
    } catch (err) {
      toast({ title: 'Could not load Data Sources', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, [user?.id]);

  const selectedSource = useMemo(() => data.sources.find(x => x.id === form.sourceId), [data.sources, form.sourceId]);

  const upload = async () => {
    setUploading(true);
    try {
      await createSourceImportJob({
        userId: user?.id,
        sourceId: form.sourceId,
        productMarketplaceId: form.productMarketplaceId,
        importType: form.importType,
        file: form.file,
      });
      toast({ title: 'Source file uploaded', description: 'The file is stored and queued for the source parser.' });
      setForm(p => ({ ...p, file: null }));
      if (fileRef.current) fileRef.current.value = '';
      await refresh();
    } catch (err) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--terracotta))]" /></div>;

  return (
    <div className="min-h-screen bg-[hsl(var(--parchment))] pb-12">
      <div className="bg-[hsl(var(--cinder))] text-white px-6 py-5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <button onClick={() => navigate('/ops-hub')} className="text-xs text-slate-400 hover:text-white flex items-center gap-1 mb-2"><ArrowLeft className="w-3.5 h-3.5" /> Operations Hub</button>
            <h1 className="font-heading text-3xl">Data Sources Hub</h1>
            <p className="text-slate-400 text-sm mt-1">Amazon actuals + market intelligence + supplier + financial sources</p>
          </div>
          <Button variant="outline" onClick={refresh} className="border-white/20 text-white hover:bg-white/10 bg-transparent"><RefreshCw className="w-4 h-4 mr-2" /> Refresh</Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 mt-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          {data.sources.map(source => {
            const meta = SOURCE_META[source.source_code] || { label: source.source_name, description: source.source_type };
            return (
              <div key={source.id} className="rounded-2xl border border-[hsl(var(--border))] bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[hsl(var(--terracotta))]/10 flex items-center justify-center"><Database className="w-5 h-5 text-[hsl(var(--terracotta))]" /></div>
                  <StatusPill value={source.status} />
                </div>
                <h3 className="font-semibold mt-4 text-[hsl(var(--cinder))]">{meta.label}</h3>
                <p className="text-xs text-slate-500 mt-2 min-h-12">{meta.description}</p>
                <div className="mt-4 text-xs text-slate-400">Mode: {source.connection_mode?.replaceAll('_', ' ')}</div>
                <div className="text-xs text-slate-400 mt-1">Imports: {source.import_count || 0}</div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[0.95fr_2.05fr] gap-6">
          <section className="rounded-2xl border border-[hsl(var(--border))] bg-white p-5 shadow-sm h-fit">
            <div className="flex items-center gap-2 mb-5"><UploadCloud className="w-5 h-5 text-[hsl(var(--terracotta))]" /><div><h2 className="font-heading text-xl">Upload Source Data</h2><p className="text-xs text-slate-400">Helium 10 is the first parser target</p></div></div>
            <div className="space-y-4">
              <div className="space-y-1.5"><Label>Data source</Label><Select value={form.sourceId} onValueChange={v => setForm(p => ({ ...p, sourceId: v }))}><SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger><SelectContent>{data.sources.map(s => <SelectItem key={s.id} value={s.id}>{s.source_name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><Label>Product / marketplace</Label><Select value={form.productMarketplaceId} onValueChange={v => setForm(p => ({ ...p, productMarketplaceId: v }))}><SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger><SelectContent>{data.productMarketplaces.map(pm => <SelectItem key={pm.id} value={pm.id}>{pm.products?.brand ? `${pm.products.brand} · ` : ''}{pm.products?.product_name || pm.asin || pm.sku} · {pm.marketplaces?.code || 'US'}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><Label>Import type</Label><Select value={form.importType} onValueChange={v => setForm(p => ({ ...p, importType: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="helium10_cerebro_keywords">Helium 10 · Cerebro Keywords</SelectItem><SelectItem value="helium10_magnet_keywords">Helium 10 · Magnet Keywords</SelectItem><SelectItem value="helium10_competitors">Helium 10 · Competitor / Market Export</SelectItem><SelectItem value="keepa_history">Keepa · Historical Export</SelectItem><SelectItem value="supplier_quote">Supplier · Quote / Cost Data</SelectItem><SelectItem value="financial_export">Financial · Bank / Wise Export</SelectItem></SelectContent></Select></div>
              <div className="space-y-1.5"><Label>CSV/XLSX file</Label><Input ref={fileRef} type="file" accept=".csv,.xlsx,.xls,text/csv" onChange={e => setForm(p => ({ ...p, file: e.target.files?.[0] || null }))} /></div>
              <Button onClick={upload} disabled={uploading} className="w-full bg-[hsl(var(--terracotta))] text-white hover:opacity-90">{uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileUp className="w-4 h-4 mr-2" />} Upload Source File</Button>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500"><strong className="text-slate-700">Team-assisted mode:</strong> the operating team can export files from Helium 10, Keepa, suppliers or financial systems and upload them here. API automation can be added later without changing the analytics model.</div>
              {selectedSource && <div className="text-xs text-slate-400">Selected: {selectedSource.source_name} · {selectedSource.connection_mode}</div>}
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-white shadow-sm overflow-hidden">
              <div className="p-5 border-b border-[hsl(var(--border))]"><h2 className="font-heading text-xl">Recent Source Imports</h2><p className="text-xs text-slate-400">Files waiting for or completed by a parser</p></div>
              {data.imports.length === 0 ? <div className="p-10 text-center text-slate-400"><Server className="w-10 h-10 mx-auto mb-3 opacity-40" />No external source imports yet.</div> : <div className="divide-y divide-slate-100">{data.imports.map(job => <div key={job.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"><div><div className="font-medium">{job.data_sources?.source_name || job.import_type}</div><div className="text-xs text-slate-400 mt-1">{job.original_file_name} · {job.import_type}</div></div><StatusPill value={job.status} /></div>)}</div>}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-[hsl(var(--border))] bg-white shadow-sm overflow-hidden">
                <div className="p-5 border-b border-[hsl(var(--border))] flex items-center gap-2"><Search className="w-4 h-4 text-[hsl(var(--terracotta))]" /><div><h2 className="font-heading text-lg">Keyword Intelligence</h2><p className="text-xs text-slate-400">Helium 10 keyword snapshots</p></div></div>
                {data.keywords.length === 0 ? <div className="p-8 text-center text-sm text-slate-400">No Helium 10 keyword data yet.</div> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-slate-500"><tr><th className="p-3 text-left">Keyword</th><th className="p-3 text-right">Volume</th><th className="p-3 text-right">Rank</th></tr></thead><tbody>{data.keywords.map(k => <tr key={k.id} className="border-t border-slate-100"><td className="p-3">{k.keyword}</td><td className="p-3 text-right">{k.search_volume ?? '—'}</td><td className="p-3 text-right">{k.organic_rank ?? '—'}</td></tr>)}</tbody></table></div>}
              </div>
              <div className="rounded-2xl border border-[hsl(var(--border))] bg-white shadow-sm overflow-hidden">
                <div className="p-5 border-b border-[hsl(var(--border))]"><h2 className="font-heading text-lg">Competitor Intelligence</h2><p className="text-xs text-slate-400">Market snapshots from research sources</p></div>
                {data.competitors.length === 0 ? <div className="p-8 text-center text-sm text-slate-400">No competitor snapshots yet.</div> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-slate-500"><tr><th className="p-3 text-left">ASIN</th><th className="p-3 text-right">Price</th><th className="p-3 text-right">Reviews</th></tr></thead><tbody>{data.competitors.map(c => <tr key={c.id} className="border-t border-slate-100"><td className="p-3">{c.competitor_asin}</td><td className="p-3 text-right">{c.price ?? '—'}</td><td className="p-3 text-right">{c.review_count ?? '—'}</td></tr>)}</tbody></table></div>}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
