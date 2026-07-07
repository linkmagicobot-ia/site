/**
 * seo/gos/scoring.js — Growth Score (diferente do SEO Health)
 * Mede EXECUÇÃO e POTENCIAL, não saúde.
 */
'use strict';
const cache = require('../cache');
const CACHE_TTL = 30 * 60 * 1000;

function calculate(data) {
  const d = data || {};
  let score = 0, total = 0;

  // Missões concluídas vs total (peso 20)
  const mDone = d.missionsCompleted || 0, mTotal = d.missionsTotal || 1;
  const mRatio = Math.min(1, mDone / Math.max(1, mTotal));
  score += mRatio * 20; total += 20;

  // Páginas no Top 10 (peso 20)
  const nearP1 = d.nearPage1 || 0;
  score += Math.min(1, nearP1 / 5) * 20; total += 20;

  // CTR médio (peso 15) — acima de 5% é bom
  const ctr = d.ctr || 0;
  score += Math.min(1, ctr / 5) * 15; total += 15;

  // Links internos sem órfãs (peso 10)
  const orphans = d.orphanPages || 0;
  score += (orphans === 0 ? 1 : Math.max(0, 1 - orphans / 10)) * 10; total += 10;

  // Clusters conectados (peso 10)
  const clusters = d.incompleteClusters || 0;
  score += (clusters === 0 ? 1 : Math.max(0, 1 - clusters / 5)) * 10; total += 10;

  // Backlinks (peso 10)
  const blDone = d.backlinksAcquired || 0, blTarget = d.backlinksRecommended || 1;
  score += Math.min(1, blDone / Math.max(1, blTarget)) * 10; total += 10;

  // Score SEO médio (peso 15) — acima de 75 é bom
  const seoAvg = d.averageScore || 0;
  score += Math.min(1, seoAvg / 75) * 15; total += 15;

  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  return { score: pct, total: 100 };
}

function project(current, missionsToComplete) {
  const n = missionsToComplete || 3;
  // Each completed mission adds ~2-3% growth score
  const projected = Math.min(100, current + (n * 2.5));
  return { current, projected: Math.round(projected), missionsNeeded: n };
}

function getLearningMetrics(missionHistory) {
  const h = missionHistory || [];
  if (h.length === 0) return { created: 0, completed: 0, executionRate: '0%', avgTime: '—', avgROI: '—' };

  const completed = h.filter(m => m.status === 'Concluída');
  const avgTime = completed.length > 0
    ? Math.round(completed.reduce((s, m) => s + (parseInt(m.estimatedTime) || 20), 0) / completed.length) + ' min'
    : '—';

  return {
    created: h.length,
    completed: completed.length,
    executionRate: h.length > 0 ? Math.round((completed.length / h.length) * 100) + '%' : '0%',
    avgTime,
    avgROI: completed.length > 0 ? 'Médio' : '—'
  };
}

module.exports = { calculate, project, getLearningMetrics };
