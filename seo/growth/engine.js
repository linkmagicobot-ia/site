/**
 * seo/growth/engine.js — Painel Executivo "Hoje você deve fazer" (V5)
 * 
 * Orquestra TODOS os módulos Growth para gerar lista priorizada de ações.
 * Calcula prioridades automaticamente — NUNCA hardcoded.
 * 
 * REGRAS:
 * - Apenas analisa e recomenda — NUNCA modifica nada
 * - Retorna exclusivamente JSON
 * - Logs iniciam com [SEO-GROWTH-V5]
 */

'use strict';

const quickWins = require('./quick-wins');
const recommend = require('./recommend');
const internalLinks = require('./internal-links');
const backlinks = require('./backlinks');
const trends = require('./trends');
const roi = require('./roi');
const cache = require('../cache');

const CACHE_TTL = 30 * 60 * 1000; // 30min conforme spec

/**
 * Gera painel executivo com ações priorizadas
 */
async function generateDashboard() {
  const cacheKey = 'growth_engine_dashboard';

  try {
    return await cache.getOrFetch(cacheKey, CACHE_TTL, async () => {
      console.log('[SEO-GROWTH-V5] Engine → gerando painel executivo...');

      const [qw, recAll, il, bl, tr] = await Promise.all([
        quickWins.analyze(),
        recommend.analyzeAll(),
        internalLinks.analyze(),
        backlinks.generateReport(),
        trends.analyze()
      ]);

      const actions = [];

      // 1. Quick Wins — páginas próximas da página 1
      const topOpps = (qw.opportunities || []).filter(o => o.position <= 12);
      topOpps.forEach(o => {
        const roiEst = roi.estimate({ type: 'optimize_page', position: o.position, impressions: o.impressions, ctr: o.ctr });
        actions.push({
          type: 'optimize_page',
          title: 'Melhorar',
          target: o.page || o.query,
          query: o.query,
          impact: roiEst.impact,
          impactLabel: roiEst.impactLabel,
          estimatedTime: roiEst.estimatedTime,
          estimatedGain: roiEst.estimatedGain,
          priority: roiEst.priorityScore,
          details: o.justification
        });
      });

      // 2. Backlinks
      const blActions = (bl.actions || []).filter(a => a.priority === 'high');
      if (blActions.length > 0) {
        const roiEst = roi.estimate({ type: 'backlinks', count: blActions.length });
        actions.push({
          type: 'backlinks',
          title: 'Conseguir backlinks',
          target: `${blActions.length} ações sugeridas`,
          impact: roiEst.impact,
          impactLabel: roiEst.impactLabel,
          estimatedTime: roiEst.estimatedTime,
          estimatedGain: roiEst.estimatedGain,
          priority: roiEst.priorityScore,
          details: blActions.map(a => a.action).join('; ')
        });
      }

      // 3. Conteúdo — páginas com score baixo
      const lowScorePages = (recAll.pages || []).filter(p => p.scores && p.scores.content < 60);
      if (lowScorePages.length > 0) {
        const topLow = lowScorePages.slice(0, 3);
        topLow.forEach(p => {
          const roiEst = roi.estimate({ type: 'content', score: p.scores.content, page: p.page });
          actions.push({
            type: 'content',
            title: 'Expandir conteúdo',
            target: p.page,
            impact: roiEst.impact,
            impactLabel: roiEst.impactLabel,
            estimatedTime: roiEst.estimatedTime,
            estimatedGain: roiEst.estimatedGain,
            priority: roiEst.priorityScore,
            details: `Score conteúdo: ${p.scores.content}/100 — expandir para melhorar ranqueamento`
          });
        });
      }

      // 4. Links internos — páginas órfãs
      const orphans = il.orphanPages || [];
      if (orphans.length > 0) {
        const roiEst = roi.estimate({ type: 'internal_links', orphanCount: orphans.length });
        actions.push({
          type: 'internal_links',
          title: 'Corrigir links internos',
          target: `${orphans.length} página(s) órfã(s)`,
          impact: roiEst.impact,
          impactLabel: roiEst.impactLabel,
          estimatedTime: roiEst.estimatedTime,
          estimatedGain: roiEst.estimatedGain,
          priority: roiEst.priorityScore,
          details: orphans.slice(0, 5).join(', ')
        });
      }

      // 5. Sugestões de links
      const suggestions = (il.suggestions || []).filter(s => s.priority === 'high');
      if (suggestions.length > 0) {
        const roiEst = roi.estimate({ type: 'link_suggestions', count: suggestions.length });
        actions.push({
          type: 'link_suggestions',
          title: 'Adicionar links internos',
          target: `${suggestions.length} sugestão(ões)`,
          impact: roiEst.impact,
          impactLabel: roiEst.impactLabel,
          estimatedTime: roiEst.estimatedTime,
          estimatedGain: roiEst.estimatedGain,
          priority: roiEst.priorityScore,
          details: suggestions.slice(0, 3).map(s => `${s.target} ← ${s.sources[0] || '?'}`).join('; ')
        });
      }

      // 6. Clusters desconectados
      if ((il.disconnectedClusters || []).length > 0) {
        const roiEst = roi.estimate({ type: 'clusters', count: il.disconnectedClusters.length });
        actions.push({
          type: 'clusters',
          title: 'Conectar clusters',
          target: il.disconnectedClusters.join(', '),
          impact: roiEst.impact,
          impactLabel: roiEst.impactLabel,
          estimatedTime: roiEst.estimatedTime,
          estimatedGain: roiEst.estimatedGain,
          priority: roiEst.priorityScore,
          details: `${il.disconnectedClusters.length} cluster(s) sem linkagem interna`
        });
      }

      // Ordenar por prioridade (maior = mais urgente)
      actions.sort((a, b) => b.priority - a.priority);

      // Numerar
      actions.forEach((a, i) => a.rank = i + 1);

      console.log(`[SEO-GROWTH-V5] Engine → ${actions.length} ações priorizadas`);

      return {
        actions,
        total: actions.length,
        generatedAt: new Date().toISOString()
      };
    });
  } catch (e) {
    console.error(`[SEO-GROWTH-V5] Engine Error → ${e.message}`);
    return { actions: [], total: 0, error: true, message: e.message, generatedAt: new Date().toISOString() };
  }
}

