import { supabase } from '@/lib/customSupabaseClient';
import { shiftDate } from '@/utils/decisionMetrics';

async function allRows(query) {
  const rows = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await query().range(offset, offset + 499);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < 500) return rows;
  }
}
export async function loadOpsHubDashboard() {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error('Sign in to view the Operations Hub.');
  const { data: latest, error: latestError } = await supabase.from('sales_daily').select('sales_date')
    .eq('owner_id', user.id).order('sales_date', { ascending: false }).limit(1);
  const latestDate = latest?.[0]?.sales_date;
  const start = shiftDate(latestDate, -119) || shiftDate(new Date().toISOString().slice(0, 10), -119);
  const sources = {
    products: () => supabase.from('product_marketplaces').select('id,owner_id:owner,product_id,marketplace_id,asin,sku,currency,listing_status,products(id,product_name,brand,main_category),marketplaces(code,name)').eq('owner', user.id).order('id'),
    sales: () => supabase.from('sales_daily').select('*').eq('owner_id', user.id).gte('sales_date', start).order('id'),
    ads: () => supabase.from('ad_performance_daily').select('*').eq('owner_id', user.id).gte('performance_date', start).order('id'),
    inventory: () => supabase.from('inventory_snapshots').select('*').eq('owner_id', user.id).order('id'),
    prices: () => supabase.from('product_price_versions').select('*').eq('owner_id', user.id).order('id'),
    costs: () => supabase.from('product_cost_versions').select('*').eq('owner_id', user.id).order('id'),
    fees: () => supabase.from('amazon_fee_versions').select('*').eq('owner_id', user.id).order('id'),
    matrix: () => supabase.from('v_amazon_ops_report_matrix').select('*').eq('owner_id', user.id).order('report_type_code').order('marketplace_code'),
    weekly: () => supabase.from('amazon_weekly_workflow_reports').select('*').eq('owner_id', user.id).eq('record_type', 'ASIN').order('id'),
  };
  const results = await Promise.all(Object.entries(sources).map(async ([key, query]) => {
    if (key === 'sales' && latestError) return [key, { rows: [], error: latestError.message }];
    try { return [key, { rows: await allRows(query), error: null }]; }
    catch (error) { return [key, { rows: [], error: error.message || 'Source unavailable' }]; }
  }));
  return { latestDate, historyStart: start, loadedAt: new Date().toISOString(), sources: Object.fromEntries(results) };
}
