import { supabase } from '@/lib/customSupabaseClient';

const safeFileName = (name = 'report.csv') => name.replace(/[^a-zA-Z0-9._-]/g, '_');

export async function loadAmazonReportCenter() {
  const [summaryRes, matrixRes, queueRes, typesRes, pmRes] = await Promise.all([
    supabase.from('v_amazon_ops_dashboard_summary').select('*').maybeSingle(),
    supabase.from('v_amazon_ops_report_matrix').select('*').order('frequency').order('report_name'),
    supabase.from('v_amazon_ops_work_queue').select('*').order('created_at', { ascending: false }).limit(50),
    supabase.from('amazon_report_types').select('code,name,data_domain,description').eq('active', true).order('name'),
    supabase.from('product_marketplaces').select('id,product_id,asin,sku,currency,listing_status,products(product_name,brand),marketplaces(code,name)').order('created_at', { ascending: false })
  ]);

  for (const res of [summaryRes, matrixRes, queueRes, typesRes, pmRes]) {
    if (res.error) throw res.error;
  }

  return {
    summary: summaryRes.data || null,
    matrix: matrixRes.data || [],
    queue: queueRes.data || [],
    reportTypes: typesRes.data || [],
    productMarketplaces: pmRes.data || [],
  };
}

export async function createAmazonReportJob({ userId, file, reportTypeCode, marketplaceCode = 'US', productMarketplaceId = null, periodStart = null, periodEnd = null }) {
  if (!userId) throw new Error('User is not authenticated.');
  if (!file) throw new Error('Select a report file first.');
  if (!reportTypeCode) throw new Error('Select a report type.');

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const storagePath = `${userId}/${stamp}-${safeFileName(file.name)}`;

  const { error: uploadError } = await supabase.storage
    .from('amazon-reports')
    .upload(storagePath, file, { upsert: false, contentType: file.type || 'text/csv' });
  if (uploadError) throw uploadError;

  const { data: job, error: jobError } = await supabase
    .from('amazon_report_import_jobs')
    .insert({
      owner_id: userId,
      product_marketplace_id: productMarketplaceId || null,
      report_type_code: reportTypeCode,
      marketplace_code: marketplaceCode,
      original_file_name: file.name,
      storage_path: storagePath,
      file_size: file.size,
      period_start: periodStart || null,
      period_end: periodEnd || null,
      status: 'uploaded',
      review_status: 'not_required',
    })
    .select('*')
    .single();

  if (jobError) {
    await supabase.storage.from('amazon-reports').remove([storagePath]);
    throw jobError;
  }

  const { data: parsed, error: parseError } = await supabase.functions.invoke('parse-amazon-report', {
    body: { job_id: job.id },
  });
  if (parseError) throw parseError;
  if (parsed?.error) throw new Error(parsed.error);
  return { job, parsed };
}

export async function loadAmazonReportJob(jobId) {
  const [detailRes, rowsRes, eventsRes] = await Promise.all([
    supabase.from('v_amazon_report_import_detail').select('*').eq('id', jobId).single(),
    supabase.from('amazon_report_import_rows').select('id,row_number,normalized_data,validation_status,validation_messages,target_key').eq('job_id', jobId).order('row_number').limit(200),
    supabase.from('amazon_report_import_events').select('*').eq('job_id', jobId).order('created_at', { ascending: false }).limit(50),
  ]);
  if (detailRes.error) throw detailRes.error;
  if (rowsRes.error) throw rowsRes.error;
  if (eventsRes.error) throw eventsRes.error;
  return { job: detailRes.data, rows: rowsRes.data || [], events: eventsRes.data || [] };
}

export async function runAmazonReportWorkflow(jobId, action, extra = {}) {
  const { data, error } = await supabase.functions.invoke('amazon-report-workflow', {
    body: { job_id: jobId, action, ...extra },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function applyAmazonReport(jobId) {
  const { data, error } = await supabase.functions.invoke('apply-amazon-report', {
    body: { job_id: jobId, confirm: true },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}
