import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { getIntegrationSettings, saveIntegrationSettings, saveScrapeSnapshot } from '@/lib/integrations';
import { amazonWeek, weekOptions as buildWeekOptions, parseWeekValue, formatRange } from '@/lib/weeks';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import {
  ArrowLeft, Upload, RefreshCw, CheckCircle2, XCircle,
  FileSpreadsheet, Zap, AlertTriangle, Loader2, Info, Eye, EyeOff, Plus
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  // Auto-detect delimiter: tab if first line has tabs, else comma
  const delim = lines[0].includes('\t') ? '\t' : ',';
  const splitLine = (line) => {
    if (delim === '\t') return line.split('\t').map(v => v.trim().replace(/^"|"$/g, ''));
    // CSV comma split respecting quoted fields
    const result = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQ = !inQ; }
      else if (ch === ',' && !inQ) { result.push(cur.trim()); cur = ''; }
      else { cur += ch; }
    }
    result.push(cur.trim());
    return result;
  };
  const headers = splitLine(lines[0]);
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const vals = splitLine(line);
    const row = {};
    headers.forEach((h, i) => { row[h] = vals[i] || ''; });
    return row;
  });
}

function parseMoney(s) {
  if (!s) return null;
  const n = parseFloat(String(s).replace(/[$,\s]/g, ''));
  return isNaN(n) ? null : n;
}

function parseInt2(s) {
  if (!s) return null;
  const n = parseInt(String(s).replace(/[,\s]/g, ''), 10);
  return isNaN(n) ? null : n;
}

function parseFloat2(s) {
  if (!s) return null;
  const n = parseFloat(String(s).replace(/[,%\s]/g, ''));
  return isNaN(n) ? null : n;
}

// ─── Amazon report field mappings ────────────────────────────────────────────
// Business Report (Sales & Traffic by ASIN or daily)
const BUSINESS_REPORT_MAP = {
  units_sold_this_week:  ['Units Ordered'],
  gmv_this_week:         ['Ordered Product Sales'],
  sessions:              ['Sessions - Total', 'Sessions'],
  page_views:            ['Page Views - Total', 'Page Views'],
  buy_box_percentage:    ['Featured Offer (Buy Box) Percentage'],
};

const ADVERTISING_REPORT_MAP = {
  ppc_spend_this_week:  ['Spend', 'Cost', 'Total Spend'],
  ppc_revenue_this_week:['Sales', '7 Day Total Sales', '14 Day Total Sales', 'Attributed Sales 7d'],
  clicks:               ['Clicks'],
  orders_from_ppc:      ['Orders', '7 Day Total Orders', '14 Day Total Orders', 'Attributed Conversions 7d'],
};

// Which fields should be summed (additive) vs last-value
const ADDITIVE_FIELDS = new Set([
  'units_sold_this_week','gmv_this_week','sessions','page_views',
  'ppc_spend_this_week','ppc_revenue_this_week','clicks','orders_from_ppc',
]);

function findCol(row, aliases) {
  for (const alias of aliases) {
    if (row[alias] !== undefined && row[alias] !== '') return row[alias];
  }
  return null;
}

// Detect report subtype from headers
function detectReportSubtype(rows) {
  if (!rows.length) return 'unknown';
  const keys = Object.keys(rows[0]);
  if (keys.includes('Date') || keys.includes('date')) return 'daily';
  if (keys.some(k => k.includes('ASIN') || k.includes('asin'))) return 'asin';
  return 'daily';
}

// Extract ASIN from an ASIN-level row
function extractAsin(row) {
  return row['(Child) ASIN'] || row['(Parent) ASIN'] || row['ASIN'] || null;
}

// ─── CSV Import Tab ───────────────────────────────────────────────────────────
const FIELD_LABELS = {
  units_sold_this_week: 'Units Sold',
  gmv_this_week: 'Revenue ($)',
  sessions: 'Sessions',
  page_views: 'Page Views',
  buy_box_percentage: 'Buy Box %',
  ppc_spend_this_week: 'PPC Spend ($)',
  ppc_revenue_this_week: 'PPC Revenue ($)',
  clicks: 'Clicks',
  orders_from_ppc: 'PPC Orders',
};

