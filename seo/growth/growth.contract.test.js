/**
 * seo/growth/growth.contract.test.js — Testes de contrato V2.1
 * 
 * Valida formato de retorno de TODAS as funções Growth,
 * MESMO SEM credenciais configuradas.
 */

'use strict';

const quickWins = require('./quick-wins');
const recommend = require('./recommend');
const internalLinks = require('./internal-links');
const backlinks = require('./backlinks');
const trends = require('./trends');

let passed = 0;
let failed = 0;
const errors = [];

function assert(condition, testName) {
  if (condition) { passed++; console.log(`  ✅ ${testName}`); }
  else { failed++; errors.push(testName); console.log(`  ❌ ${testName}`); }
}

function isObject(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }
function isNumber(v) { return typeof v === 'number' && !isNaN(v); }
function isString(v) { return typeof v === 'string'; }
function isArray(v) { return Array.isArray(v); }

async function runTests() {
  console.log('\n📋 SEO Growth V2.1 — Testes de Contrato\n');

  // ===== QUICK WINS =====
  console.log('🎯 Quick Wins');
  const qw = await quickWins.analyze();
  assert(isObject(qw), 'retorna objeto');
  assert(isArray(qw.opportunities), 'opportunities é array');
  assert(isNumber(qw.total), 'total é number');
  assert(isObject(qw.criteria), 'criteria é objeto');
  assert(isString(qw.generatedAt), 'generatedAt é string');
  assert(qw.opportunities !== undefined, 'opportunities nunca undefined');
  if (qw.opportunities.length > 0) {
    const opp = qw.opportunities[0];
    assert(isString(opp.query), 'opp.query é string');
    assert(isNumber(opp.position), 'opp.position é number');
    assert(isNumber(opp.score), 'opp.score é number');
    assert(isString(opp.priority), 'opp.priority é string');
    assert(isString(opp.justification), 'opp.justification é string');
  }

  // ===== RECOMMENDATIONS (single page) =====
  console.log('\n📊 Recommendations (single page)');
  const rec = await recommend.analyzePage('/');
  assert(isObject(rec), 'retorna objeto');
  if (!rec.error) {
    assert(isObject(rec.scores), 'scores é objeto');
    assert(isNumber(rec.scores.overall), 'scores.overall é number');
    assert(isNumber(rec.scores.title), 'scores.title é number');
    assert(isNumber(rec.scores.schema), 'scores.schema é number');
    assert(isArray(rec.recommendations), 'recommendations é array');
    assert(isNumber(rec.totalRecommendations), 'totalRecommendations é number');
    assert(isObject(rec.details), 'details é objeto');
    if (rec.recommendations.length > 0) {
      const r = rec.recommendations[0];
      assert(isString(r.category), 'rec.category é string');
      assert(isString(r.severity), 'rec.severity é string');
      assert(isString(r.message), 'rec.message é string');
    }
  } else {
    console.log('  ⚠️ Página / não encontrada localmente — pulando checks de scores');
  }

  // ===== RECOMMENDATIONS (all) =====
  console.log('\n📊 Recommendations (all)');
  const recAll = await recommend.analyzeAll();
  assert(isObject(recAll), 'retorna objeto');
  assert(isArray(recAll.pages), 'pages é array');
  assert(isNumber(recAll.total), 'total é number');
  assert(isNumber(recAll.averageScore), 'averageScore é number');

  // ===== INTERNAL LINKS =====
  console.log('\n🔗 Internal Links');
  const il = await internalLinks.analyze();
  assert(isObject(il), 'retorna objeto');
  assert(isArray(il.linkMap), 'linkMap é array');
  assert(isArray(il.suggestions), 'suggestions é array');
  assert(isArray(il.orphanPages), 'orphanPages é array');
  assert(isArray(il.isolatedPages), 'isolatedPages é array');
  assert(isArray(il.overlinkedPages), 'overlinkedPages é array');
  assert(isArray(il.disconnectedClusters), 'disconnectedClusters é array');
  assert(isObject(il.stats), 'stats é objeto');
  if (il.stats.totalPages) {
    assert(isNumber(il.stats.totalPages), 'stats.totalPages é number');
    assert(isNumber(il.stats.totalLinks), 'stats.totalLinks é number');
    assert(isNumber(il.stats.avgLinksPerPage), 'stats.avgLinksPerPage é number');
  }
  if (il.suggestions.length > 0) {
    const s = il.suggestions[0];
    assert(isString(s.target), 'suggestion.target é string');
    assert(isArray(s.sources), 'suggestion.sources é array');
    assert(isString(s.priority), 'suggestion.priority é string');
  }

  // ===== BACKLINKS =====
  console.log('\n🔗 Backlinks Report');
  const bl = await backlinks.generateReport();
  assert(isObject(bl), 'retorna objeto');
  assert(isObject(bl.current), 'current é objeto');
  assert(isNumber(bl.current.total), 'current.total é number');
  assert(isArray(bl.current.domains), 'current.domains é array');
  assert(isArray(bl.opportunities), 'opportunities é array');
  assert(isArray(bl.actions), 'actions é array');
  if (bl.opportunities.length > 0) {
    const o = bl.opportunities[0];
    assert(isString(o.type), 'opp.type é string');
    assert(isString(o.name), 'opp.name é string');
    assert(isString(o.effort), 'opp.effort é string');
    assert(isString(o.impact), 'opp.impact é string');
  }

  // ===== TRENDS =====
  console.log('\n📈 Trends');
  const tr = await trends.analyze();
  assert(isObject(tr), 'retorna objeto');
  assert(isObject(tr.periods), 'periods é objeto');
  assert(isObject(tr.trends), 'trends é objeto');
  assert(isArray(tr.insights), 'insights é array');
  if (tr.trends.impressions) {
    assert(isString(tr.trends.impressions.direction), 'trends.impressions.direction é string');
    assert(isString(tr.trends.impressions.status), 'trends.impressions.status é string');
  }

  // ===== NENHUM HTML =====
  console.log('\n🚫 Nenhum retorno contém HTML');
  const allResults = [qw, rec, recAll, il, bl, tr];
  allResults.forEach((r, i) => {
    const json = JSON.stringify(r);
    assert(!json.includes('<html'), `resultado[${i}] não contém <html`);
    assert(!json.includes('<div'), `resultado[${i}] não contém <div`);
  });

  // ===== RESULTADO =====
  console.log('\n' + '═'.repeat(50));
  console.log(`\n📊 Resultado: ${passed} passed, ${failed} failed\n`);
  if (errors.length > 0) { console.log('❌ Falhas:'); errors.forEach(e => console.log(`   - ${e}`)); }
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(e => { console.error('\n💥 Erro fatal:', e.message); process.exit(1); });
