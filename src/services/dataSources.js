import { supabase } from '@/lib/customSupabaseClient';

const DEFAULT_SOURCES = [
  { source_code: 'amazon_reports', source_name: 'Amazon Seller Central Reports', source_type: 'marketplace', connection_mode: 'manual_upload' },
  { source_code: 'helium10', source_name: 'Helium 10', source_type: 'market_intelligence', connection_mode: 'manual_upload' },
  { source_code: 'keepa', source_name: 'Keepa', source_type: 'market_intelligence', connection_mode: 'api_or_upload' },
  { source_code: 'supplier_alibaba', source_name: 'Supplier / Alibaba', source_type: 'supply_chain', connection_mode: 'manual_upload' },
  { source_code: 'financial_bank', source_name: 'Financial / Bank', source_type: 'finance', connection_mode: 'manual_upload' },
];

const safeFileName = (name = 'source.csv') => name.replace(/[^a-zA-Z0-9._-]/g, '_');

export async function ensureDefaultDataSources(userId) {
  if (!userId) throw new Error('User is not authenticated.');
  const rows = DEFAULT_SOURCES.map(source => ({ owner_id: userId, status: 'available', ...source }));
  const { error } = await supabase.from('data_sources').upsert(rows, { onConflict: 'owner_id,source_code' });
  if (error) throw error;
}

export async function loadDataSourcesHub(userId) {
  await ensureDefaultDataSources(userId);
  const [sourcesRes, productsRes, importsRes, keywordsRes, competitorsRes] = await Promise.all([
    supabase.from('v_data_sources_status').select('*').order('source_name'),
    supabase.from('product_marketplaces').select('id,asin,sku,currency,products(product_name,brand),marketplaces(code,name)').order('created_at', { ascending: false }),
    supabase.from('source_import_jobs').select('id,import_type,original_file_name,status,total_rows,valid_rows,invalid_rows,warning_count,error_message,created_at,data_sources(source_name,source_code)').order('created_at', { ascending: false }).limit(25),
    supabase.from('helium10_keyword_intelligence').select('id,keyword,search_volume,organic_rank,sponsored_rank,competing_products,title_density,iq_score,snapshot_date').order('snapshot_date', { ascending: false }).order('search_volume', { ascending: false }).limit(25),
    supabase.from('competitor_market_snapshots').select('id,competitor_asin,competitor_title,brand,price,bsr,rating,review_count,estimated_monthly_sales,estimated_monthly_revenue,snapshot_date').order('snapshot_date', { ascending: false }).limit(25),
  ]);

  for (const res of [sourcesRes, productsRes, importsRes, keywordsRes, competitorsRes]) {
    if (res.error) throw res.error;
  }

  return {
    sources: sourcesRes.data || [],
    productMarketplaces: productsRes.data || [],
    imports: importsRes.data || [],
    keywords: keywordsRes.data || [],
    competitors: competitorsRes.data || [],
  };
}

export async function createSourceImportJob({ userId, sourceId, productMarketplaceId, importType, file }) {
  if (!userId) throw new Error('User is not authenticated.');
  if (!sourceId) throw new Error('Select a data source.');
  if (!productMarketplaceId) throw new Error('Select a product / marketplace.');
  if (!importType) throw new Error('Select an import type.');
  if (!file) throw new Error('Select a file.');

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const storagePath = `${userId}/${stamp}-${safeFileName(file.name)}`;

  const { error: uploadError } = await supabase.storage
    .from('source-imports')
    .upload(storagePath, file, { upsert: false, contentType: file.type || 'text/csv' });
  if (uploadError) throw uploadError;

  const { data: job, error } = await supabase.from('source_import_jobs').insert({
    owner_id: userId,
    data_source_id: sourceId,
    product_marketplace_id: productMarketplaceId,
    import_type: importType,
    original_file_name: file.name,
    storage_path: storagePath,
    status: 'uploaded',
  }).select('*').single();

  if (error) {
    await supabase.storage.from('source-imports').remove([storagePath]);
    throw error;
  }

  if (importType.startsWith('helium10_')) {
    const { data: parsed, error: parseError } = await supabase.functions.invoke('parse-source-import', {
      body: { job_id: job.id },
    });
    if (parseError) throw parseError;
    if (parsed?.error) throw new Error(parsed.error);
    return { job, parsed };
  }

  return { job, parsed: null };
}
