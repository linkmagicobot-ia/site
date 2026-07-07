/**
 * seo/gos/opportunities.js — Opportunity Engine + Future Opportunities (benchmark placeholder)
 */
'use strict';

const recommend = require('../growth/recommend');
const roi = require('./roi');
const cache = require('../cache');
const CACHE_TTL = 30 * 60 * 1000;

/**
 * Analisa TODAS as páginas e gera score de oportunidade
 */
async function analyzeAll() {
  const cacheKey = 'gos_opportunities';
  try {
    return await cache.getOrFetch(cacheKey, CACHE_TTL, async () => {
      console.log('[GOS] Opportunities → analisando páginas...');
      const recAll = await recommend.analyzeAll();
      const pages = (recAll.pages || []).map(p => {
        const oppScore = roi.opportunityScore({
          position: p.position || 50, ctr: p.ctr || 0, impressions: p.impressions || 0,
          clicks: p.clicks || 0, internalLinks: p.internalLinksCount || 0, backlinks: 0
        });
        return {
          page: p.page, seoScore: p.totalScore || 0, opportunityScore: oppScore.score, opportunityLevel: oppScore.level,
          position: p.position || null, impressions: p.impressions || 0, ctr: p.ctr || 0, clicks: p.clicks || 0,
          recommendations: p.recommendations || []
        };
      });
      pages.sort((a, b) => b.opportunityScore - a.opportunityScore);
      console.log(`[GOS] Opportunities → ${pages.length} páginas analisadas`);
      return { pages, total: pages.length, generatedAt: new Date().toISOString() };
    });
  } catch (e) {
    return { pages: [], total: 0, error: true, message: e.message };
  }
}

/**
 * Future Opportunities — estrutura para benchmark, gaps (sem APIs externas)
 */
function getFutureOpportunities() {
  return {
    benchmark: { status: 'planned', note: 'Disponível em versões futuras.' },
    keywordsGap: { status: 'planned', note: 'Análise de keywords gap estará disponível quando conectar dados de concorrentes.' },
    contentGap: { status: 'planned', note: 'Análise de content gap estará disponível quando conectar dados de concorrentes.' },
    backlinkGap: { status: 'planned', note: 'Análise de backlink gap estará disponível quando conectar dados de concorrentes.' },
    generatedAt: new Date().toISOString()
  };
}

module.exports = { analyzeAll, getFutureOpportunities };
