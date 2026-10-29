const SHOPEE_HOSTS = new Set(['shopee.vn', 'www.shopee.vn', 's.shopee.vn', 'shope.ee']);

export function safeAffiliateUrl(value) {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || !SHOPEE_HOSTS.has(url.hostname) || url.username || url.password || url.port) return null;
    if (url.pathname === '/' || /sub_id=|your_|example|placeholder/i.test(url.pathname)) return null;
    return url.href;
  } catch {
    return null;
  }
}

export function normalizeCatalog(rows, category) {
  if (!Array.isArray(rows)) throw new Error('Invalid catalog response');
  const seen = new Set();
  return rows.flatMap((row) => {
    const price = Number(row.price_vnd);
    const activeTotal = Number(row.active_total_g);
    const checkedAt = Date.parse(row.last_checked_at);
    if (row.is_sample !== false || row.category !== category || !row.slug || seen.has(row.slug)
      || !row.name || !row.brand || !Number.isSafeInteger(price) || price <= 0
      || !Number.isFinite(activeTotal) || activeTotal <= 0
      || !Number.isFinite(checkedAt) || checkedAt > Date.now() + 5 * 60_000) return [];
    seen.add(row.slug);
    return [{
      slug: row.slug,
      name: row.name,
      brand: row.brand,
      category,
      price,
      activeTotal,
      costPerGram: Math.round(price / activeTotal),
      badge: null,
      url: safeAffiliateUrl(row.affiliate_url),
      lastCheckedAt: new Date(checkedAt).toISOString(),
      isSample: false,
    }];
  }).sort((a, b) => a.costPerGram - b.costPerGram);
}

export async function loadCatalog(client, category, signal) {
  const { data, error } = await client
    .from('products')
    .select('slug,name,brand,category,price_vnd,active_total_g,affiliate_url,last_checked_at,is_sample')
    .eq('category', category)
    .eq('is_active', true)
    .eq('is_sample', false)
    .order('cost_per_active_gram', { ascending: true })
    .abortSignal(signal);
  if (error) throw new Error('Catalog unavailable');
  return normalizeCatalog(data, category);
}

export function priceIsFresh(checkedAt, now = Date.now()) {
  const timestamp = Date.parse(checkedAt);
  return Number.isFinite(timestamp) && timestamp <= now + 5 * 60_000 && now - timestamp <= 48 * 60 * 60_000;
}
