/**
 * seo/gos/telemetry.js — GOS Telemetry (nunca dados sensíveis)
 */
'use strict';

const stats = { queries: 0, cacheHits: 0, cacheMisses: 0, missionsCompleted: 0, recommendations: 0, errors: 0, startedAt: new Date().toISOString() };

function track(event, data) {
  stats.queries++;
  if (event === 'cache_hit') stats.cacheHits++;
  if (event === 'cache_miss') stats.cacheMisses++;
  if (event === 'mission_complete') stats.missionsCompleted++;
  if (event === 'recommendation') stats.recommendations++;
  if (event === 'error') stats.errors++;
}

function getStats() {
  return {
    ...stats,
    uptime: Math.round((Date.now() - new Date(stats.startedAt).getTime()) / 60000) + ' min',
    cacheRatio: stats.queries > 0 ? Math.round((stats.cacheHits / stats.queries) * 100) + '%' : '0%'
  };
}

function reset() { Object.keys(stats).forEach(k => { if (typeof stats[k] === 'number') stats[k] = 0; }); stats.startedAt = new Date().toISOString(); }

module.exports = { track, getStats, reset };
