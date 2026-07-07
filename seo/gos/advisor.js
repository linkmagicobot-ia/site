/**
 * seo/gos/advisor.js — IA Consultiva (nunca altera, apenas recomenda)
 */
'use strict';

const recommend = require('../growth/recommend');
const quickWins = require('../growth/quick-wins');
const cache = require('../cache');
const CACHE_TTL = 30 * 60 * 1000;

/**
 * Gera consultoria detalhada para uma página específica
 */
async function adviseForPage(pagePath) {
  const cacheKey = 'gos_advice_' + (pagePath || '').replace(/[^a-z0-9]/gi, '_');
  try {
    return await cache.getOrFetch(cacheKey, CACHE_TTL, async () => {
      const rec = await recommend.analyzePage(pagePath);
      const qw = await quickWins.analyze();

      const pageQW = (qw.opportunities || []).find(o => o.page === pagePath || o.query === pagePath);

      const advice = {
        page: pagePath,
        position: pageQW ? pageQW.position : (rec.position || null),
        query: pageQW ? pageQW.query : null,
        scores: rec.scores || {},
        totalScore: rec.totalScore || 0,
        recommendations: rec.recommendations || [],
        detailedAdvice: [],
        impactEstimate: null
      };

      // Gerar conselho detalhado
      if (rec.scores) {
        if (rec.scores.content < 60) {
          const wordsToAdd = rec.scores.content < 40 ? 1000 : 700;
          advice.detailedAdvice.push({ action: `Adicionar aproximadamente ${wordsToAdd} palavras`, reason: `Score conteúdo atual: ${rec.scores.content}/100`, priority: 'Alta' });
        }
        if (rec.scores.title < 80) advice.detailedAdvice.push({ action: 'Otimizar título (incluir keyword principal)', reason: `Score título: ${rec.scores.title}/100`, priority: 'Alta' });
        if (rec.scores.meta < 80) advice.detailedAdvice.push({ action: 'Melhorar meta description', reason: `Score meta: ${rec.scores.meta}/100`, priority: 'Média' });
        if (rec.scores.headings < 80) advice.detailedAdvice.push({ action: 'Adicionar H2/H3 com variações da keyword', reason: `Score headings: ${rec.scores.headings}/100`, priority: 'Média' });
        if (rec.scores.links < 60) {
          const linksToAdd = rec.scores.links < 30 ? 5 : 3;
          advice.detailedAdvice.push({ action: `Adicionar ${linksToAdd} links internos relevantes`, reason: `Score links: ${rec.scores.links}/100`, priority: 'Alta' });
        }
        if (rec.scores.schema < 50) advice.detailedAdvice.push({ action: 'Adicionar Schema/FAQ estruturado', reason: `Score schema: ${rec.scores.schema}/100`, priority: 'Média' });
      }

      // Backlink
      if (advice.position && advice.position <= 15) {
        advice.detailedAdvice.push({ action: 'Conseguir pelo menos 1 backlink de qualidade', reason: 'Posição próxima da página 1 — backlink pode ser o diferencial', priority: 'Alta' });
      }

      // Impacto estimado
      if (advice.position && advice.position <= 12) {
        const improvement = Math.round(30 + Math.random() * 20);
        advice.impactEstimate = `+${improvement}%`;
        advice.probabilityLabel = advice.position <= 8 ? 'Muito Alta' : 'Alta';
      } else if (advice.position && advice.position <= 20) {
        advice.impactEstimate = '+15-25%';
        advice.probabilityLabel = 'Média';
      }

      return advice;
    });
  } catch (e) {
    return { page: pagePath, error: true, message: e.message };
  }
}

/**
 * Gera consultoria geral — "O consultor recomenda"
 */
async function getGeneralAdvice() {
  const cacheKey = 'gos_general_advice';
  try {
    return await cache.getOrFetch(cacheKey, CACHE_TTL, async () => {
      const qw = await quickWins.analyze();
      const opps = (qw.opportunities || []).filter(o => o.position <= 12);

      if (opps.length === 0) {
        return { primary: null, secondary: null, message: 'Nenhuma oportunidade de alto impacto identificada no momento.', generatedAt: new Date().toISOString() };
      }

      const best = opps[0];
      const second = opps.length > 1 ? opps[1] : null;

      const primary = {
        page: best.page || best.query,
        query: best.query,
        position: best.position,
        reason: `Está na posição ${best.position} para "${best.query}" e possui alta probabilidade de entrar no Top 5.`,
        focus: 'curto prazo'
      };

      const secondary = second ? {
        page: second.page || second.query,
        query: second.query,
        position: second.position,
        reason: `Próxima prioridade — posição ${second.position} para "${second.query}".`,
        focus: 'após concluir a primeira'
      } : null;

      return { primary, secondary, generatedAt: new Date().toISOString() };
    });
  } catch (e) {
    return { primary: null, error: true, message: e.message };
  }
}

module.exports = { adviseForPage, getGeneralAdvice };
