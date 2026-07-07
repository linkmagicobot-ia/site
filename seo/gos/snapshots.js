/**
 * seo/gos/snapshots.js — Timeline + SEO Score Evolution
 * Captura snapshots em memória. Nunca inventa dados.
 */
'use strict';

const google = require('../search-console/index');
const cache = require('../cache');
const CACHE_TTL = 30 * 60 * 1000;
const snapshots = [];

async function capture() {
  try {
    const [s7, s30] = await Promise.all([google.getSummary('7d'), google.getSummary('30d')]);
    const snap = {
      ts: new Date().toISOString(),
      impressions: s7.impressions || 0, clicks: s7.clicks || 0, ctr: s7.ctr || 0, position: s7.position || 0,
      impressions30: s30.impressions || 0, clicks30: s30.clicks || 0
    };
    snapshots.push(snap);
    if (snapshots.length > 100) snapshots.shift();
    console.log(`[GOS] Snapshot capturado (total: ${snapshots.length})`);
    return snap;
  } catch (e) {
    console.error(`[GOS] Snapshot Error → ${e.message}`);
    return null;
  }
}

async function getTimeline() {
  try {
    if (snapshots.length === 0 || (Date.now() - new Date(snapshots[snapshots.length - 1].ts).getTime() > CACHE_TTL)) {
      await capture();
    }
    if (snapshots.length < 2) {
      return { snapshots, total: snapshots.length, sufficient: false, message: 'Dados insuficientes. Snapshots são capturados a cada visita.', generatedAt: new Date().toISOString() };
    }
    return {
      snapshots,
      series: { labels: snapshots.map(s => s.ts), impressions: snapshots.map(s => s.impressions), clicks: snapshots.map(s => s.clicks), ctr: snapshots.map(s => s.ctr), position: snapshots.map(s => s.position) },
      total: snapshots.length, sufficient: true, generatedAt: new Date().toISOString()
    };
  } catch (e) {
    return { snapshots: [], total: 0, sufficient: false, error: true, message: e.message };
  }
}

/**
 * SEO Score Evolution — armazena healthScores ao longo do tempo
 */
const healthHistory = [];

function recordHealthScore(score) {
  healthHistory.push({ ts: new Date().toISOString(), score });
  if (healthHistory.length > 100) healthHistory.shift();
}

function getHealthEvolution() {
  if (healthHistory.length < 2) {
    return { history: healthHistory, sufficient: false, message: 'Dados insuficientes.', generatedAt: new Date().toISOString() };
  }
  return { history: healthHistory, sufficient: true, trend: healthHistory[healthHistory.length - 1].score >= healthHistory[0].score ? 'up' : 'down', generatedAt: new Date().toISOString() };
}

module.exports = { capture, getTimeline, recordHealthScore, getHealthEvolution };
