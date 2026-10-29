#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const MAX_AGE_MS = 48 * 60 * 60 * 1000;
const SOURCE_KINDS = new Set(['affiliate_export', 'approved_api', 'manual_verified']);
const SOURCE_HOSTS = new Set(['shopee.vn', 'www.shopee.vn']);
const AFFILIATE_HOSTS = new Set(['s.shopee.vn', 'shope.ee']);

function requireText(value, field, max = 200) {
  if (typeof value !== 'string' || !value.trim() || value.length > max) {
    throw new Error(`${field}: expected nonempty text of at most ${max} characters`);
  }
  return value.trim();
}

function productUrl(value, field, affiliate = false) {
  let url;
  try {
    url = new URL(requireText(value, field, 2048));
  } catch {
    throw new Error(`${field}: expected a valid HTTPS Shopee URL`);
  }
  const hosts = affiliate ? AFFILIATE_HOSTS : SOURCE_HOSTS;
  const validPath = affiliate
    ? /^\/[A-Za-z0-9]{5,32}$/.test(url.pathname)
    : /^\/product\/\d+\/\d+\/?$/.test(url.pathname) || /-i\.\d+\.\d+\/?$/.test(url.pathname);
  if (url.protocol !== 'https:' || !hosts.has(url.hostname) || url.username || url.password || url.port || url.hash || !validPath) {
    throw new Error(`${field}: expected an allowed ${affiliate ? 'affiliate short link' : 'canonical Shopee product link'}`);
  }
  if (affiliate && url.search) {
    throw new Error(`${field}: use the short link issued by the affiliate portal without extra parameters`);
  }
  // Canonical product identity is in its path; remove tracking parameters from source links.
  if (!affiliate) url.search = '';
  return url.href;
}

/** Validate the entire feed before generating any database write. */
export function validateFeed(feed, { now = new Date() } = {}) {
  if (!feed || feed.schema_version !== 1 || feed.is_sample !== false) {
    throw new Error('Feed must use schema_version 1 and explicitly declare is_sample:false');
  }
  if (!feed.source || !SOURCE_KINDS.has(feed.source.kind)) {
    throw new Error('source.kind must be affiliate_export, approved_api or manual_verified');
  }
  requireText(feed.source.reference, 'source.reference', 500);
  if (!Array.isArray(feed.products) || !feed.products.length || feed.products.length > 1000) {
    throw new Error('products must contain between 1 and 1000 verified observations');
  }
  const nowMs = new Date(now).getTime();
  if (!Number.isFinite(nowMs)) throw new Error('Invalid validation clock');
  const seen = new Set();

  return feed.products.map((product, index) => {
    const field = `products[${index}]`;
    if (!product || typeof product !== 'object') throw new Error(`${field}: expected an object`);
    const slug = requireText(product.slug, `${field}.slug`, 120);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || seen.has(slug)) {
      throw new Error(`${field}.slug: invalid or duplicate slug`);
    }
    seen.add(slug);
    if (!['creatine', 'whey'].includes(product.category)) throw new Error(`${field}.category: unsupported category`);
    if (!Number.isSafeInteger(product.price_vnd) || product.price_vnd <= 0 || product.price_vnd > 2147483647) {
      throw new Error(`${field}.price_vnd: expected a positive integer price in VND`);
    }
    if (typeof product.active_total_g !== 'number' || !Number.isFinite(product.active_total_g)
      || product.active_total_g <= 0 || product.active_total_g > 99999999.99
      || Math.abs(product.active_total_g * 100 - Math.round(product.active_total_g * 100)) > 0.00001) {
      throw new Error(`${field}.active_total_g: expected positive grams with at most two decimal places`);
    }
    if (Math.round(product.price_vnd / product.active_total_g) > 2147483647) {
      throw new Error(`${field}: cost per gram exceeds the database integer range`);
    }
    if (typeof product.observed_at !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(product.observed_at)) {
      throw new Error(`${field}.observed_at: expected an ISO timestamp with timezone`);
    }
    const [year, month, day, hour, minute, second] = product.observed_at.slice(0, 19).split(/[-T:]/).map(Number);
    if (month < 1 || month > 12 || day < 1 || day > new Date(Date.UTC(year, month, 0)).getUTCDate()
      || hour > 23 || minute > 59 || second > 59) {
      throw new Error(`${field}.observed_at: invalid calendar date or time`);
    }
    const observedMs = Date.parse(product.observed_at);
    if (!Number.isFinite(observedMs) || observedMs > nowMs || nowMs - observedMs > MAX_AGE_MS) {
      throw new Error(`${field}.observed_at: observation must be within the last 48 hours and not in the future`);
    }
    if (product.is_sample === true) throw new Error(`${field}: sample rows cannot be imported`);

    return {
      slug,
      name: requireText(product.name, `${field}.name`),
      brand: requireText(product.brand, `${field}.brand`, 100),
      category: product.category,
      price_vnd: product.price_vnd,
      active_total_g: product.active_total_g,
      source_url: productUrl(product.source_url, `${field}.source_url`),
      affiliate_url: productUrl(product.affiliate_url, `${field}.affiliate_url`, true),
      last_checked_at: new Date(observedMs).toISOString(),
      badge: null,
      is_sample: false,
      is_active: true,
    };
  });
}

