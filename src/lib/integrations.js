// Central helper for integration credentials + scrape snapshots.
// Credentials live in the `integration_settings` (key/value) table so they
// persist across devices/browsers instead of localStorage. We keep a
// localStorage mirror as a fast cache and offline fallback.

import { supabase } from '@/lib/customSupabaseClient';

// ─── Credentials (integration_settings) ──────────────────────────────────────

/** Fetch multiple settings at once → { key: value }. Falls back to localStorage. */
export async function getIntegrationSettings(keys) {
  const out = {};
  // seed from localStorage cache first
  keys.forEach(k => { const v = localStorage.getItem(k); if (v != null) out[k] = v; });
  try {
    const { data, error } = await supabase
      .from('integration_settings')
      .select('setting_key, setting_value')
      .in('setting_key', keys);
    if (!error && data) {
      data.forEach(row => {
        out[row.setting_key] = row.setting_value ?? '';
        localStorage.setItem(row.setting_key, row.setting_value ?? ''); // refresh cache
      });
    }
  } catch { /* offline → use cache */ }
  return out;
}

/** Upsert one or many settings. Accepts { key: value } or { key: {value, description} }. */
export async function saveIntegrationSettings(map) {
  const rows = Object.entries(map).map(([setting_key, raw]) => {
    const value = typeof raw === 'object' && raw !== null ? raw.value : raw;
    const description = typeof raw === 'object' && raw !== null ? raw.description : undefined;
    localStorage.setItem(setting_key, value ?? ''); // keep cache in sync
    return {
      setting_key,
      setting_value: value ?? '',
      ...(description ? { description } : {}),
      updated_at: new Date().toISOString(),
    };
  });
  const { error } = await supabase
    .from('integration_settings')
    .upsert(rows, { onConflict: 'setting_key' });
  if (error) throw error;
  return true;
}

// ─── Scrape snapshots (amazon_price_tracker) ──────────────────────────────────

/**
 * Persist a single product snapshot to amazon_price_tracker so every fetch
 * builds a time-series. `mapped` is the result of mapRawToSchema().
 */
export async function saveScrapeSnapshot({ asin, mapped, raw }) {
  if (!asin) return null;
  const row = {
    asin,
    product_title: mapped?._title ?? raw?.title ?? null,
    price: mapped?.selling_price ?? null,
    currency: raw?.currency ?? 'USD',
    rating: mapped?.average_star_rating ?? null,
    reviews_count: mapped?.total_reviews ?? null,
    availability: mapped?._inStock === true ? 'In Stock'
      : mapped?._inStock === false ? 'Unavailable'
      : (mapped?._inStockText ?? null),
    url: mapped?._url ?? (asin ? `https://www.amazon.com/dp/${asin}` : null),
    scraped_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from('amazon_price_tracker')
    .insert(row)
    .select()
    .maybeSingle();
  if (error) { console.warn('snapshot save failed', error.message); return null; }
  return data;
}

/** Read snapshot history for an ASIN (oldest→newest), for trend charts. */
export async function getScrapeHistory(asin, limit = 52) {
  const { data, error } = await supabase
    .from('amazon_price_tracker')
    .select('*')
    .eq('asin', asin)
    .order('scraped_at', { ascending: true })
    .limit(limit);
  if (error) return [];
  return data || [];
}
