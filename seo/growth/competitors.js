/**
 * seo/growth/competitors.js — Benchmark de Concorrentes (V5)
 * 
 * Arquitetura preparada para futuro.
 * NÃO consulta APIs externas, NÃO faz scraping.
 * Utiliza apenas placeholders com dados do próprio domínio.
 */

'use strict';

const cache = require('../cache');
const internalLinks = require('./internal-links');
const recommend = require('./recommend');

const CACHE_TTL = 30 * 60 * 1000;

/**
 * Retorna benchmark comparativo (próprio domínio vs placeholders)
 */
async function getBenchmark() {
  const cacheKey = 'growth_benchmark';

  try {
    return await cache.getOrFetch(cacheKey, CACHE_TTL, async () => {
      console.log('[SEO-GROWTH-V5] Benchmark → gerando comparativo...');

      // Dados reais do próprio domínio
      const il = await internalLinks.analyze();
      const rec = await recommend.analyzeAll();

      const ownDomain = {
        name: 'linkmagico.app.br',
        pages: il.stats ? il.stats.totalPages : 0,
        internalLinks: il.stats ? il.stats.totalLinks : 0,
        avgLinksPerPage: il.stats ? il.stats.avgLinksPerPage : 0,
        orphanPages: il.stats ? il.stats.orphanCount : 0,
        seoScore: rec.averageScore || 0,
        status: 'active'
      };

      // Placeholders para concorrentes (sem dados reais)
      const competitors = [
        { name: 'Concorrente A', pages: null, internalLinks: null, avgLinksPerPage: null, orphanPages: null, seoScore: null, status: 'no_data' },
        { name: 'Concorrente B', pages: null, internalLinks: null, avgLinksPerPage: null, orphanPages: null, seoScore: null, status: 'no_data' },
        { name: 'Concorrente C', pages: null, internalLinks: null, avgLinksPerPage: null, orphanPages: null, seoScore: null, status: 'no_data' }
      ];

      console.log('[SEO-GROWTH-V5] Benchmark → comparativo gerado');

      return {
        own: ownDomain,
        competitors,
        metrics: ['pages', 'internalLinks', 'avgLinksPerPage', 'orphanPages', 'seoScore'],
        note: 'Dados de concorrentes estarão disponíveis em versões futuras. Nenhuma API externa é consultada.',
        generatedAt: new Date().toISOString()
      };
    });
  } catch (e) {
    console.error(`[SEO-GROWTH-V5] Benchmark Error → ${e.message}`);
    return { own: {}, competitors: [], error: true, message: e.message };
  }
}

module.exports = { getBenchmark };
