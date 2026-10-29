import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { parseArgs, syncFeed, validateFeed } from '../scripts/sync-prices.mjs';

const now = new Date('2026-10-30T10:00:00Z');
const serviceKey = `header.${Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url')}.signature`;
const env = { SUPABASE_URL: 'https://unit-test.supabase.co', SUPABASE_SERVICE_ROLE_KEY: serviceKey };

function feed() {
  return {
    schema_version: 1,
    is_sample: false,
    source: { kind: 'manual_verified', reference: 'test observation' },
    products: [{
      slug: 'verified-creatine-500g', name: 'Verified creatine 500g', brand: 'Test brand', category: 'creatine',
      price_vnd: 450000, active_total_g: 500,
      source_url: 'https://shopee.vn/product/123/456?tracking=removed',
      affiliate_url: 'https://s.shopee.vn/abcDEF1234',
      observed_at: '2026-10-30T16:00:00+07:00',
    }],
  };
}

test('validates real observation shape and preserves observation time rather than sync time', () => {
  const [row] = validateFeed(feed(), { now });
  assert.equal(row.last_checked_at, '2026-10-30T09:00:00.000Z');
  assert.equal(row.source_url, 'https://shopee.vn/product/123/456');
  assert.equal(row.affiliate_url, 'https://s.shopee.vn/abcDEF1234');
  assert.equal(row.is_sample, false);
  assert.equal(row.is_active, true);
  assert.equal(row.badge, null);
  assert.equal(row.cost_per_active_gram, undefined, 'database computes cost per gram');
});

test('dry-run needs no backend key and performs no request', async () => {
  const result = await syncFeed(feed(), {
    now, env: {}, fetchImpl() { assert.fail('dry-run must not access network'); },
  });
  assert.deepEqual(result, { mode: 'dry-run', count: 1 });
});

test('rejects sample, missing provenance and empty feeds', () => {
  for (const mutate of [
    (f) => { f.is_sample = true; },
    (f) => { delete f.is_sample; },
    (f) => { f.source = null; },
    (f) => { f.source.reference = ''; },
    (f) => { f.products = []; },
    (f) => { f.products[0].is_sample = true; },
  ]) {
    const candidate = feed(); mutate(candidate);
    assert.throws(() => validateFeed(candidate, { now }));
  }
});

test('rejects duplicate identity, invalid numeric data and unsupported categories', () => {
  for (const mutate of [
    (f) => { f.products.push({ ...f.products[0] }); },
    (f) => { f.products[0].slug = '../invalid'; },
    (f) => { f.products[0].brand = ''; },
    (f) => { f.products[0].price_vnd = 0; },
    (f) => { f.products[0].price_vnd = 450000.5; },
    (f) => { f.products[0].active_total_g = 0; },
    (f) => { f.products[0].active_total_g = '500'; },
    (f) => { f.products[0].active_total_g = 500.123; },
    (f) => { f.products[0].active_total_g = 0.0001; },
    (f) => { f.products[0].category = 'mass'; },
  ]) {
    const candidate = feed(); mutate(candidate);
    assert.throws(() => validateFeed(candidate, { now }));
  }
});

test('rejects stale, future and timezone-free observations', () => {
  for (const time of ['2026-10-28T09:59:59Z', '2026-10-30T10:00:01Z', '2026-10-30T09:00:00', 'yesterday']) {
    const candidate = feed(); candidate.products[0].observed_at = time;
    assert.throws(() => validateFeed(candidate, { now }), /observed_at/);
  }
});

test('accepts exact 48-hour boundary', () => {
  const candidate = feed(); candidate.products[0].observed_at = '2026-10-28T10:00:00Z';
  assert.equal(validateFeed(candidate, { now }).length, 1);
});

test('rejects calendar rollover rather than treating February 30 as March 2', () => {
  const candidate = feed(); candidate.products[0].observed_at = '2026-02-30T09:00:00Z';
  assert.throws(() => validateFeed(candidate, { now: new Date('2026-03-02T10:00:00Z') }), /calendar/);
});

test('rejects hostile, ordinary or fabricated affiliate URLs', () => {
  for (const link of [
    'javascript:alert(1)', 'http://s.shopee.vn/abcDEF1234',
    'https://evil.example/abcDEF1234', 'https://s.shopee.vn.evil.example/abcDEF1234',
    'https://s.shopee.vn@evil.example/abcDEF1234', 'https://user:password@s.shopee.vn/abcDEF1234',
    'https://s.shopee.vn/sub_id=fake', 'https://shopee.vn/product/123/456?sub_id=fake',
    'https://s.shopee.vn/abcDEF1234?sub_id=fake', 'https://s.shopee.vn:8443/abcDEF1234',
  ]) {
    const candidate = feed(); candidate.products[0].affiliate_url = link;
    assert.throws(() => validateFeed(candidate, { now }), /affiliate_url/);
  }
});

