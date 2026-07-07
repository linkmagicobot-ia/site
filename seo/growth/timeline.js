/**
 * seo/growth/timeline.js — Histórico e Timeline (V5)
 * 
 * Armazena snapshots em memória para gerar gráficos de evolução.
 * Caso não existam snapshots suficientes, retorna "Dados insuficientes".
 * NUNCA inventa valores.
 */

'use strict';

const google = require('../search-console/index');
const cache = require('../cache');

const CACHE_TTL = 30 * 60 * 1000;
const snapshots = [];

/**
 * Captura snapshot atual
 */
async function captureSnapshot() {
  try {
    const [s7, s30, s90] = await Promise.all([
      google.getSummary('7d'),
      google.getSummary('30d'),
      google.getSummary('90d')
    ]);

    const snap = {
      timestamp: new Date().toISOString(),
      '7d': { impressions: s7.impressions || 0, clicks: s7.clicks || 0, ctr: s7.ctr || 0, position: s7.position || 0 },
      '30d': { impressions: s30.impressions || 0, clicks: s30.clicks || 0, ctr: s30.ctr || 0, position: s30.position || 0 },
      '90d': { impressions: s90.impressions || 0, clicks: s90.clicks || 0, ctr: s90.ctr || 0, position: s90.position || 0 }
    };

    snapshots.push(snap);
    if (snapshots.length > 100) snapshots.shift(); // LRU

    console.log(`[SEO-GROWTH-V5] Timeline → snapshot capturado (total: ${snapshots.length})`);
    return snap;
  } catch (e) {
    console.error(`[SEO-GROWTH-V5] Timeline Snapshot Error → ${e.message}`);
    return null;
  }
}

/**
 * Retorna timeline com todos os snapshots
 */
async function getTimeline() {
  const cacheKey = 'growth_timeline';

  try {
    return await cache.getOrFetch(cacheKey, CACHE_TTL, async () => {
      // Capturar snapshot atual se não temos nenhum recente
      if (snapshots.length === 0 || (Date.now() - new Date(snapshots[snapshots.length - 1].timestamp).getTime()) > CACHE_TTL) {
        await captureSnapshot();
      }

      if (snapshots.length < 2) {
        return {
          snapshots: snapshots,
          total: snapshots.length,
          sufficient: false,
          message: 'Dados insuficientes. Snapshots são capturados automaticamente a cada visita ao painel.',
          metrics: ['impressions', 'clicks', 'ctr', 'position'],
          generatedAt: new Date().toISOString()
        };
      }

      // Gerar séries para gráfico
      const series = {
        labels: snapshots.map(s => s.timestamp),
        impressions: snapshots.map(s => s['7d'].impressions),
        clicks: snapshots.map(s => s['7d'].clicks),
        ctr: snapshots.map(s => s['7d'].ctr),
        position: snapshots.map(s => s['7d'].position)
      };

      return {
        snapshots,
        series,
        total: snapshots.length,
        sufficient: true,
        metrics: ['impressions', 'clicks', 'ctr', 'position'],
        generatedAt: new Date().toISOString()
      };
    });
  } catch (e) {
    console.error(`[SEO-GROWTH-V5] Timeline Error → ${e.message}`);
    return { snapshots: [], total: 0, sufficient: false, error: true, message: e.message };
  }
}

module.exports = { getTimeline, captureSnapshot };