function backendConfig(env) {
  let url;
  try { url = new URL(env.SUPABASE_URL); } catch { throw new Error('Set SUPABASE_URL to the project HTTPS URL'); }
  if (url.protocol !== 'https:' || !/^[a-z0-9-]+\.supabase\.co$/.test(url.hostname)
    || url.username || url.password || url.port || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('SUPABASE_URL must be the HTTPS project origin at *.supabase.co');
  }
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (typeof key !== 'string' || !key.trim()) throw new Error('Set SUPABASE_SERVICE_ROLE_KEY in backend secrets');
  let isServiceKey = key.startsWith('sb_secret_');
  if (!isServiceKey) {
    try { isServiceKey = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString()).role === 'service_role'; } catch { /* Not a legacy JWT. */ }
  }
  if (!isServiceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY must be a service-role JWT or secret API key, never an anon/publishable key');
  return { url, key };
}

export async function syncFeed(feed, { apply = false, env = process.env, fetchImpl = fetch, now } = {}) {
  const rows = validateFeed(feed, { now });
  if (!apply) return { mode: 'dry-run', count: rows.length };
  const { url, key } = backendConfig(env);
  const target = new URL('/rest/v1/products', url);
  target.searchParams.set('on_conflict', 'slug');
  const headers = {
    apikey: key,
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates,return=representation',
  };
  // New secret API keys authenticate via apikey; legacy JWTs also use Bearer.
  if (!key.startsWith('sb_secret_')) headers.Authorization = `Bearer ${key}`;
  let response;
  try {
    response = await fetchImpl(target, {
      method: 'POST',
      headers,
      body: JSON.stringify(rows),
      signal: AbortSignal.timeout(30000),
      redirect: 'error',
    });
  } catch {
    throw new Error('Supabase request failed; no result confirmed. Retry only after checking connectivity and database state.');
  }
  if (!response.ok) {
    throw new Error(`Supabase rejected the upsert (HTTP ${response.status}); no success claimed`);
  }
  let saved;
  try { saved = await response.json(); } catch { throw new Error('Supabase response could not be verified; check database state before retrying'); }
  if (!Array.isArray(saved) || saved.length !== rows.length
    || rows.some((row) => !saved.some((item) => item.slug === row.slug
      && item.price_vnd === row.price_vnd && Number(item.active_total_g) === row.active_total_g
      && Date.parse(item.last_checked_at) === Date.parse(row.last_checked_at)
      && item.is_sample === false && item.is_active === true))) {
    throw new Error('Supabase upsert result does not match the requested rows; check database state before retrying');
  }
  return { mode: 'applied', count: saved.length };
}

export function parseArgs(args) {
  const options = { file: 'data/product-feed.json', apply: false };
  let mode;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--file') {
      if (!args[index + 1] || args[index + 1].startsWith('--')) throw new Error('--file requires a path');
      options.file = args[++index];
    } else if (arg === '--apply' || arg === '--dry-run') {
      if (mode && mode !== arg) throw new Error('Choose either --apply or --dry-run');
      mode = arg;
      options.apply = arg === '--apply';
    } else if (arg === '--help') {
      options.help = true;
    } else {
      throw new Error('Unknown argument. Use --help for usage.');
    }
  }
  return options;
}

export async function main(args = process.argv.slice(2), { log = console.log, env = process.env } = {}) {
  const options = parseArgs(args);
  if (options.help) {
    log('Usage: node scripts/sync-prices.mjs [--file data/product-feed.json] [--dry-run | --apply]\nDefault: validate only. --apply requires backend Supabase secrets.');
    return;
  }
  let text;
  try { text = await readFile(options.file, 'utf8'); } catch {
    throw new Error('Product feed is missing or unreadable. Supply a current verified export with --file; no prices were updated.');
  }
  let feed;
  try { feed = JSON.parse(text); } catch { throw new Error('Product feed is not valid JSON; no prices were updated.'); }
  const result = await syncFeed(feed, { apply: options.apply, env });
  log(result.mode === 'dry-run'
    ? `DRY RUN: validated ${result.count} observations; database unchanged.`
    : `APPLIED: confirmed ${result.count} product upserts.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => { console.error(`Price sync stopped: ${error.message}`); process.exitCode = 1; });
}