function CSVImportTab({ products }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileRef = useRef();
  const [reportType, setReportType] = useState('business');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('');
  const [rows, setRows] = useState([]);
  const [subtype, setSubtype] = useState(''); // 'asin' | 'daily'
  const [mapped, setMapped] = useState(null); // aggregated mapped result
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [fileName, setFileName] = useState('');

  const weekOptions = buildWeekOptions(12);

  const buildMapped = (data, rType) => {
    const map = rType === 'business' ? BUSINESS_REPORT_MAP : ADVERTISING_REPORT_MAP;
    const sub = detectReportSubtype(data);
    setSubtype(sub);

    // For ASIN reports: each row is a product — we only import the matching ASIN row
    // For daily reports: sum all rows
    const rowsToAggregate = sub === 'asin'
      ? data.filter(r => {
          const asin = extractAsin(r);
          return asin && products.some(p => p.asin === asin);
        })
      : data;

    if (!rowsToAggregate.length && sub === 'asin') {
      // No matching ASIN found — fall back to all rows (manual product selection still applies)
    }

    // Try to auto-detect product from ASIN column
    if (sub === 'asin' && !selectedProductId) {
      for (const row of data) {
        const asin = extractAsin(row);
        if (asin) {
          const match = products.find(p => p.asin === asin);
          if (match) { setSelectedProductId(match.id); break; }
        }
      }
    }

    // Try to auto-detect week from Date column in daily reports
    if (sub === 'daily' && !selectedWeek && data.length) {
      const lastRow = data[data.length - 1];
      const dateStr = lastRow['Date'] || lastRow['date'];
      if (dateStr) {
        const d = new Date(dateStr);
        if (!isNaN(d)) setSelectedWeek(amazonWeek(d).value);
      }
    }

    const src = sub === 'asin' && rowsToAggregate.length ? rowsToAggregate : data;
    const agg = {};
    src.forEach(row => {
      Object.entries(map).forEach(([field, aliases]) => {
        const raw = findCol(row, aliases);
        if (raw == null || raw === '') return;
        const isMoney = ['gmv_this_week','ppc_spend_this_week','ppc_revenue_this_week'].includes(field);
        const isPct = ['buy_box_percentage'].includes(field);
        const num = isMoney ? parseMoney(raw) : isPct ? parseFloat2(raw) : parseInt2(raw);
        if (num == null) return;
        if (ADDITIVE_FIELDS.has(field)) agg[field] = (agg[field] || 0) + num;
        else agg[field] = num; // last-value
      });
    });

    // buy_box_percentage: average across rows (not sum)
    if (src.length && agg.buy_box_percentage !== undefined) {
      let total = 0, count = 0;
      src.forEach(row => {
        const raw = findCol(row, BUSINESS_REPORT_MAP.buy_box_percentage);
        const n = parseFloat2(raw);
        if (n != null) { total += n; count++; }
      });
      if (count) agg.buy_box_percentage = parseFloat((total / count).toFixed(2));
    }

    setMapped(Object.keys(agg).length ? agg : null);
    return agg;
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    setMapped(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = parseCSV(ev.target.result);
      setRows(parsed);
      buildMapped(parsed, reportType);
    };
    reader.readAsText(file);
  };

  useEffect(() => { if (rows.length) buildMapped(rows, reportType); }, [reportType, products]);

  const handleImport = async () => {
    if (!selectedProductId || !selectedWeek) {
      toast({ title: 'Select a product and week first', variant: 'destructive' }); return;
    }
    if (!mapped || !Object.keys(mapped).length) {
      toast({ title: 'No data to import — check the file', variant: 'destructive' }); return;
    }
    const wkInfo = parseWeekValue(selectedWeek);
    if (!wkInfo) { toast({ title: 'Invalid week', variant: 'destructive' }); return; }
    const { year: yr, week: wk, period_start, period_end } = wkInfo;
    setImporting(true);
    setResult(null);
    try {
      const payload = {
        product_id: selectedProductId,
        user_id: user?.id,
        year: yr,
        week_number: wk,
        period_start,
        period_end,
        updated_at: new Date().toISOString(),
        ...mapped,
      };
      const { error } = await supabase.from('product_weekly_data')
        .upsert(payload, { onConflict: 'product_id,year,week_number' });
      if (error) throw error;
      const fields = Object.keys(mapped).length;
      setResult({ ok: true, fields, rows: rows.length, week: wk });
      toast({ title: `Saved to Week ${wk} — ${fields} fields updated` });
      setTimeout(() => navigate(`/ops-hub/entry?product=${selectedProductId}&week=${wk}&year=${yr}`), 800);
    } catch (err) {
      setResult({ ok: false, error: err.message });
      toast({ title: 'Import failed', description: err.message, variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  };

  // ── Daily Business Report → per-day rows + weekly rollup ─────────────────────
  const parseRowDate = (s) => {
    if (!s) return null;
    const d = new Date(s);
    if (isNaN(d)) return null;
    d.setHours(0, 0, 0, 0);
    return d;
  };
  const isoDate = (d) => {
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  };

  const isDaily = reportType === 'business' && subtype === 'daily';

  // Parsed day rows (used for preview count + import)
  const dailyParsed = isDaily ? rows.map(r => {
    const d = parseRowDate(r['Date'] || r['date']);
    if (!d) return null;
    return {
      dateObj: d,
      row: {
        date: isoDate(d),
        ordered_product_sales: parseMoney(findCol(r, ['Ordered Product Sales'])),
        units_ordered: parseInt2(findCol(r, ['Units Ordered'])),
        total_order_items: parseInt2(findCol(r, ['Total Order Items'])),
        sessions: parseInt2(findCol(r, ['Sessions - Total', 'Sessions'])),
        page_views: parseInt2(findCol(r, ['Page Views - Total', 'Page Views'])),
        buy_box_percentage: parseFloat2(findCol(r, ['Featured Offer (Buy Box) Percentage'])),
        unit_session_percentage: parseFloat2(findCol(r, ['Unit Session Percentage'])),
        units_refunded: parseInt2(findCol(r, ['Units Refunded'])),
        refund_rate: parseFloat2(findCol(r, ['Refund Rate'])),
      },
    };
  }).filter(Boolean) : [];

  const dailyRange = dailyParsed.length
    ? `${dailyParsed[0].row.date} → ${dailyParsed[dailyParsed.length - 1].row.date}`
    : '';

  const handleImportDaily = async () => {
    if (!selectedProductId) { toast({ title: 'Select a product first', variant: 'destructive' }); return; }
    if (!dailyParsed.length) { toast({ title: 'No dated rows found in the file', variant: 'destructive' }); return; }
    setImporting(true);
    setResult(null);
    try {
      const now = new Date().toISOString();
      // 1) Per-day rows
      const dailyPayloads = dailyParsed.map(({ row }) => ({
        product_id: selectedProductId,
        user_id: user?.id,
        updated_at: now,
        ...row,
      }));
      const { error: dErr } = await supabase.from('product_daily_data')
        .upsert(dailyPayloads, { onConflict: 'product_id,date' });
      if (dErr) throw dErr;

      // 2) Roll up into weekly aggregates (Amazon Sun–Sat weeks)
      const weeks = {};
      dailyParsed.forEach(({ dateObj, row }) => {
        const wk = amazonWeek(dateObj);
        const w = weeks[wk.value] || (weeks[wk.value] = { wk, sales: 0, units: 0, sessions: 0, pageviews: 0, bbSum: 0, bbCount: 0 });
        w.sales += row.ordered_product_sales || 0;
        w.units += row.units_ordered || 0;
        w.sessions += row.sessions || 0;
        w.pageviews += row.page_views || 0;
        if (row.buy_box_percentage != null) { w.bbSum += row.buy_box_percentage; w.bbCount++; }
      });
      const weeklyPayloads = Object.values(weeks).map(w => ({
        product_id: selectedProductId,
        user_id: user?.id,
        year: w.wk.year,
        week_number: w.wk.week,
        period_start: w.wk.period_start,
        period_end: w.wk.period_end,
        gmv_this_week: +w.sales.toFixed(2),
        units_sold_this_week: w.units,
        sessions: w.sessions,
        page_views: w.pageviews,
        buy_box_percentage: w.bbCount ? +(w.bbSum / w.bbCount).toFixed(2) : null,
        updated_at: now,
      }));
      if (weeklyPayloads.length) {
        const { error: wErr } = await supabase.from('product_weekly_data')
          .upsert(weeklyPayloads, { onConflict: 'product_id,year,week_number' });
        if (wErr) throw wErr;
      }

      setResult({ ok: true, mode: 'daily', daily: dailyPayloads.length, weeks: weeklyPayloads.length });
      toast({ title: `Imported ${dailyPayloads.length} days · ${weeklyPayloads.length} week(s) rolled up` });
      setTimeout(() => navigate(`/ops-hub/product/${selectedProductId}`), 900);
    } catch (err) {
      setResult({ ok: false, error: err.message });
      toast({ title: 'Import failed', description: err.message, variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  };

  const subtypeLabel = subtype === 'asin' ? 'By ASIN (period totals)' : subtype === 'daily' ? `Daily — ${dailyParsed.length} days saved individually` : '';

  return (
    <div className="space-y-6">

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <p className="font-semibold mb-1">How to export from Amazon Seller Central</p>
        <ol className="list-decimal ml-4 space-y-1 text-blue-700 text-xs">
          <li><strong>Business Report</strong> — Reports → Business Reports → By ASIN → set date range → Download</li>
          <li><strong>Advertising Report</strong> — Advertising → Campaign Manager → Reports → Sponsored Products → Download</li>
        </ol>
        <p className="text-xs text-blue-600 mt-2">Accepts .csv, .tsv, or .txt (Amazon exports both comma and tab separated).</p>
      </div>

      {/* Report type + week selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Report Type</Label>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="business">Business Report (Sales &amp; Traffic)</SelectItem>
              <SelectItem value="advertising">Advertising Report (PPC)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          {isDaily ? (
            <>
              <Label>Date Range <span className="text-slate-400 font-normal text-xs">(each day saved individually)</span></Label>
              <div className="h-9 flex items-center px-3 rounded-md border border-[hsl(var(--border))] bg-slate-50 text-sm text-slate-600 font-mono">
                {dailyRange || 'No dated rows found'}
              </div>
            </>
          ) : (
            <>
              <Label>Target Week <span className="text-slate-400 font-normal text-xs">(auto-detected from daily reports)</span></Label>
              <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                <SelectTrigger><SelectValue placeholder="Select week" /></SelectTrigger>
                <SelectContent>
                  {weekOptions.map(w => <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </>
          )}
        </div>
      </div>

      {/* File drop zone */}
      <div
        className="border-2 border-dashed border-[hsl(var(--border))] rounded-xl p-10 text-center cursor-pointer hover:border-[hsl(var(--terracotta))] hover:bg-orange-50/30 transition-colors"
        onClick={() => fileRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) { fileRef.current.files = e.dataTransfer.files; handleFile({ target: { files: [f] } }); } }}
      >
        <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        {fileName ? (
          <div>
            <p className="text-sm font-semibold text-[hsl(var(--cinder))]">{fileName}</p>
            {subtypeLabel && <p className="text-xs text-slate-500 mt-1">{subtypeLabel} · {rows.length} rows</p>}
          </div>
        ) : (
          <>
            <p className="text-sm font-medium text-slate-600">Click or drag to upload Amazon report</p>
            <p className="text-xs text-slate-400 mt-1">.csv · .tsv · .txt</p>
          </>
        )}
        <input ref={fileRef} type="file" accept=".txt,.tsv,.csv" className="hidden" onChange={handleFile} />
      </div>

      {/* Mapped preview */}
      {mapped && Object.keys(mapped).length > 0 && (
        <div className="rounded-xl border border-[hsl(var(--border))] overflow-hidden">
          <div className="bg-slate-50 border-b border-[hsl(var(--border))] px-4 py-2.5 flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Mapped Fields — Ready to Save</p>
            <span className="text-xs text-slate-400">{Object.keys(mapped).length} fields detected</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4">
            {Object.entries(mapped).map(([field, val]) => (
              <div key={field} className="bg-white border border-[hsl(var(--border))] rounded-lg px-3 py-2.5 flex flex-col">
                <span className="text-xs text-slate-400 mb-0.5">{FIELD_LABELS[field] || field}</span>
                <span className="text-sm font-semibold font-mono text-[hsl(var(--cinder))]">
                  {['gmv_this_week','ppc_spend_this_week','ppc_revenue_this_week'].includes(field)
                    ? `$${Number(val).toFixed(2)}`
                    : field === 'buy_box_percentage'
                    ? `${val}%`
                    : Number(val).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {mapped && !Object.keys(mapped).length && rows.length > 0 && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex gap-3 text-sm text-amber-800">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>No fields could be mapped. Make sure you selected the correct report type, or check that the file has expected column names.</p>
        </div>
      )}

      {/* Product selector — shown after file load */}
      {rows.length > 0 && (
        <div className="space-y-1.5">
          <Label>Product <span className="text-slate-400 font-normal text-xs">(auto-matched by ASIN if found)</span></Label>
          <Select value={selectedProductId} onValueChange={setSelectedProductId}>
            <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
            <SelectContent>
              {products.map(p => <SelectItem key={p.id} value={p.id}>{p.product_name}{p.asin ? ` · ${p.asin}` : ''}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Result banner */}
      {result && (
        <div className={`rounded-xl p-4 flex items-start gap-3 ${result.ok ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          {result.ok
            ? <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
            : <XCircle className="w-5 h-5 text-red-500 mt-0.5" />}
          <div className="text-sm">
            {result.ok
              ? (result.mode === 'daily'
                  ? <><p className="font-semibold text-green-700">Imported {result.daily} days — opening daily breakdown…</p><p className="text-green-600">{result.weeks} week(s) rolled up into the weekly report</p></>
                  : <><p className="font-semibold text-green-700">Import successful — redirecting to Week {result.week}…</p><p className="text-green-600">{result.rows} rows processed · {result.fields} fields saved</p></>)
              : <><p className="font-semibold text-red-700">Import failed</p><p className="text-red-600 font-mono text-xs">{result.error}</p></>}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          onClick={isDaily ? handleImportDaily : handleImport}
          disabled={isDaily
            ? (importing || !selectedProductId || !dailyParsed.length)
            : (importing || !rows.length || !selectedProductId || !selectedWeek || !mapped || !Object.keys(mapped).length)}
          className="bg-[hsl(var(--terracotta))] hover:opacity-90 text-white px-8"
        >
          {importing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
          {isDaily ? `Import ${dailyParsed.length} Days` : 'Save to Dashboard'}
        </Button>
      </div>
    </div>
  );
}

// ─── Apify Tab ────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'apify_product_configs';

function ApifyTab({ products, setProducts }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('apify_api_key') || '');
  const [actorId, setActorId] = useState(() => localStorage.getItem('apify_actor_id') || '');
  const [savingKey, setSavingKey] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [targetWeek, setTargetWeek] = useState('');
  const [fetchingId, setFetchingId] = useState(null); // product id currently being fetched
  const [fetchingAll, setFetchingAll] = useState(false);

  // Load credentials from the DB (integration_settings) on mount; localStorage seeds instantly.
  useEffect(() => {
    getIntegrationSettings(['apify_api_key', 'apify_actor_id']).then(s => {
      if (s.apify_api_key != null) setApiKey(s.apify_api_key);
      if (s.apify_actor_id != null) setActorId(s.apify_actor_id);
    });
  }, []);

  // Multi-product config: [{ productId, asin, keyword, status, result }]
  const [configs, setConfigs] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
  });

  const saveConfigs = (updated) => {
    setConfigs(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  // Sync configs when products list loads. The DB (products.asin /
  // products.primary_keyword) is the source of truth so saved values persist
  // across reloads and devices; transient status/result is preserved from state.
  useEffect(() => {
    if (!products.length) return;
    setConfigs(prev => {
      const byId = new Map(prev.map(c => [c.productId, c]));
      const productRows = products.map(p => {
        const ex = byId.get(p.id);
        return {
          productId: p.id,
          asin: p.asin || '',
          keyword: p.primary_keyword || '',
          status: ex?.status || 'idle',
          result: ex?.result || null,
          raw: ex?.raw,
        };
      });
      // Keep user-added rows not yet assigned to a real product.
      const newRows = prev.filter(c => !products.some(p => p.id === c.productId));
      const updated = [...productRows, ...newRows];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, [products]);

  const updateConfig = (productId, field, value) => {
    saveConfigs(configs.map(c => c.productId === productId ? { ...c, [field]: value, status: 'idle', result: null } : c));
  };

  // Persist ASIN + keyword to the product row so they survive reloads/devices.
  const persistConfig = async (cfg) => {
    if (!cfg || !products.some(p => p.id === cfg.productId)) return; // only real products
    const nextAsin = (cfg.asin || '').trim() || null;
    const nextKeyword = (cfg.keyword || '').trim() || null;
    const product = products.find(p => p.id === cfg.productId);
    if (product && (product.asin || null) === nextAsin && (product.primary_keyword || null) === nextKeyword) return; // no change
    try {
      const { error } = await supabase.from('products')
        .update({ asin: nextAsin, primary_keyword: nextKeyword })
        .eq('id', cfg.productId);
      if (error) throw error;
      setProducts(prev => prev.map(p => p.id === cfg.productId ? { ...p, asin: nextAsin, primary_keyword: nextKeyword } : p));
      toast({ title: 'Saved', description: `${product?.product_name || 'Product'} · ASIN & keyword` });
    } catch (err) {
      toast({ title: 'Save failed', description: err.message, variant: 'destructive' });
    }
  };

  const removeConfig = (productId) => {
    saveConfigs(configs.filter(c => c.productId !== productId));
  };

  const weekOptions = buildWeekOptions(12);

  const saveKey = async () => {
    setSavingKey(true);
    try {
      await saveIntegrationSettings({
        apify_api_key: { value: apiKey, description: 'Apify personal API token' },
        apify_actor_id: { value: actorId, description: 'Apify Amazon crawler actor ID' },
      });
      toast({ title: 'Settings saved to database' });
    } catch (err) {
      // localStorage cache already updated by helper; surface DB failure
      toast({ title: 'Saved locally — DB sync failed', description: err.message, variant: 'destructive' });
    } finally {
      setSavingKey(false);
    }
  };

  // Exact field mapper based on confirmed junglee~Amazon-crawler output schema
  const mapRawToSchema = (item) => {
    const toNum = (v) => {
      if (v == null || v === '') return null;
      if (typeof v === 'number' && isFinite(v) && v > 0) return v;
      const n = parseFloat(String(v).replace(/[^0-9.]/g, ''));
      return (isFinite(n) && n > 0) ? n : null;
    };
    const toInt = (v) => {
      if (v == null || v === '') return null;
      if (typeof v === 'number' && isFinite(v) && v > 0) return Math.round(v);
      const n = parseInt(String(v).replace(/[^0-9]/g, ''), 10);
      return (isFinite(n) && n > 0) ? n : null;
    };
    const toStars = (v) => {
      if (v == null || v === '') return null;
      if (typeof v === 'number' && v > 0 && v <= 5) return v;
      const m = String(v).match(/(\d+\.?\d*)/);
      if (m) { const n = parseFloat(m[1]); if (n > 0 && n <= 5) return n; }
      return null;
    };

    // BSR: usually `bestsellerRanks` (array of {rank, category}), but the actor
    // returns several shapes — handle array, object, and plain number.
    const bsrRaw = item.bestsellerRanks ?? item.bestsellersRank ?? item.bestSellerRanks
      ?? item.salesRanks ?? item.salesRank ?? item.bsr ?? item.rank;
    let bsr = null;
    if (Array.isArray(bsrRaw) && bsrRaw.length) {
      bsr = toInt(bsrRaw[0]?.rank ?? bsrRaw[0]?.position ?? bsrRaw[0]?.value ?? bsrRaw[0]);
    } else if (bsrRaw && typeof bsrRaw === 'object') {
      bsr = toInt(bsrRaw.rank ?? bsrRaw.position ?? bsrRaw.value);
    } else if (bsrRaw != null) {
      bsr = toInt(bsrRaw);
    }

    // Price can be a number, a "$12.99" string, or an object {value|amount}.
    const priceFrom = (c) => {
      if (c == null) return null;
      if (typeof c === 'object') return toNum(c.value ?? c.amount ?? c.price ?? c.current);
      return toNum(c);
    };
    const sellingPrice = priceFrom(item.price) ?? priceFrom(item.listPrice)
      ?? priceFrom(item.priceAmount) ?? priceFrom(item.salePrice) ?? priceFrom(item.buyBoxPrice);

    // Category from breadCrumbs string: "A > B > C > D" → last segment
    const breadCrumbStr = typeof item.breadCrumbs === 'string' ? item.breadCrumbs : null;
    const category = breadCrumbStr
      ? breadCrumbStr.split('>').map(s => s.trim()).filter(Boolean).pop()
      : item.category ?? item.mainCategory ?? null;

    // Attributes array → find date first available
    const attrs = Array.isArray(item.attributes) ? item.attributes : [];
    const attrMap = {};
    attrs.forEach(a => { if (a.key) attrMap[a.key] = a.value; });

    return {
      // ── Schema fields saved to product_weekly_data ──
      bsr,
      total_reviews:       toInt(item.reviewsCount ?? item.reviews ?? item.ratingsTotal ?? item.reviewCount ?? item.countReviews),
      average_star_rating: toStars(item.stars ?? item.rating ?? item.averageRating ?? item.starsAverage),
      selling_price:       sellingPrice,
      // ── Display-only fields (prefixed _) ──
      _title:           item.title ?? null,
      _brand:           item.brand ?? null,
      _asin:            item.asin ?? null,
      _category:        category,
      _breadcrumbs:     breadCrumbStr,
      _image:           item.thumbnailImage ?? item.highResolutionImages?.[0] ?? null,
      _gallery:         item.galleryThumbnails ?? [],
      _url:             item.url ?? null,
      _description:     item.description ?? null,
      _inStock:         item.inStock ?? null,
      _inStockText:     item.inStockText ?? null,
      _isAmazonChoice:  item.isAmazonChoice ?? false,
      _monthlyPurchases: item.monthlyPurchaseVolume ?? null,
      _answeredQuestions: item.answeredQuestions ?? null,
      _videosCount:     item.videosCount ?? null,
      _starsBreakdown:  item.starsBreakdown ?? null,
      _dateFirstAvailable: attrMap['Date First Available'] ?? null,
      _size:            attrMap['Size'] ?? null,
      _department:      attrMap['Department'] ?? null,
      _attributes:      attrs,
    };
  };

  const fetchOne = async (cfg) => {
    if (!cfg.asin.trim()) throw new Error('No ASIN');
    if (!actorId.trim()) throw new Error('No Actor ID — enter it in settings above');

    const normalizedActorId = actorId.trim().replace('/', '~');
    const startRes = await fetch(
      `https://api.apify.com/v2/acts/${encodeURIComponent(normalizedActorId)}/runs?token=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryOrProductUrls: [
            { url: `https://www.amazon.com/dp/${cfg.asin.trim()}` },
          ],
          locationDeliverableRoutes: ['PRODUCT'],
          maxItemsPerStartUrl: 1,
          maxOffers: 0,
          maxProductVariantsAsSeparateResults: 0,
          maxSearchPagesPerStartUrl: 1,
          proxyCountry: 'US',
          scrapeProductDetails: true,
          scrapeProductVariantPrices: false,
          scrapeSellers: false,
          useCaptchaSolver: false,
          proxyConfiguration: { useApifyProxy: true, apifyProxyGroups: ['RESIDENTIAL'] },
        }),
      }
    );
    if (!startRes.ok) throw new Error(`Actor start failed: ${(await startRes.text()).slice(0, 150)}`);
    const { data: runData } = await startRes.json();
    const runId = runData.id;

    // Poll up to 90s
    let status = runData.status;
    let attempts = 0;
    while (status !== 'SUCCEEDED' && status !== 'FAILED' && status !== 'ABORTED' && attempts < 18) {
      await new Promise(r => setTimeout(r, 5000));
      attempts++;
      const poll = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${apiKey}`);
      status = (await poll.json()).data?.status;
    }
    if (status !== 'SUCCEEDED') throw new Error(`Run ended: ${status}`);

    const dataRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${apiKey}&limit=1`);
    const items = await dataRes.json();
    const item = Array.isArray(items) ? items[0] : items;
    if (!item) throw new Error('No data returned');

    const mapped = mapRawToSchema(item);

    // Optional keyword rank
    if (cfg.keyword?.trim()) {
      try {
        const kwStart = await fetch(
          `https://api.apify.com/v2/acts/canadesk~amazon-keyword-rank-checker/runs?token=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keyword: cfg.keyword.trim(), asin: cfg.asin.trim(), countryCode: 'US' }),
          }
        );
        if (kwStart.ok) {
          const { data: kwRun } = await kwStart.json();
          let kwStatus = kwRun.status;
          let kwAttempts = 0;
          while (kwStatus !== 'SUCCEEDED' && kwStatus !== 'FAILED' && kwAttempts < 12) {
            await new Promise(r => setTimeout(r, 5000));
            kwAttempts++;
            const kwPoll = await fetch(`https://api.apify.com/v2/actor-runs/${kwRun.id}?token=${apiKey}`);
            kwStatus = (await kwPoll.json()).data?.status;
          }
          if (kwStatus === 'SUCCEEDED') {
            const kwData = await fetch(`https://api.apify.com/v2/actor-runs/${kwRun.id}/dataset/items?token=${apiKey}&limit=1`);
            const kwItems = await kwData.json();
            mapped.primary_keyword_rank = kwItems?.[0]?.rank ?? kwItems?.[0]?.position ?? null;
          }
        }
      } catch { /* optional */ }
    }

    return { mapped, raw: item };
  };

  const handleFetchOne = async (cfg) => {
    if (!apiKey || !actorId) { toast({ title: 'Enter API key and Actor ID in settings first', variant: 'destructive' }); return; }
    setFetchingId(cfg.productId);
    updateConfig(cfg.productId, 'status', 'fetching');
    try {
      const { mapped, raw } = await fetchOne(cfg);
      saveConfigs(configs.map(c => c.productId === cfg.productId ? { ...c, status: 'done', result: mapped, raw } : c));
      // Persist a snapshot so every fetch builds price/rating/review history
      saveScrapeSnapshot({ asin: cfg.asin.trim(), mapped, raw });
      toast({ title: `Fetched: ${products.find(p => p.id === cfg.productId)?.product_name}` });
    } catch (err) {
      saveConfigs(configs.map(c => c.productId === cfg.productId ? { ...c, status: 'error', result: null } : c));
      toast({ title: 'Fetch failed', description: err.message, variant: 'destructive' });
    } finally {
      setFetchingId(null);
    }
  };

  const handleFetchAll = async () => {
    if (!apiKey || !actorId) { toast({ title: 'Enter API key and Actor ID in settings first', variant: 'destructive' }); return; }
    setFetchingAll(true);
    const toFetch = configs.filter(c => c.asin.trim());
    for (const cfg of toFetch) {
      setFetchingId(cfg.productId);
      setConfigs(prev => {
        const updated = prev.map(c => c.productId === cfg.productId ? { ...c, status: 'fetching' } : c);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
      try {
        const { mapped, raw } = await fetchOne(cfg);
        setConfigs(prev => {
          const updated = prev.map(c => c.productId === cfg.productId ? { ...c, status: 'done', result: mapped, raw } : c);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          return updated;
        });
        // Persist a snapshot so every fetch builds price/rating/review history
        saveScrapeSnapshot({ asin: cfg.asin.trim(), mapped, raw });
      } catch {
        setConfigs(prev => {
          const updated = prev.map(c => c.productId === cfg.productId ? { ...c, status: 'error' } : c);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          return updated;
        });
      }
    }
    setFetchingId(null);
    setFetchingAll(false);
    toast({ title: `Fetch complete for ${toFetch.length} products` });
  };

  const handleSaveAll = async () => {
    if (!targetWeek) { toast({ title: 'Select a week first', variant: 'destructive' }); return; }
    const wkInfo = parseWeekValue(targetWeek);
    if (!wkInfo) { toast({ title: 'Invalid week', variant: 'destructive' }); return; }
    const { year: yr, week: wk, period_start, period_end } = wkInfo;
    const toSave = configs.filter(c => c.status === 'done' && c.result);
    if (!toSave.length) { toast({ title: 'No fetched data to save', variant: 'destructive' }); return; }

    try {
      // Schema fields only (no _ prefixed display fields)
      const schemaFields = ['bsr', 'total_reviews', 'average_star_rating', 'selling_price', 'primary_keyword_rank'];
      // Pull any existing values for this week so a missing scrape keeps the last
      // good value (and we only fall back to 0 when the field was never recorded).
      const ids = toSave.map(c => c.productId);
      const { data: existingRows } = await supabase.from('product_weekly_data')
        .select('product_id, bsr, total_reviews, average_star_rating, selling_price, primary_keyword_rank')
        .in('product_id', ids).eq('year', yr).eq('week_number', wk);
      const existing = {};
      (existingRows || []).forEach(r => { existing[r.product_id] = r; });

      const payloads = toSave.map(c => {
        const ex = existing[c.productId] || {};
        const payload = {
          product_id: c.productId,
          user_id: user?.id,
          year: yr,
          week_number: wk,
          period_start,
          period_end,
          updated_at: new Date().toISOString(),
          apify_fetched_at: new Date().toISOString(),
          apify_raw: c.raw ? { ...c.raw, _extra: undefined } : null,
        };
        schemaFields.forEach(k => {
          const fetched = c.result[k];
          payload[k] = (fetched !== null && fetched !== undefined)
            ? fetched                                                   // fresh value from Amazon
            : (ex[k] !== null && ex[k] !== undefined ? ex[k] : 0);      // else keep last, else 0
        });
        return payload;
      });
      const { error } = await supabase.from('product_weekly_data')
        .upsert(payloads, { onConflict: 'product_id,year,week_number' });
      if (error) throw error;
      toast({ title: `Saved ${toSave.length} products to Week ${wk}` });
      // Navigate to Log Weekly Data for the first saved product at this week
      if (toSave.length === 1) {
        navigate(`/ops-hub/entry?product=${toSave[0].productId}&week=${wk}&year=${yr}`);
      } else {
        navigate(`/ops-hub/entry?week=${wk}&year=${yr}`);
      }
    } catch (err) {
      toast({ title: 'Save failed', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">

      {/* Settings: API Key + Actor ID */}
      <div className="bg-slate-50 border border-[hsl(var(--border))] rounded-xl p-4 space-y-4">
        <p className="text-sm font-semibold text-slate-700">Apify Settings</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* API Key */}
          <div className="space-y-1.5">
            <Label className="text-xs">API Key</Label>
            <div className="relative">
              <Input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="apify_api_XXXXXXXX"
                className="pr-10 font-mono text-sm h-9"
              />
              <button onClick={() => setShowKey(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-slate-400">apify.com → Settings → Integrations → Personal API tokens</p>
          </div>

          {/* Actor ID */}
          <div className="space-y-1.5">
            <Label className="text-xs">Actor ID</Label>
            <Input
              value={actorId}
              onChange={e => setActorId(e.target.value)}
              placeholder="username~actor-name"
              className="font-mono text-sm h-9"
            />
            <p className="text-xs text-slate-400">apify.com/store → open your actor → copy ID from the URL</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={saveKey} disabled={savingKey} className="w-full md:w-auto">
            {savingKey ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : null}
            Save Settings
          </Button>
          <span className="text-xs text-slate-400">Stored in database · synced across devices</span>
        </div>
      </div>

      {/* Product table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Products · ASIN · Keywords</Label>
          <Button
            size="sm"
            onClick={() => saveConfigs([...configs, { productId: `new-${Date.now()}`, asin: '', keyword: '', status: 'idle', result: null, isNew: true }])}
            className="bg-[hsl(var(--terracotta))] hover:opacity-90 text-white h-8 text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Product
          </Button>
        </div>

        <div className="rounded-xl border border-[hsl(var(--border))] overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[2fr_1.4fr_2fr_80px_32px_32px] gap-2 bg-slate-50 border-b border-[hsl(var(--border))] px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <span>Product</span>
            <span>ASIN</span>
            <span>Primary Keyword</span>
            <span>Status</span>
            <span></span>
            <span></span>
          </div>

          {configs.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-slate-400">
              Click <strong>+ Add Product</strong> to start configuring your products.
            </div>
          )}

          {configs.map((cfg, idx) => {
            const product = products.find(p => p.id === cfg.productId);
            const isFetching = fetchingId === cfg.productId;

            return (
              <div key={cfg.productId} className="grid grid-cols-[2fr_1.4fr_2fr_80px_32px_32px] gap-2 items-center px-4 py-3 border-b border-[hsl(var(--border))] last:border-0 hover:bg-slate-50/40">

                {/* Product selector */}
                <Select
                  value={cfg.productId}
                  onValueChange={(val) => {
                    const p = products.find(x => x.id === val);
                    saveConfigs(configs.map((c, i) => i === idx ? {
                      ...c,
                      productId: val,
                      asin: c.asin || p?.asin || '',
                      isNew: false,
                    } : c));
                  }}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select product…" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="truncate">{p.product_name}</span>
                        {p.sku && <span className="text-slate-400 ml-1">· {p.sku}</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* ASIN input — persists to the product on blur */}
                <Input
                  value={cfg.asin}
                  onChange={e => updateConfig(cfg.productId, 'asin', e.target.value)}
                  onBlur={() => persistConfig(cfg)}
                  placeholder="B0XXXXXXXX"
                  className="font-mono text-xs h-8"
                />

                {/* Keyword input — persists to the product on blur */}
                <Input
                  value={cfg.keyword}
                  onChange={e => updateConfig(cfg.productId, 'keyword', e.target.value)}
                  onBlur={() => persistConfig(cfg)}
                  placeholder="sneaker cleaning kit"
                  className="text-xs h-8"
                />

                {/* Status */}
                <div className="flex items-center justify-center">
                  {isFetching && <span className="flex items-center gap-1 text-xs text-amber-600"><Loader2 className="w-3 h-3 animate-spin" />…</span>}
                  {!isFetching && cfg.status === 'done' && <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle2 className="w-3 h-3" />Done</span>}
                  {!isFetching && cfg.status === 'error' && <span className="flex items-center gap-1 text-xs text-red-500"><XCircle className="w-3 h-3" />Error</span>}
                  {!isFetching && cfg.status === 'idle' && <span className="text-xs text-slate-300">—</span>}
                </div>

                {/* Fetch button */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleFetchOne(cfg)}
                  disabled={!!fetchingId || fetchingAll || !cfg.asin.trim() || !product}
                  className="h-8 w-8 p-0"
                  title="Fetch this product"
                >
                  {isFetching ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                </Button>

                {/* Remove button */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeConfig(cfg.productId)}
                  className="h-8 w-8 p-0 text-slate-400 hover:text-red-500"
                  title="Remove row"
                >
                  <XCircle className="w-3.5 h-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Results preview — shown after any fetch */}
      {configs.some(c => c.status === 'done' && c.result) && (
        <div className="space-y-3">
          <Label className="text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" /> Fetched Data — Review Before Saving
          </Label>

          {configs.filter(c => c.status === 'done' && c.result).map(cfg => {
            const product = products.find(p => p.id === cfg.productId);
            const r = cfg.result;

            const kpis = [
              { label: 'BSR',           value: r.bsr                  ? `#${Number(r.bsr).toLocaleString()}`     : null, color: 'bg-blue-50 text-blue-800' },
              { label: 'Reviews',       value: r.total_reviews        ? Number(r.total_reviews).toLocaleString()  : null, color: 'bg-slate-100 text-slate-800' },
              { label: 'Rating',        value: r.average_star_rating  ? `${r.average_star_rating} ★`              : null, color: 'bg-amber-50 text-amber-800' },
              { label: 'Price',         value: r.selling_price        ? `$${Number(r.selling_price).toFixed(2)}`  : null, color: 'bg-green-50 text-green-800' },
              { label: 'Keyword Rank',  value: r.primary_keyword_rank ? `#${r.primary_keyword_rank}`              : null, color: 'bg-purple-50 text-purple-800' },
              { label: 'Monthly Sales', value: r._monthlyPurchases    ? `${r._monthlyPurchases}+ / mo`            : null, color: 'bg-teal-50 text-teal-800' },
              { label: 'Q&A',           value: r._answeredQuestions != null ? `${r._answeredQuestions} Q&A`       : null, color: 'bg-slate-50 text-slate-700' },
              { label: 'Videos',        value: r._videosCount         ? `${r._videosCount} videos`                : null, color: 'bg-slate-50 text-slate-700' },
            ].filter(f => f.value !== null);

            return (
              <div key={cfg.productId} className="rounded-xl border border-[hsl(var(--border))] overflow-hidden bg-white shadow-sm">

                {/* Header */}
                <div className="bg-[hsl(var(--cinder))] px-5 py-4 flex items-start gap-4">
                  {r._image && (
                    <img src={r._image} alt="" className="w-20 h-20 object-contain rounded-lg bg-white p-1.5 flex-shrink-0 border border-white/20" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-heading text-base leading-snug">{r._title || product?.product_name}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {r._brand    && <span className="text-xs bg-white/10 text-white px-2 py-0.5 rounded-full">Brand: {r._brand}</span>}
                      {r._asin     && <span className="text-xs font-mono text-slate-400">{r._asin}</span>}
                      {r._size     && <span className="text-xs bg-white/10 text-slate-300 px-2 py-0.5 rounded-full">{r._size}</span>}
                      {r._department && <span className="text-xs text-slate-400">{r._department}</span>}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r._inStock ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {r._inStock ? 'In Stock' : 'Currently Unavailable'}
                      </span>
                      {r._isAmazonChoice && <span className="text-xs bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full">Amazon's Choice</span>}
                    </div>
                    {r._dateFirstAvailable && <p className="text-xs text-slate-500 mt-1">First available: {r._dateFirstAvailable}</p>}
                  </div>
                </div>

                {/* Breadcrumb */}
                {r._breadcrumbs && (
                  <div className="px-5 py-2 bg-slate-50 border-b border-[hsl(var(--border))] text-xs text-slate-500 truncate">
                    📂 {r._breadcrumbs}
                  </div>
                )}

                {/* KPI chips */}
                {kpis.length > 0 ? (
                  <div className="flex flex-wrap gap-2 px-5 py-4 border-b border-[hsl(var(--border))]">
                    {kpis.map(f => (
                      <div key={f.label} className={`rounded-lg px-4 py-2 ${f.color} text-center min-w-[90px]`}>
                        <div className="text-xs opacity-60 mb-0.5">{f.label}</div>
                        <div className="text-base font-mono font-bold">{f.value}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-5 py-3 bg-amber-50 border-b border-amber-100">
                    <p className="text-xs text-amber-700 font-medium">⚠ No commercial metrics yet — product is currently unavailable on Amazon (no price, BSR, or reviews)</p>
                    <p className="text-xs text-amber-600 mt-0.5">Once the listing goes live, fetch again to capture BSR, price, and review data.</p>
                  </div>
                )}

                {/* Stars breakdown */}
                {r._starsBreakdown && Object.values(r._starsBreakdown).some(v => v > 0) && (
                  <div className="px-5 py-3 border-b border-[hsl(var(--border))]">
                    <p className="text-xs font-semibold text-slate-500 mb-2">Rating Breakdown</p>
                    <div className="space-y-1">
                      {[5,4,3,2,1].map(star => (
                        <div key={star} className="flex items-center gap-2 text-xs">
                          <span className="w-8 text-right text-slate-500">{star}★</span>
                          <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                            <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: `${r._starsBreakdown[`${star}star`] || 0}%` }} />
                          </div>
                          <span className="w-8 text-slate-400">{r._starsBreakdown[`${star}star`] || 0}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                {r._description && (
                  <div className="px-5 py-4 border-b border-[hsl(var(--border))]">
                    <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Product Description</p>
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-4">{r._description}</p>
                  </div>
                )}

                {/* Attributes table */}
                {r._attributes?.length > 0 && (
                  <div className="px-5 py-4 border-b border-[hsl(var(--border))]">
                    <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Product Attributes</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {r._attributes.filter(a => a.key && a.value).map((a, i) => (
                        <div key={i} className="flex gap-2 bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-100">
                          <span className="text-xs font-medium text-slate-500 min-w-[100px]">{a.key}</span>
                          <span className="text-xs text-slate-700">{a.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gallery */}
                {r._gallery?.length > 0 && (
                  <div className="px-5 py-4">
                    <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Gallery</p>
                    <div className="flex gap-2 overflow-x-auto">
                      {[r._image, ...r._gallery].filter(Boolean).map((img, i) => (
                        <img key={i} src={img} alt="" className="w-16 h-16 object-contain rounded-lg border border-slate-200 bg-slate-50 p-1 flex-shrink-0" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Fetch All + Save All */}
      <div className="flex items-end gap-4 flex-wrap pt-2 border-t border-[hsl(var(--border))]">
        <Button
          onClick={handleFetchAll}
          disabled={!!fetchingId || fetchingAll || !apiKey || configs.every(c => !c.asin.trim())}
          className="bg-[hsl(var(--cinder))] hover:opacity-90 text-white"
        >
          {fetchingAll ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Fetch All Products
        </Button>

        <div className="space-y-1.5 w-44">
          <Label className="text-xs">Save to Week</Label>
          <Select value={targetWeek} onValueChange={setTargetWeek}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Select week" /></SelectTrigger>
            <SelectContent>
              {weekOptions.map(w => <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleSaveAll}
          disabled={!targetWeek || configs.every(c => c.status !== 'done')}
          className="bg-[hsl(var(--terracotta))] hover:opacity-90 text-white"
        >
          <Upload className="w-4 h-4 mr-2" />
          Save All to Dashboard
        </Button>

        <p className="text-xs text-slate-400 self-center">
          {configs.filter(c => c.status === 'done').length} / {configs.length} ready to save
        </p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OpsHubImport() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('csv');
  const [products, setProducts] = useState([]);

  useEffect(() => {
    supabase.from('products').select('id, product_name, sku, asin, primary_keyword').order('created_at', { ascending: false })
      .then(({ data }) => setProducts(data || []));
  }, []);

  return (
    <div className="min-h-screen bg-[hsl(var(--parchment))] pb-16">
      {/* Header */}
      <div className="bg-[hsl(var(--cinder))] text-white px-6 py-5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/ops-hub')} className="text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-heading text-2xl">Import Data</h1>
              <p className="text-slate-400 text-sm mt-0.5">Amazon CSV reports · Apify web data</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 mt-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl border border-[hsl(var(--border))] p-1 mb-6 w-fit">
          {[
            { id: 'csv', icon: FileSpreadsheet, label: 'Amazon CSV' },
            { id: 'apify', icon: Zap, label: 'Apify Scraper' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'bg-[hsl(var(--cinder))] text-white'
                  : 'text-slate-600 hover:text-[hsl(var(--cinder))]'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="bg-white rounded-2xl border border-[hsl(var(--border))] p-6">
          {tab === 'csv' && <CSVImportTab products={products} />}
          {tab === 'apify' && <ApifyTab products={products} setProducts={setProducts} />}
        </div>
      </div>
    </div>
  );
}