test('requires canonical product source rather than a generic shop or affiliate URL', () => {
  for (const link of ['https://shopee.vn/', 'https://shopee.vn/shop/123', 'https://s.shopee.vn/abcDEF1234', 'https://evil.example/product/123/456']) {
    const candidate = feed(); candidate.products[0].source_url = link;
    assert.throws(() => validateFeed(candidate, { now }), /source_url/);
  }
});

test('rejects an invalid later row before any database mutation', async () => {
  const candidate = feed(); candidate.products.push({ ...candidate.products[0], slug: 'another-product', price_vnd: -1 });
  let requests = 0;
  await assert.rejects(syncFeed(candidate, { now, apply: true, env, fetchImpl() { requests++; } }), /price_vnd/);
  assert.equal(requests, 0);
});

test('does not send backend key to arbitrary project URL or accept an anon key', async () => {
  for (const badEnv of [
    { ...env, SUPABASE_URL: 'http://unit-test.supabase.co' },
    { ...env, SUPABASE_URL: 'https://unit-test.supabase.co.evil.example' },
    { ...env, SUPABASE_URL: 'https://evil.example' },
    { ...env, SUPABASE_SERVICE_ROLE_KEY: '' },
    { ...env, SUPABASE_SERVICE_ROLE_KEY: 'public-anon-key' },
  ]) {
    await assert.rejects(syncFeed(feed(), {
      now, apply: true, env: badEnv, fetchImpl() { assert.fail('invalid config must not make requests'); },
    }));
  }
});

test('upserts validated rows over HTTP with service key and confirms representation', async (context) => {
  let requests = 0;
  const server = createServer(async (request, response) => {
    requests++;
    assert.equal(request.method, 'POST');
    assert.equal(request.url, '/rest/v1/products?on_conflict=slug');
    assert.equal(request.headers.apikey, serviceKey);
    assert.equal(request.headers.authorization, `Bearer ${serviceKey}`);
    assert.equal(request.headers.prefer, 'resolution=merge-duplicates,return=representation');
    let body = ''; for await (const chunk of request) body += chunk;
    const rows = JSON.parse(body);
    assert.equal(rows[0].is_sample, false);
    assert.equal(rows[0].last_checked_at, '2026-10-30T09:00:00.000Z');
    response.writeHead(201, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify(rows));
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  context.after(() => new Promise((resolve) => server.close(resolve)));
  const fetchImpl = (url, options) => {
    const local = new URL(url);
    assert.equal(local.origin, 'https://unit-test.supabase.co');
    local.protocol = 'http:'; local.hostname = '127.0.0.1'; local.port = String(server.address().port);
    return fetch(local, options);
  };
  const result = await syncFeed(feed(), { now, apply: true, env, fetchImpl });
  assert.deepEqual(result, { mode: 'applied', count: 1 });
  assert.equal(requests, 1);
});

test('new secret API key is sent via apikey without invalid Bearer authentication', async () => {
  const candidateEnv = { ...env, SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_unit_test_not_real' };
  await syncFeed(feed(), { now, apply: true, env: candidateEnv, fetchImpl: async (_url, options) => {
    assert.equal(options.headers.Authorization, undefined);
    assert.equal(options.headers.apikey, candidateEnv.SUPABASE_SERVICE_ROLE_KEY);
    return new Response(options.body, { status: 201 });
  } });
});

test('remote errors, unknown outcomes and mismatching results never claim success or leak the response', async () => {
  for (const response of [
    new Response('confidential remote error content', { status: 403 }),
    new Response('[]', { status: 201 }),
    new Response('not json', { status: 201 }),
  ]) {
    await assert.rejects(syncFeed(feed(), { now, apply: true, env, fetchImpl: async () => response }), (error) => {
      assert.ok(!error.message.includes('confidential'));
      assert.ok(!error.message.includes(serviceKey));
      return true;
    });
  }
  await assert.rejects(syncFeed(feed(), { now, apply: true, env, fetchImpl: async () => { throw new Error(serviceKey); } }), (error) => {
    assert.ok(!error.message.includes(serviceKey)); return true;
  });
});

test('CLI defaults to dry-run and rejects conflicting write modes', () => {
  assert.deepEqual(parseArgs([]), { file: 'data/product-feed.json', apply: false });
  assert.deepEqual(parseArgs(['--file', 'verified.json', '--apply']), { file: 'verified.json', apply: true });
  assert.throws(() => parseArgs(['--apply', '--dry-run']));
  assert.throws(() => parseArgs(['--file']));
});
