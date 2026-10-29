import test from 'node:test';
import assert from 'node:assert/strict';
import { loadCatalog, normalizeCatalog, priceIsFresh, safeAffiliateUrl } from '../src/lib/catalog.js';
import { fallbackProducts } from '../src/data/fallbackProducts.js';

function row(overrides = {}) {
  return { slug: 'test-creatine', name: 'Test Creatine', brand: 'Test', category: 'creatine', price_vnd: 450000,
    active_total_g: '500', affiliate_url: 'https://s.shopee.vn/valid123', is_sample: false,
    last_checked_at: new Date(Date.now() - 60_000).toISOString(), ...overrides };
}

test('sample catalog never exposes a purchase link or claims a real observation', () => {
  const samples = Object.values(fallbackProducts).flat();
  assert.equal(samples.length, 30);
  assert.equal(new Set(samples.map((item) => item.slug)).size, 30);
  for (const sample of samples) {
    assert.equal(sample.isSample, true);
    assert.equal(sample.url, null);
    assert.equal(sample.lastCheckedAt, null);
  }
});

test('database rows are independently validated, deduplicated and sorted by active gram', () => {
  const items = normalizeCatalog([
    row({ slug: 'expensive', price_vnd: 600000 }),
    row({ slug: 'cheap' }),
    row({ slug: 'cheap' }),
    row({ slug: 'sample', is_sample: true }),
    row({ slug: 'negative', price_vnd: -1 }),
    row({ slug: 'zero-grams', active_total_g: 0 }),
    row({ slug: 'wrong-category', category: 'whey' }),
    row({ slug: 'no-date', last_checked_at: null }),
    row({ slug: 'future', last_checked_at: '2100-01-01T00:00:00Z' }),
  ], 'creatine');
  assert.deepEqual(items.map((item) => item.slug), ['cheap', 'expensive']);
  assert.deepEqual(items.map((item) => item.costPerGram), [900, 1200]);
  assert.throws(() => normalizeCatalog(null, 'creatine'), /Invalid catalog/);
});

test('malicious URLs, non-HTTPS links and old fake affiliate paths are never clickable', () => {
  for (const url of ['javascript:alert(1)', 'https://shopee.vn.evil.test/item', 'http://shopee.vn/item',
    'https://user@shopee.vn/item', 'https://s.shopee.vn/sub_id=fake', 'https://s.shopee.vn/', null]) {
    assert.equal(safeAffiliateUrl(url), null);
  }
  assert.equal(safeAffiliateUrl('https://s.shopee.vn/abc123'), 'https://s.shopee.vn/abc123');
  assert.equal(normalizeCatalog([row({ affiliate_url: 'javascript:bad' })], 'creatine')[0].url, null);
});

test('prices older than 48 hours and invalid/future observations lose purchase freshness', () => {
  const now = Date.parse('2026-10-30T10:00:00Z');
  assert.equal(priceIsFresh('2026-10-29T10:00:00Z', now), true);
  assert.equal(priceIsFresh('2026-10-27T10:00:00Z', now), false);
  assert.equal(priceIsFresh('2026-10-31T10:00:00Z', now), false);
  assert.equal(priceIsFresh(null, now), false);
});

test('catalog request passes category/provenance filters and abort signal; rejects remote errors', async () => {
  const filters = [];
  const signal = new AbortController().signal;
  let response = { data: [row()], error: null };
  const query = {
    select: () => query,
    eq: (column, value) => { filters.push([column, value]); return query; },
    order: () => query,
    abortSignal: (received) => { assert.equal(received, signal); return Promise.resolve(response); },
  };
  const client = { from: (table) => { assert.equal(table, 'products'); return query; } };
  assert.equal((await loadCatalog(client, 'creatine', signal)).length, 1);
  assert.deepEqual(filters, [['category', 'creatine'], ['is_active', true], ['is_sample', false]]);
  response = { data: null, error: { message: 'database unavailable' } };
  await assert.rejects(loadCatalog(client, 'creatine', signal), /Catalog unavailable/);
});
