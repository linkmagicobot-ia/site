/**
 * seo/gos/engine.js — GOS Executive Dashboard + Strategy Advisor
 * 
 * Orquestra TODOS os módulos para gerar:
 * - Painel "Hoje você deve fazer" (top 5)
 * - Growth Intelligence (resumo calculado)
 * - Strategy Advisor ("sua melhor oportunidade hoje")
 */

'use strict';

const quickWins = require('../growth/quick-wins');
const recommend = require('../growth/recommend');
const internalLinks = require('../growth/internal-links');
const backlinks = require('../growth/backlinks');
const trends = require('../growth/trends');
const roiEngine = require('./roi');
const cache = require('../cache');

const CACHE_TTL = 30 * 60 * 1000;

async function gatherData() {
  return Promise.all([
    quickWins.analyze(),
    recommend.analyzeAll(),
    internalLinks.analyze(),
    backlinks.generateReport(),
    trends.analyze()
  ]);
}

/**
 * Painel Executivo — Top 5 ações priorizadas
 */
async function getExecutiveDashboard() {
  const cacheKey = 'gos_executive';
  try {
    return await cache.getOrFetch(cacheKey, CACHE_TTL, async () => {
      console.log('[GOS] Engine → gerando painel executivo...');
      const [qw, recAll, il, bl, tr] = await gatherData();
      const actions = [];

      // Quick Wins (posição 4-12)
      (qw.opportunities || []).filter(o => o.position <= 12).forEach(o => {
        const r = roiEngine.estimate({ type: 'optimize_page', position: o.position, impressions: o.impressions, ctr: o.ctr });
        actions.push({ type: 'optimize_page', title: 'Melhorar', target: o.page || o.query, query: o.query, ...r, details: o.justification });
      });

      // Backlinks
      const blHigh = (bl.actions || []).filter(a => a.priority === 'high');
      if (blHigh.length > 0) {
        const r = roiEngine.estimate({ type: 'backlinks', count: blHigh.length });
        actions.push({ type: 'backlinks', title: `Adicionar ${blHigh.length} backlink(s)`, target: blHigh.map(a => a.action).join('; '), ...r });
      }

      // Conteúdo fraco
      (recAll.pages || []).filter(p => p.scores && p.scores.content < 60).slice(0, 2).forEach(p => {
        const r = roiEngine.estimate({ type: 'content', score: p.scores.content });
        actions.push({ type: 'content', title: 'Atualizar artigo', target: p.page, ...r, details: `Score conteúdo: ${p.scores.content}/100` });
      });

      // Links internos
      if ((il.orphanPages || []).length > 0) {
        const r = roiEngine.estimate({ type: 'internal_links', orphanCount: il.orphanPages.length });
        actions.push({ type: 'internal_links', title: 'Adicionar links internos', target: `${il.orphanPages.length} página(s) órfã(s)`, ...r });
      }

      // IndexNow
      actions.push({ type: 'indexnow', title: 'Enviar IndexNow', target: 'Notificar motores de busca', ...roiEngine.estimate({ type: 'indexnow' }) });

      // Clusters
      if ((il.disconnectedClusters || []).length > 0) {
        const r = roiEngine.estimate({ type: 'clusters', count: il.disconnectedClusters.length });
        actions.push({ type: 'clusters', title: 'Conectar clusters', target: il.disconnectedClusters.join(', '), ...r });
      }

      actions.sort((a, b) => b.priorityScore - a.priorityScore);
      actions.forEach((a, i) => { a.rank = i + 1; a.stars = Math.min(5, Math.max(1, Math.round(a.priorityScore / 20))); });

      console.log(`[GOS] Engine → ${actions.length} ações priorizadas`);
      return { actions: actions.slice(0, 10), total: actions.length, generatedAt: new Date().toISOString() };
    });
  } catch (e) {
    console.error(`[GOS] Engine Error → ${e.message}`);
    return { actions: [], total: 0, error: true, message: e.message, generatedAt: new Date().toISOString() };
  }
}

/**
 * Growth Intelligence — resumo numérico
 */
async function getIntelligence() {
  const cacheKey = 'gos_intelligence';
  try {
    return await cache.getOrFetch(cacheKey, CACHE_TTL, async () => {
      const [qw, recAll, il, bl, tr] = await gatherData();
      const nearPage1 = (qw.opportunities || []).filter(o => o.position <= 12).length;
      const declining = tr.trends && tr.trends.position && tr.trends.position.status === 'declining';
      return {
        totalOpportunities: (qw.opportunities || []).length,
        nearPage1,
        pagesDeclined: declining ? 'Sim' : 'Não detectado',
        backlinksRecommended: (bl.actions || []).length,
        incompleteClusters: (il.disconnectedClusters || []).length,
        contentSuggestions: (recAll.pages || []).filter(p => p.scores && p.scores.content < 60).length,
        orphanPages: (il.orphanPages || []).length,
        averageScore: recAll.averageScore || 0,
        totalPages: recAll.total || 0,
        insights: tr.insights || [],
        generatedAt: new Date().toISOString()
      };
    });
  } catch (e) {
    return { totalOpportunities: 0, error: true, message: e.message };
  }
}

/**
 * Strategy Advisor — "sua melhor oportunidade hoje"
 */
async function getStrategyAdvice() {
  const cacheKey = 'gos_strategy';
  try {
    return await cache.getOrFetch(cacheKey, CACHE_TTL, async () => {
      const dash = await getExecutiveDashboard();
      const top = (dash.actions || [])[0];
      if (!top) return { advice: null, message: 'Nenhuma oportunidade identificada ainda.', generatedAt: new Date().toISOString() };

      return {
        advice: {
          opportunity: top.title + ' — ' + top.target,
          why: top.details || 'Maior score de prioridade entre todas as ações calculadas',
          estimatedTime: top.estimatedTime,
          estimatedGain: top.estimatedGain,
          impact: top.impactLabel,
          stars: top.stars,
          complexity: top.complexity
        },
        generatedAt: new Date().toISOString()
      };
    });
  } catch (e) {
    return { advice: null, error: true, message: e.message };
  }
}

module.exports = { getExecutiveDashboard, getIntelligence, getStrategyAdvice };
