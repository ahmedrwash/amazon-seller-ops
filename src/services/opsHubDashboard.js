import { supabase } from '@/lib/customSupabaseClient';
import { sevenDayWindow } from '@/utils/opsHubMetrics';

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
  const window = sevenDayWindow(latestError ? null : latest?.[0]?.sales_date);
  const sources = {
    products: () => supabase.from('product_marketplaces').select('id,owner_id:owner,product_id,asin,sku,currency,listing_status,products(id,product_name,brand,main_category),marketplaces(code,name)').eq('owner', user.id).order('id'),
    sales: () => supabase.from('sales_daily').select('*').eq('owner_id', user.id).gte('sales_date', window.start || '9999-01-01').lte('sales_date', window.end || '9999-01-01').order('id'),
    ads: () => supabase.from('ad_performance_daily').select('*').eq('owner_id', user.id).gte('performance_date', window.start || '9999-01-01').lte('performance_date', window.end || '9999-01-01').order('id'),
    inventory: () => supabase.from('inventory_snapshots').select('*').eq('owner_id', user.id).order('id'),
    economics: () => supabase.from('v_current_unit_economics').select('*').eq('owner_id', user.id).order('product_marketplace_id'),
    summary: () => supabase.from('v_amazon_ops_dashboard_summary').select('*').eq('owner_id', user.id).order('owner_id'),
    matrix: () => supabase.from('v_amazon_ops_report_matrix').select('*').eq('owner_id', user.id).order('report_type_code').order('marketplace_code'),
    weekly: () => supabase.from('amazon_weekly_workflow_reports').select('*').eq('owner_id', user.id).eq('record_type', 'ASIN').eq('period_type', 'CURRENT_PERIOD').order('id'),
  };
  const results = await Promise.all(Object.entries(sources).map(async ([key, query]) => {
    if (key === 'sales' && latestError) return [key, { rows: [], error: latestError.message }];
    try { return [key, { rows: await allRows(query), error: null }]; }
    catch (error) { return [key, { rows: [], error: error.message || 'Source unavailable' }]; }
  }));
  return { window, loadedAt: new Date().toISOString(), sources: Object.fromEntries(results) };
}
