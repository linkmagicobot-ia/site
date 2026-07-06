/**
 * seo/seo-provider.contract.test.js — Testes de contrato SEOProvider v1
 * 
 * Valida que TODAS as funções do contrato retornam o formato correto,
 * MESMO SEM credenciais configuradas.
 * 
 * Executar: node seo/seo-provider.contract.test.js
 */

'use strict';

const google = require('./search-console/index');
const bing = require('./bing/index');
const config = require('./config');

let passed = 0;
let failed = 0;
const errors = [];

function assert(condition, testName) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${testName}`);
  } else {
    failed++;
    errors.push(testName);
    console.log(`  ❌ ${testName}`);
  }
}

function isObject(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }
function isNumber(v) { return typeof v === 'number' && !isNaN(v); }
function isString(v) { return typeof v === 'string'; }
function isArray(v) { return Array.isArray(v); }

async function runTests() {
  console.log('\n📋 SEOProvider v1 — Testes de Contrato\n');

  // ===== CONFIG =====
  console.log('🔧 Config');
  assert(isString(config.PROVIDER_VERSION), 'PROVIDER_VERSION é string');
  assert(config.PROVIDER_VERSION === 'v1', 'PROVIDER_VERSION é v1');
  assert(isString(config.SITE_URL), 'SITE_URL é string');
  assert(isNumber(config.REQUEST_TIMEOUT), 'REQUEST_TIMEOUT é number');
  assert(isNumber(config.RETRIES), 'RETRIES é number');
  assert(isObject(config.CACHE_TTL), 'CACHE_TTL é object');
  assert(isNumber(config.CACHE_TTL.summary), 'CACHE_TTL.summary é number');
  assert(isNumber(config.CACHE_TTL.backlinks), 'CACHE_TTL.backlinks é number');
  assert(typeof config.periodToDays === 'function', 'periodToDays é function');
  assert(config.periodToDays('7d') === 7, 'periodToDays(7d) === 7');
  assert(config.periodToDays('30d') === 30, 'periodToDays(30d) === 30');
  assert(config.periodToDays('90d') === 90, 'periodToDays(90d) === 90');

  // ===== GOOGLE STATUS =====
  console.log('\n🔍 Google getStatus()');
  const gStatus = google.getStatus();
  assert(isObject(gStatus), 'retorna objeto');
  assert(isString(gStatus.status), 'status é string');
  assert(isString(gStatus.message), 'message é string');
  assert(gStatus.status !== undefined, 'status nunca undefined');
  assert(gStatus.message !== undefined, 'message nunca undefined');

  // ===== GOOGLE getSummary =====
  console.log('\n📊 Google getSummary()');
  const summary = await google.getSummary('30d');
  assert(isObject(summary), 'retorna objeto');
  assert(isNumber(summary.impressions), 'impressions é number');
  assert(isNumber(summary.clicks), 'clicks é number');
  assert(isNumber(summary.ctr), 'ctr é number');
  assert(isNumber(summary.position), 'position é number');
  assert(isString(summary.period), 'period é string');
  assert(summary.impressions !== undefined, 'impressions nunca undefined');
  assert(summary.clicks !== undefined, 'clicks nunca undefined');
  assert(typeof summary !== 'string', 'nunca retorna string');

  // ===== GOOGLE getQueries =====
  console.log('\n🔎 Google getQueries()');
  const queries = await google.getQueries('30d');
  assert(isObject(queries), 'retorna objeto');
  assert(isArray(queries.rows), 'rows é array');
  assert(isNumber(queries.total), 'total é number');
  assert(queries.rows !== undefined, 'rows nunca undefined');
  assert(queries.total !== undefined, 'total nunca undefined');

  // ===== GOOGLE getPages =====
  console.log('\n📄 Google getPages()');
  const pages = await google.getPages('30d');
  assert(isObject(pages), 'retorna objeto');
  assert(isArray(pages.rows), 'rows é array');
  assert(isNumber(pages.total), 'total é number');

  // ===== GOOGLE getDevices =====
  console.log('\n📱 Google getDevices()');
  const devices = await google.getDevices('30d');
  assert(isObject(devices), 'retorna objeto');
  assert(isArray(devices.rows), 'rows é array');

  // ===== GOOGLE getCountries =====
  console.log('\n🌍 Google getCountries()');
  const countries = await google.getCountries('30d');
  assert(isObject(countries), 'retorna objeto');
  assert(isArray(countries.rows), 'rows é array');

  // ===== BING STATUS =====
  console.log('\n🔍 Bing getStatus()');
  const bStatus = bing.getStatus();
  assert(isObject(bStatus), 'retorna objeto');
  assert(isString(bStatus.status), 'status é string');
  assert(isString(bStatus.message), 'message é string');

  // ===== BING getBacklinks =====
  console.log('\n🔗 Bing getBacklinks()');
  const backlinks = await bing.getBacklinks();
  assert(isObject(backlinks), 'retorna objeto');
  assert(isNumber(backlinks.total), 'total é number');
  assert(isArray(backlinks.domains), 'domains é array');
  assert(backlinks.total !== undefined, 'total nunca undefined');
  assert(backlinks.domains !== undefined, 'domains nunca undefined');

  // ===== NENHUM RETORNO É HTML =====
  console.log('\n🚫 Nenhum retorno contém HTML');
  const allResults = [gStatus, summary, queries, pages, devices, countries, bStatus, backlinks];
  allResults.forEach((r, i) => {
    const json = JSON.stringify(r);
    assert(!json.includes('<html'), `resultado[${i}] não contém <html`);
    assert(!json.includes('<div'), `resultado[${i}] não contém <div`);
    assert(!json.includes('<table'), `resultado[${i}] não contém <table`);
  });

  // ===== RESULTADO =====
  console.log('\n' + '═'.repeat(50));
  console.log(`\n📊 Resultado: ${passed} passed, ${failed} failed\n`);

  if (errors.length > 0) {
    console.log('❌ Falhas:');
    errors.forEach(e => console.log(`   - ${e}`));
    console.log('');
  }

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(e => {
  console.error('\n💥 Erro fatal no teste:', e.message);
  process.exit(1);
});
