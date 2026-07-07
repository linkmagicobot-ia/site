/**
 * seo/growth/roi.js — Estimador de ROI (V5)
 * 
 * Heurísticas simples — NUNCA IA.
 * Estima tempo, impacto e complexidade por tipo de ação.
 */

'use strict';

const IMPACT_LEVELS = ['Muito Baixo', 'Baixo', 'Médio', 'Alto', 'Muito Alto'];

/**
 * Estima ROI de uma ação
 * @param {object} params
 * @returns {object} { impact, impactLabel, estimatedTime, estimatedGain, complexity, priorityScore }
 */
function estimate(params) {
  const type = params.type || 'generic';

  switch (type) {
    case 'optimize_page': return estimateOptimizePage(params);
    case 'backlinks': return estimateBacklinks(params);
    case 'content': return estimateContent(params);
    case 'internal_links': return estimateInternalLinks(params);
    case 'link_suggestions': return estimateLinkSuggestions(params);
    case 'clusters': return estimateClusters(params);
    case 'indexnow': return { impact: 3, impactLabel: 'Alto', estimatedTime: '5 minutos', estimatedGain: '+indexação acelerada', complexity: 'Baixa', priorityScore: 75 };
    default: return { impact: 2, impactLabel: 'Médio', estimatedTime: '30 minutos', estimatedGain: 'Variável', complexity: 'Média', priorityScore: 50 };
  }
}

function estimateOptimizePage(params) {
  const pos = params.position || 20;
  const imp = params.impressions || 0;
  const ctr = params.ctr || 0;

  let priorityScore = 0;
  let impact = 0;
  let estimatedGain = '';
  let estimatedTime = '';
  let complexity = '';

  if (pos <= 5) {
    impact = 4; estimatedGain = `+${Math.max(5, Math.round(imp * 0.3))} cliques`; estimatedTime = '15 minutos'; complexity = 'Baixa'; priorityScore = 95;
  } else if (pos <= 10) {
    impact = 4; estimatedGain = `+${Math.max(10, Math.round(imp * 0.5))} impressões`; estimatedTime = '15 minutos'; complexity = 'Baixa'; priorityScore = 90;
  } else if (pos <= 15) {
    impact = 3; estimatedGain = `+${Math.max(15, Math.round(imp * 0.4))} impressões`; estimatedTime = '20 minutos'; complexity = 'Média'; priorityScore = 80;
  } else if (pos <= 20) {
    impact = 2; estimatedGain = `+${Math.max(10, Math.round(imp * 0.3))} impressões`; estimatedTime = '30 minutos'; complexity = 'Média'; priorityScore = 65;
  } else {
    impact = 1; estimatedGain = '+visibilidade'; estimatedTime = '45 minutos'; complexity = 'Alta'; priorityScore = 40;
  }

  // Bonus por CTR baixo (mais espaço para melhorar)
  if (ctr < 2 && imp > 5) priorityScore += 5;

  return { impact, impactLabel: IMPACT_LEVELS[impact], estimatedTime, estimatedGain, complexity, priorityScore: Math.min(100, priorityScore) };
}

function estimateBacklinks(params) {
  const count = params.count || 1;
  return {
    impact: count >= 3 ? 4 : 3,
    impactLabel: count >= 3 ? 'Muito Alto' : 'Alto',
    estimatedTime: `${count * 30} minutos`,
    estimatedGain: `+${count * 5} autoridade estimada`,
    complexity: 'Média',
    priorityScore: 70 + Math.min(count * 5, 20)
  };
}

function estimateContent(params) {
  const score = params.score || 50;
  const gap = 100 - score;
  return {
    impact: gap >= 40 ? 3 : 2,
    impactLabel: gap >= 40 ? 'Alto' : 'Médio',
    estimatedTime: gap >= 40 ? '45 minutos' : '20 minutos',
    estimatedGain: `+${Math.round(gap * 0.5)} pontos no score`,
    complexity: gap >= 40 ? 'Média' : 'Baixa',
    priorityScore: 50 + Math.round(gap * 0.5)
  };
}

function estimateInternalLinks(params) {
  const orphanCount = params.orphanCount || 1;
  return {
    impact: orphanCount >= 5 ? 3 : 2,
    impactLabel: orphanCount >= 5 ? 'Alto' : 'Médio',
    estimatedTime: `${orphanCount * 5} minutos`,
    estimatedGain: `+${orphanCount} página(s) conectada(s)`,
    complexity: 'Baixa',
    priorityScore: 60 + Math.min(orphanCount * 5, 25)
  };
}

function estimateLinkSuggestions(params) {
  const count = params.count || 1;
  return {
    impact: count >= 5 ? 3 : 2,
    impactLabel: count >= 5 ? 'Alto' : 'Médio',
    estimatedTime: `${count * 3} minutos`,
    estimatedGain: `+${count} link(s) contextual(is)`,
    complexity: 'Baixa',
    priorityScore: 55 + Math.min(count * 3, 20)
  };
}

function estimateClusters(params) {
  const count = params.count || 1;
  return {
    impact: 3,
    impactLabel: 'Alto',
    estimatedTime: `${count * 15} minutos`,
    estimatedGain: `+${count} cluster(s) interconectado(s)`,
    complexity: 'Média',
    priorityScore: 65 + Math.min(count * 10, 20)
  };
}

/**
 * Score de oportunidade para uma página
 */
function opportunityScore(params) {
  const { position = 50, ctr = 0, impressions = 0, clicks = 0, internalLinks = 0, backlinks = 0 } = params;

  let score = 0;

  // Posição (peso alto — quanto mais perto da p1, mais oportunidade)
  if (position <= 5) score += 35;
  else if (position <= 10) score += 30;
  else if (position <= 15) score += 25;
  else if (position <= 20) score += 18;
  else if (position <= 30) score += 10;
  else score += 3;

  // Impressões (demanda confirmada)
  if (impressions >= 50) score += 20;
  else if (impressions >= 10) score += 15;
  else if (impressions >= 1) score += 8;

  // CTR (espaço para melhorar)
  if (ctr > 0 && ctr < 2) score += 15;
  else if (ctr >= 2 && ctr < 5) score += 10;
  else if (ctr >= 5) score += 5;

  // Links internos (infraestrutura)
  if (internalLinks === 0) score += 10;
  else if (internalLinks < 3) score += 5;

  // Backlinks
  if (backlinks === 0) score += 10;
  else if (backlinks < 5) score += 5;

  // Cliques (já tem tráfego)
  if (clicks > 0) score += 5;

  const level = score >= 80 ? 'Muito Alto' : score >= 60 ? 'Alto' : score >= 40 ? 'Médio' : score >= 20 ? 'Baixo' : 'Muito Baixo';

  return { score: Math.min(100, score), level };
}

module.exports = { estimate, opportunityScore, IMPACT_LEVELS };
