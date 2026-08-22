import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertCircle, ArrowLeft, CheckCircle2, Clock3, FileSpreadsheet,
  Loader2, RefreshCw, ShieldCheck, Upload, XCircle
} from 'lucide-react';
import {
  applyAmazonReport,
  createAmazonReportJob,
  loadAmazonReportCenter,
  loadAmazonReportJob,
  runAmazonReportWorkflow,
} from '@/services/amazonReports';

const statusTone = (status) => {
  if (['ok', 'applied', 'complete', 'approved'].includes(status)) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (['missing', 'attention', 'failed', 'rejected'].includes(status)) return 'bg-red-50 text-red-700 border-red-200';
  if (['review', 'ready_for_review', 'pending'].includes(status)) return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-slate-50 text-slate-600 border-slate-200';
};

function Badge({ children, tone }) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${statusTone(tone)}`}>{children}</span>;
}

function Stat({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-white p-4 shadow-sm">
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-[hsl(var(--cinder))]">{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
    </div>
  );
}

export default function OpsHubImport() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef(null);

  const [data, setData] = useState({ summary: null, matrix: [], queue: [], reportTypes: [], productMarketplaces: [] });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loadingJob, setLoadingJob] = useState(false);
  const [acting, setActing] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');

  const [form, setForm] = useState({
    reportTypeCode: 'sales_traffic',
    productMarketplaceId: '',
    marketplaceCode: 'US',
    periodStart: '',
    periodEnd: '',
    file: null,
  });

  const refresh = async () => {
    setLoading(true);
    try {
      setData(await loadAmazonReportCenter());
    } catch (err) {
      toast({ title: 'Could not load Report Center', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const openJob = async (jobId) => {
    if (!jobId) return;
    setSelectedJobId(jobId);
    setLoadingJob(true);
    try {
      const detail = await loadAmazonReportJob(jobId);
      setSelectedJob(detail);
      setReviewNotes(detail.job?.review_notes || detail.job?.rejection_reason || '');
    } catch (err) {
      toast({ title: 'Could not load report', description: err.message, variant: 'destructive' });
    } finally {
      setLoadingJob(false);
    }
  };

  const summary = data.summary || {};
  const readiness = Number(summary.readiness_pct || 0);

  const selectedProduct = useMemo(
    () => data.productMarketplaces.find(x => x.id === form.productMarketplaceId),
    [data.productMarketplaces, form.productMarketplaceId]
  );

  const upload = async () => {
    if (!form.file) return toast({ title: 'Select a CSV report first', variant: 'destructive' });
    if (!form.reportTypeCode) return toast({ title: 'Select the report type', variant: 'destructive' });
    if (!form.productMarketplaceId) return toast({ title: 'Select the product / marketplace', variant: 'destructive' });

    setUploading(true);
    try {
      const result = await createAmazonReportJob({
        userId: user?.id,
        file: form.file,
        reportTypeCode: form.reportTypeCode,
        marketplaceCode: form.marketplaceCode,
        productMarketplaceId: form.productMarketplaceId,
        periodStart: form.periodStart || null,
        periodEnd: form.periodEnd || null,
      });
      toast({ title: 'Report uploaded and parsed', description: `${result.parsed?.total_rows || 0} rows staged for review.` });
      setForm(prev => ({ ...prev, file: null }));
      if (fileRef.current) fileRef.current.value = '';
      await refresh();
      await openJob(result.job.id);
    } catch (err) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const workflow = async (action) => {
    if (!selectedJobId) return;
    setActing(true);
    try {
      if (action === 'apply') await applyAmazonReport(selectedJobId);
      else await runAmazonReportWorkflow(selectedJobId, action, { notes: reviewNotes || null });
      toast({ title: action === 'apply' ? 'Report applied' : `Report ${action.replace('_', ' ')}` });
      await refresh();
      await openJob(selectedJobId);
    } catch (err) {
      toast({ title: 'Action failed', description: err.message, variant: 'destructive' });
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--terracotta))]" /></div>;
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--parchment))] pb-12">
      <div className="bg-[hsl(var(--cinder))] text-white px-6 py-5">
        <div className="max-w-7xl mx-auto flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <button onClick={() => navigate('/ops-hub')} className="text-xs text-slate-400 hover:text-white flex items-center gap-1 mb-2"><ArrowLeft className="w-3.5 h-3.5" /> Operations Hub</button>
            <h1 className="font-heading text-3xl">Amazon Report Center</h1>
            <p className="text-slate-400 text-sm mt-1">Team-assisted Seller Central imports · validation · review · approval · apply</p>
          </div>
          <Button variant="outline" onClick={refresh} className="border-white/20 text-white hover:bg-white/10 bg-transparent"><RefreshCw className="w-4 h-4 mr-2" /> Refresh</Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 mt-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <Stat label="Readiness" value={`${readiness.toFixed(0)}%`} hint={`${summary.reports_ok || 0} of ${summary.total_active_reports || 0} reports OK`} />
          <Stat label="Missing" value={summary.reports_missing || 0} hint="Needs team upload" />
          <Stat label="Attention" value={summary.reports_attention || 0} hint="Validation / failed" />
          <Stat label="In Review" value={summary.reports_in_review || 0} hint="Reviewer action" />
          <Stat label="In Progress" value={summary.reports_in_progress || 0} hint="Parsing / applying" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.05fr_1.95fr] gap-6">
          <section className="rounded-2xl border border-[hsl(var(--border))] bg-white shadow-sm p-5 h-fit">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-9 h-9 rounded-xl bg-[hsl(var(--terracotta))]/10 flex items-center justify-center"><Upload className="w-4 h-4 text-[hsl(var(--terracotta))]" /></div>
              <div><h2 className="font-heading text-xl text-[hsl(var(--cinder))]">Upload Seller Central Report</h2><p className="text-xs text-slate-400">CSV is supported in parser v3</p></div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Report type</Label>
                <Select value={form.reportTypeCode} onValueChange={v => setForm(p => ({ ...p, reportTypeCode: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{data.reportTypes.map(t => <SelectItem key={t.code} value={t.code}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Product / marketplace</Label>
                <Select value={form.productMarketplaceId} onValueChange={v => setForm(p => ({ ...p, productMarketplaceId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                  <SelectContent>{data.productMarketplaces.map(pm => (
                    <SelectItem key={pm.id} value={pm.id}>{pm.products?.brand ? `${pm.products.brand} · ` : ''}{pm.products?.product_name || pm.asin || pm.sku} · {pm.marketplaces?.code || 'US'}</SelectItem>
                  ))}</SelectContent>
                </Select>
                {selectedProduct && <p className="text-xs text-slate-400">ASIN {selectedProduct.asin || '—'} · SKU {selectedProduct.sku || '—'} · {selectedProduct.currency || 'USD'}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Period start</Label><Input type="date" value={form.periodStart} onChange={e => setForm(p => ({ ...p, periodStart: e.target.value }))} /></div>
                <div className="space-y-1.5"><Label>Period end</Label><Input type="date" value={form.periodEnd} onChange={e => setForm(p => ({ ...p, periodEnd: e.target.value }))} /></div>
              </div>

              <div className="space-y-1.5">
                <Label>Amazon CSV file</Label>
                <Input ref={fileRef} type="file" accept=".csv,text/csv" onChange={e => setForm(p => ({ ...p, file: e.target.files?.[0] || null }))} />
              </div>

              <Button onClick={upload} disabled={uploading} className="w-full bg-[hsl(var(--terracotta))] hover:opacity-90 text-white">
                {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />} Upload & Parse
              </Button>

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-500 leading-relaxed">
                <strong className="text-slate-700">Operating team workflow:</strong> download the report from Seller Central, upload it here, review parser warnings, submit for review, approve, then apply. Amazon itself is never modified by this process.
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-white shadow-sm overflow-hidden">
              <div className="p-5 border-b border-[hsl(var(--border))] flex items-center justify-between">
                <div><h2 className="font-heading text-xl">Report Readiness Matrix</h2><p className="text-xs text-slate-400">Daily and weekly operating checklist</p></div>
                <ShieldCheck className="w-5 h-5 text-[hsl(var(--terracotta))]" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500"><tr><th className="text-left p-3">Report</th><th className="text-left p-3">Frequency</th><th className="text-left p-3">Status</th><th className="text-left p-3">Last upload</th></tr></thead>
                  <tbody>{data.matrix.map(r => <tr key={`${r.report_type_code}-${r.marketplace_code}`} className="border-t border-slate-100"><td className="p-3 font-medium">{r.report_name}</td><td className="p-3 text-slate-500">{r.frequency}</td><td className="p-3"><Badge tone={r.readiness_status}>{r.readiness_status}</Badge></td><td className="p-3 text-slate-500">{r.last_uploaded_at ? new Date(r.last_uploaded_at).toLocaleString() : 'Never'}</td></tr>)}</tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-[hsl(var(--border))] bg-white shadow-sm overflow-hidden">
              <div className="p-5 border-b border-[hsl(var(--border))]"><h2 className="font-heading text-xl">Operations Queue</h2><p className="text-xs text-slate-400">Click a report to review staged data and workflow actions</p></div>
              {data.queue.length === 0 ? <div className="p-10 text-center text-slate-400"><FileSpreadsheet className="w-10 h-10 mx-auto mb-3 opacity-40" />No report jobs yet.</div> : (
                <div className="divide-y divide-slate-100">{data.queue.map(q => (
                  <button key={q.id} onClick={() => openJob(q.id)} className={`w-full text-left px-5 py-4 hover:bg-slate-50 transition ${selectedJobId === q.id ? 'bg-orange-50/60' : ''}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div><div className="font-medium text-[hsl(var(--cinder))]">{q.report_name || q.report_type_code}</div><div className="text-xs text-slate-400 mt-1">{q.original_file_name || 'Report'} · {q.marketplace_code || 'US'} · {q.total_rows || 0} rows</div></div>
                      <div className="flex items-center gap-2"><Badge tone={q.status}>{q.status}</Badge>{q.overdue && <Badge tone="attention">Overdue</Badge>}</div>
                    </div>
                  </button>
                ))}</div>
              )}
            </div>
          </section>
        </div>

        {selectedJobId && (
          <section className="rounded-2xl border border-[hsl(var(--border))] bg-white shadow-sm overflow-hidden">
            {loadingJob ? <div className="p-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div> : selectedJob?.job ? (
              <>
                <div className="p-5 border-b border-[hsl(var(--border))] flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div><h2 className="font-heading text-xl">Review · {selectedJob.job.report_name}</h2><p className="text-xs text-slate-400 mt-1">{selectedJob.job.original_file_name} · parser {selectedJob.job.parser_version || '—'}</p></div>
                  <div className="flex gap-2 flex-wrap"><Badge tone={selectedJob.job.status}>{selectedJob.job.status}</Badge><Badge tone={selectedJob.job.review_status}>{selectedJob.job.review_status}</Badge></div>
                </div>

                <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Stat label="Total rows" value={selectedJob.job.total_rows || 0} />
                  <Stat label="Valid" value={selectedJob.job.valid_rows || 0} />
                  <Stat label="Invalid" value={selectedJob.job.invalid_rows || 0} />
                  <Stat label="Duplicates" value={selectedJob.job.duplicate_rows || 0} />
                </div>

                {selectedJob.job.error_message && <div className="mx-5 mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex gap-2"><AlertCircle className="w-4 h-4 mt-0.5" />{selectedJob.job.error_message}</div>}

                <div className="px-5 pb-5">
                  <div className="overflow-x-auto border rounded-xl">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50"><tr><th className="text-left p-2">Row</th><th className="text-left p-2">Status</th><th className="text-left p-2">Normalized data</th><th className="text-left p-2">Messages</th></tr></thead>
                      <tbody>{selectedJob.rows.slice(0, 25).map(r => <tr key={r.id} className="border-t"><td className="p-2">{r.row_number}</td><td className="p-2"><Badge tone={r.validation_status}>{r.validation_status}</Badge></td><td className="p-2 font-mono text-[11px] max-w-xl break-all">{JSON.stringify(r.normalized_data)}</td><td className="p-2 text-slate-500">{Array.isArray(r.validation_messages) ? r.validation_messages.join('; ') : ''}</td></tr>)}</tbody>
                    </table>
                  </div>
                  {selectedJob.rows.length > 25 && <p className="text-xs text-slate-400 mt-2">Showing first 25 of {selectedJob.rows.length} staged rows.</p>}

                  <div className="mt-5 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-end">
                    <div><Label>Review notes / rejection reason</Label><Input className="mt-1.5" value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} placeholder="Optional reviewer notes" /></div>
                    <div className="flex flex-wrap gap-2">
                      {selectedJob.job.status === 'ready_for_review' && selectedJob.job.review_status !== 'pending' && <Button variant="outline" disabled={acting} onClick={() => workflow('submit_review')}><Clock3 className="w-4 h-4 mr-2" />Submit for review</Button>}
                      {(selectedJob.job.review_status === 'pending' || selectedJob.job.status === 'ready_for_review') && <Button disabled={acting} onClick={() => workflow('approve')} className="bg-emerald-600 hover:bg-emerald-700 text-white"><CheckCircle2 className="w-4 h-4 mr-2" />Approve</Button>}
                      {(selectedJob.job.review_status === 'pending' || selectedJob.job.status === 'ready_for_review') && <Button variant="destructive" disabled={acting} onClick={() => workflow('reject')}><XCircle className="w-4 h-4 mr-2" />Reject</Button>}
                      {selectedJob.job.status === 'approved' && selectedJob.job.review_status === 'approved' && <Button disabled={acting} onClick={() => workflow('apply')} className="bg-[hsl(var(--terracotta))] hover:opacity-90 text-white">{acting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-2" />}Apply to analytics</Button>}
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </section>
        )}
      </div>
    </div>
  );
}
