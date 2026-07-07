/**
 * seo/growth/quick-wins.js — Motor de Quick Wins (SEO V2.1)
 * 
 * Cruza dados do Search Console com critérios configuráveis
 * para identificar páginas com alto potencial de crescimento.
 * 
 * REGRAS:
 * - Apenas analisa e recomenda — NUNCA modifica nada
 * - Retorna exclusivamente JSON padronizado
 * - Logs iniciam com [SEO-GROWTH]
 */

'use strict';

const google = require('../search-console/index');
const cache = require('../cache');
const config = require('../config');

const DEFAULTS = {
  positionMin: 8,
  positionMax: 20,
  impressionsMin: 1,    // site novo — começa com threshold baixo
  ctrBelow: 5,
  maxResults: 20
};

/**
 * Calcula score de prioridade (0-100)
 */
function calculateScore(position, impressions, ctr) {
  // Base score por faixa de posição
  let score = 0;
  if (position <= 10) score = 90;       // quase página 1
  else if (position <= 15) score = 70;  // topo da página 2
  else if (position <= 20) score = 50;  // fundo da página 2
  else score = 30;

  // Bonus por impressões (mais impressões = mais visibilidade potencial)
  if (impressions >= 10) score += 5;
  if (impressions >= 50) score += 5;

  // Bonus por CTR baixo (mais espaço para melhorar)
  if (ctr < 1) score += 5;
  if (ctr < 3) score += 3;

  return Math.min(100, score);
}

/**
 * Determina prioridade a partir do score
 */
function getPriority(score) {
  if (score >= 80) return 'high';
  if (score >= 60) return 'medium';
  return 'low';
}

/**
 * Gera justificativa em português
 */
function getJustification(position, impressions, ctr) {
  const parts = [];

  if (position <= 10) {
    parts.push(`Posição ${position} — a ${Math.ceil(11 - position)} posição(ões) da página 1`);
  } else if (position <= 15) {
    parts.push(`Posição ${position} — topo da página 2, próximo de subir`);
  } else {
    parts.push(`Posição ${position} — página 2, potencial com otimização`);
  }

  if (impressions > 0 && ctr < 3) {
    parts.push(`CTR de ${ctr}% — espaço significativo para melhoria`);
  }

  if (impressions >= 10) {
    parts.push(`${impressions} impressões confirmam demanda real`);
  }

  return parts.join('. ') + '.';
}

/**
 * Identifica Quick Wins a partir dos dados do Search Console
 * @param {object} [options] - Critérios configuráveis
 * @returns {object} Lista de oportunidades ordenadas por prioridade
 */
async function analyze(options = {}) {
  const criteria = { ...DEFAULTS, ...options };
  const cacheKey = `growth_quick_wins_${JSON.stringify(criteria)}`;

  try {
    return await cache.getOrFetch(cacheKey, config.CACHE_TTL.queries, async () => {
      console.log('[SEO-GROWTH] Quick Wins → analisando dados do Search Console...');

      // Buscar queries e páginas dos últimos 90 dias (maior volume de dados)
      const [queriesData, pagesData] = await Promise.all([
        google.getQueries('90d'),
        google.getPages('90d')
      ]);

      if (queriesData.error && !queriesData.rows) {
        return { opportunities: [], total: 0, criteria, error: true, message: queriesData.message, generatedAt: new Date().toISOString() };
      }

      const queries = queriesData.rows || [];
      const pages = pagesData.rows || [];

      // Filtrar queries por critérios
      const filteredQueries = queries.filter(q =>
        q.position >= criteria.positionMin &&
        q.position <= criteria.positionMax &&
        q.impressions >= criteria.impressionsMin &&
        q.ctr < criteria.ctrBelow
      );

      // Para cada query, tentar associar à melhor página
      const opportunities = filteredQueries.map(q => {
        // Encontrar página mais provável para esta query
        const bestPage = pages.length > 0 ? findBestPageForQuery(q.query, pages) : null;

        const score = calculateScore(q.position, q.impressions, q.ctr);
        return {
          page: bestPage ? bestPage.page : '(detectar via API)',
          query: q.query,
          position: q.position,
          impressions: q.impressions,
          clicks: q.clicks,
          ctr: q.ctr,
          priority: getPriority(score),
          score,
          justification: getJustification(q.position, q.impressions, q.ctr)
        };
      });

      // Ordenar por score (maior primeiro)
      opportunities.sort((a, b) => b.score - a.score);

      // Limitar resultados
      const limited = opportunities.slice(0, criteria.maxResults);

      console.log(`[SEO-GROWTH] Quick Wins → ${limited.length} oportunidades encontradas`);

      return {
        opportunities: limited,
        total: limited.length,
        totalAnalyzed: queries.length,
        criteria,
        generatedAt: new Date().toISOString()
      };
    });
  } catch (e) {
    console.error(`[SEO-GROWTH] Quick Wins Error → ${e.message}`);
    return { opportunities: [], total: 0, criteria, error: true, message: e.message, generatedAt: new Date().toISOString() };
  }
}

/**
 * Encontra a página mais provável para uma query (heurística simples)
 */
function findBestPageForQuery(query, pages) {
  const queryWords = query.toLowerCase().split(/\s+/);

  let bestMatch = null;
  let bestScore = 0;

  for (const page of pages) {
    const pagePath = (page.page || '').toLowerCase();
    let matchScore = 0;

    for (const word of queryWords) {
      if (word.length > 3 && pagePath.includes(word)) {
        matchScore += 1;
      }
    }

    if (matchScore > bestScore) {
      bestScore = matchScore;
      bestMatch = page;
    }
  }

  return bestMatch;
}

module.exports = { analyze, DEFAULTS };
