/**
 * seo/gos/roi.js — ROI Engine (heurísticas, nunca IA)
 */
'use strict';

const LEVELS = ['Muito Baixo', 'Baixo', 'Médio', 'Alto', 'Muito Alto'];

function estimate(params) {
  const t = params.type || 'generic';
  const m = { optimize_page: estPage, backlinks: estBacklinks, content: estContent, internal_links: estLinks, clusters: estClusters, indexnow: estIndexNow };
  return (m[t] || estGeneric)(params);
}

function estPage(p) {
  const pos = p.position || 20, imp = p.impressions || 0;
  let s = 50, g = '', time = '30 min', cx = 'Média';
  if (pos <= 5) { s = 95; g = `+${Math.max(5, Math.round(imp * 0.3))} cliques`; time = '15 min'; cx = 'Baixa'; }
  else if (pos <= 10) { s = 90; g = `+${Math.max(10, Math.round(imp * 0.5))} impressões`; time = '15 min'; cx = 'Baixa'; }
  else if (pos <= 15) { s = 80; g = `+${Math.max(15, Math.round(imp * 0.4))} impressões`; time = '20 min'; cx = 'Média'; }
  else { s = 65; g = `+${Math.max(10, Math.round(imp * 0.3))} impressões`; time = '30 min'; cx = 'Média'; }
  if ((p.ctr || 0) < 2 && imp > 5) s += 5;
  const idx = Math.min(4, Math.floor(s / 20));
  return { priorityScore: Math.min(100, s), impactLabel: LEVELS[idx], estimatedTime: time, estimatedGain: g, complexity: cx, probability: s >= 80 ? 'Alta' : s >= 60 ? 'Média' : 'Baixa' };
}

function estBacklinks(p) {
  const c = p.count || 1; const s = 70 + Math.min(c * 5, 20);
  return { priorityScore: s, impactLabel: c >= 3 ? 'Muito Alto' : 'Alto', estimatedTime: `${c * 30} min`, estimatedGain: `+${c * 5} autoridade`, complexity: 'Média', probability: 'Média' };
}

function estContent(p) {
  const gap = 100 - (p.score || 50); const s = 50 + Math.round(gap * 0.5);
  return { priorityScore: s, impactLabel: gap >= 40 ? 'Alto' : 'Médio', estimatedTime: gap >= 40 ? '45 min' : '20 min', estimatedGain: `+${Math.round(gap * 0.5)} pontos`, complexity: gap >= 40 ? 'Média' : 'Baixa', probability: 'Alta' };
}

function estLinks(p) {
  const c = p.orphanCount || 1; const s = 60 + Math.min(c * 5, 25);
  return { priorityScore: s, impactLabel: c >= 5 ? 'Alto' : 'Médio', estimatedTime: `${c * 5} min`, estimatedGain: `+${c} pág conectada(s)`, complexity: 'Baixa', probability: 'Alta' };
}

function estClusters(p) {
  const c = p.count || 1;
  return { priorityScore: 65 + Math.min(c * 10, 20), impactLabel: 'Alto', estimatedTime: `${c * 15} min`, estimatedGain: `+${c} cluster(s)`, complexity: 'Média', probability: 'Média' };
}

function estIndexNow() {
  return { priorityScore: 75, impactLabel: 'Alto', estimatedTime: '5 min', estimatedGain: '+indexação acelerada', complexity: 'Baixa', probability: 'Alta' };
}

function estGeneric() {
  return { priorityScore: 50, impactLabel: 'Médio', estimatedTime: '30 min', estimatedGain: 'Variável', complexity: 'Média', probability: 'Média' };
}

/**
 * Opportunity Score por página (0-100)
 */
function opportunityScore(p) {
  let s = 0;
  const pos = p.position || 50;
  if (pos <= 5) s += 35; else if (pos <= 10) s += 30; else if (pos <= 15) s += 25; else if (pos <= 20) s += 18; else if (pos <= 30) s += 10; else s += 3;
  if ((p.impressions || 0) >= 50) s += 20; else if (p.impressions >= 10) s += 15; else if (p.impressions >= 1) s += 8;
  if ((p.ctr || 0) > 0 && p.ctr < 2) s += 15; else if (p.ctr < 5) s += 10; else if (p.ctr >= 5) s += 5;
  if ((p.internalLinks || 0) === 0) s += 10; else if (p.internalLinks < 3) s += 5;
  if ((p.backlinks || 0) === 0) s += 10; else if (p.backlinks < 5) s += 5;
  if ((p.clicks || 0) > 0) s += 5;
  s = Math.min(100, s);
  const level = s >= 80 ? 'Muito Alto' : s >= 60 ? 'Alto' : s >= 40 ? 'Médio' : s >= 20 ? 'Baixo' : 'Muito Baixo';
  return { score: s, level };
}

module.exports = { estimate, opportunityScore, LEVELS };