/**
 * Growth Intelligence — resumo automático de oportunidades
 */
async function generateIntelligence() {
  const cacheKey = 'growth_engine_intelligence';

  try {
    return await cache.getOrFetch(cacheKey, CACHE_TTL, async () => {
      console.log('[SEO-GROWTH-V5] Intelligence → gerando resumo...');

      const [qw, recAll, il, bl, tr] = await Promise.all([
        quickWins.analyze(),
        recommend.analyzeAll(),
        internalLinks.analyze(),
        backlinks.generateReport(),
        trends.analyze()
      ]);

      const nearPage1 = (qw.opportunities || []).filter(o => o.position <= 12).length;
      const lostPositions = (tr.trends && tr.trends.position && tr.trends.position.status === 'declining') ? true : false;
      const totalOpps = (qw.opportunities || []).length;
      const backlinksRecommended = (bl.actions || []).length;
      const incompleteClusters = (il.disconnectedClusters || []).length;
      const contentSuggestions = (recAll.pages || []).filter(p => p.scores && p.scores.content < 60).length;
      const orphanPages = (il.orphanPages || []).length;

      const summary = {
        totalOpportunities: totalOpps,
        nearPage1,
        lostPositions: lostPositions ? 'Sim — revisar posições' : 'Não detectado',
        backlinksRecommended,
        incompleteClusters,
        contentSuggestions,
        orphanPages,
        averageScore: recAll.averageScore || 0,
        totalPagesAnalyzed: recAll.total || 0,
        trends: tr.trends || {},
        insights: tr.insights || [],
        generatedAt: new Date().toISOString()
      };

      console.log(`[SEO-GROWTH-V5] Intelligence → ${totalOpps} oportunidades, ${nearPage1} near page 1`);
      return summary;
    });
  } catch (e) {
    console.error(`[SEO-GROWTH-V5] Intelligence Error → ${e.message}`);
    return { totalOpportunities: 0, error: true, message: e.message };
  }
}

module.exports = { generateDashboard, generateIntelligence };
