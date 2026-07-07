/**
 * seo/growth/trends.js — Evolução temporal e tendências (V2.1)
 * 
 * Compara métricas entre períodos para gerar indicadores ▲▼▬.
 * 
 * REGRAS:
 * - Logs iniciam com [SEO-GROWTH]
 * - Retorna exclusivamente JSON
 */

'use strict';

const google = require('../search-console/index');
const cache = require('../cache');

const CACHE_TTL = 60 * 60 * 1000; // 1h

/**
 * Calcula direção da tendência
 */
function getTrend(current, previous) {
  if (previous === 0 && current === 0) return { direction: '▬', change: '0%', status: 'stable' };
  if (previous === 0 && current > 0) return { direction: '▲', change: '+∞', status: 'improving' };
  if (current === 0 && previous > 0) return { direction: '▼', change: '-100%', status: 'declining' };

  const diff = current - previous;
  const pct = ((diff / previous) * 100).toFixed(1);
  const sign = diff >= 0 ? '+' : '';

  if (Math.abs(diff / previous) < 0.05) {
    return { direction: '▬', change: `${sign}${pct}%`, status: 'stable' };
  }

  return {
    direction: diff > 0 ? '▲' : '▼',
    change: `${sign}${pct}%`,
    status: diff > 0 ? 'improving' : 'declining'
  };
}

/**
 * Para posição, menor é melhor (inverte a lógica)
 */
function getPositionTrend(current, previous) {
  if (previous === 0 && current === 0) return { direction: '▬', change: '0', status: 'stable' };
  if (previous === 0) return { direction: '▬', change: 'N/A', status: 'new' };

  const diff = current - previous;

  if (Math.abs(diff) < 0.5) {
    return { direction: '▬', change: `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}`, status: 'stable' };
  }

  // Para posição: negativo = melhorando (subindo no ranking)
  return {
    direction: diff < 0 ? '▲' : '▼',
    change: `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}`,
    status: diff < 0 ? 'improving' : 'declining'
  };
}

/**
 * Gera análise de tendências comparando 7d vs 30d vs 90d
 */
async function analyze() {
  const cacheKey = 'growth_trends';

  try {
    return await cache.getOrFetch(cacheKey, CACHE_TTL, async () => {
      console.log('[SEO-GROWTH] Trends → comparando períodos...');

      const [s7, s30, s90] = await Promise.all([
        google.getSummary('7d'),
        google.getSummary('30d'),
        google.getSummary('90d')
      ]);

      const periods = {
        '7d': { impressions: s7.impressions || 0, clicks: s7.clicks || 0, ctr: s7.ctr || 0, position: s7.position || 0 },
        '30d': { impressions: s30.impressions || 0, clicks: s30.clicks || 0, ctr: s30.ctr || 0, position: s30.position || 0 },
        '90d': { impressions: s90.impressions || 0, clicks: s90.clicks || 0, ctr: s90.ctr || 0, position: s90.position || 0 }
      };

      // Tendências: comparar 7d recente vs proporção equivalente do 30d
      // Se 30d = 24 impressões, então média por 7d seria ~5.6
      const avg7dFrom30d = {
        impressions: periods['30d'].impressions > 0 ? parseFloat((periods['30d'].impressions / 4.3).toFixed(1)) : 0,
        clicks: periods['30d'].clicks > 0 ? parseFloat((periods['30d'].clicks / 4.3).toFixed(1)) : 0,
        ctr: periods['30d'].ctr,
        position: periods['30d'].position
      };

      const trends = {
        impressions: getTrend(periods['7d'].impressions, avg7dFrom30d.impressions),
        clicks: getTrend(periods['7d'].clicks, avg7dFrom30d.clicks),
        ctr: getTrend(periods['7d'].ctr, avg7dFrom30d.ctr),
        position: getPositionTrend(periods['7d'].position, avg7dFrom30d.position)
      };

      // Gerar insight textual
      const insights = generateInsights(periods, trends);

      console.log(`[SEO-GROWTH] Trends → impressions ${trends.impressions.direction} clicks ${trends.clicks.direction} ctr ${trends.ctr.direction} position ${trends.position.direction}`);

      return {
        periods,
        trends,
        insights,
        analyzedAt: new Date().toISOString()
      };
    });
  } catch (e) {
    console.error(`[SEO-GROWTH] Trends Error → ${e.message}`);
    return { periods: {}, trends: {}, insights: [], error: true, message: e.message };
  }
}

/**
 * Gera insights em português
 */
function generateInsights(periods, trends) {
  const insights = [];

  if (trends.impressions.status === 'improving') {
    insights.push({ type: 'positive', message: `Impressões crescendo (${trends.impressions.change}) — o Google está indexando mais páginas` });
  }

  if (trends.position.status === 'improving') {
    insights.push({ type: 'positive', message: `Posição média melhorando (${trends.position.change}) — conteúdo ganhando relevância` });
  }

  if (trends.ctr.status === 'declining') {
    insights.push({ type: 'warning', message: `CTR em queda (${trends.ctr.change}) — revisar titles e meta descriptions` });
  }

  if (periods['7d'].impressions === 0 && periods['30d'].impressions > 0) {
    insights.push({ type: 'warning', message: 'Nenhuma impressão nos últimos 7 dias — verificar indexação' });
  }

  if (periods['30d'].impressions > 0 && periods['30d'].clicks === 0) {
    insights.push({ type: 'info', message: 'Impressões sem cliques — melhorar titles e descriptions pode aumentar CTR' });
  }

  if (periods['90d'].impressions < 50) {
    insights.push({ type: 'info', message: 'Volume de impressões ainda baixo — normal para sites com menos de 3 meses de SEO ativo' });
  }

  return insights;
}

module.exports = { analyze };
