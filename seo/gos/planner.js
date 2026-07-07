/**
 * seo/gos/planner.js — Daily Planner, Weekly Planner, Monthly Goals
 */
'use strict';

const cache = require('../cache');
const CACHE_TTL = 30 * 60 * 1000;

/**
 * Daily Planner — gera plano do dia a partir das ações priorizadas
 */
function generateDailyPlan(actions) {
  const top = (actions || []).slice(0, 5);
  return {
    date: new Date().toISOString().split('T')[0],
    plan: top.map((a, i) => ({
      rank: i + 1,
      title: a.title,
      target: a.target,
      stars: a.stars || Math.min(5, Math.max(1, 5 - i)),
      estimatedTime: a.estimatedTime,
      impactLabel: a.impactLabel,
      type: a.type
    })),
    totalEstimatedTime: top.reduce((sum, a) => {
      const mins = parseInt(a.estimatedTime) || 20;
      return sum + mins;
    }, 0) + ' min',
    generatedAt: new Date().toISOString()
  };
}

/**
 * Weekly Planner — separa ações em Urgente / Importante / Opcional
 */
function generateWeeklyPlan(actions) {
  const all = actions || [];
  const urgent = all.filter(a => a.priorityScore >= 80).slice(0, 5);
  const important = all.filter(a => a.priorityScore >= 55 && a.priorityScore < 80).slice(0, 5);
  const optional = all.filter(a => a.priorityScore < 55).slice(0, 5);

  return {
    week: getWeekLabel(),
    urgent: urgent.map(a => ({ title: a.title, target: a.target, impactLabel: a.impactLabel, estimatedTime: a.estimatedTime })),
    important: important.map(a => ({ title: a.title, target: a.target, impactLabel: a.impactLabel, estimatedTime: a.estimatedTime })),
    optional: optional.map(a => ({ title: a.title, target: a.target, impactLabel: a.impactLabel, estimatedTime: a.estimatedTime })),
    generatedAt: new Date().toISOString()
  };
}

function getWeekLabel() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return `${start.toLocaleDateString('pt-BR')} — ${end.toLocaleDateString('pt-BR')}`;
}

/**
 * Monthly Goals — metas com progresso
 */
function generateMonthlyGoals(intelligence) {
  const d = intelligence || {};
  const goals = [];

  // Meta de impressões (baseada em dados reais se disponíveis)
  goals.push({
    name: 'Oportunidades resolvidas',
    target: Math.max(5, d.totalOpportunities || 5),
    current: 0, // Sem missões completadas ainda
    pct: 0,
    unit: 'ações'
  });

  goals.push({
    name: 'Páginas próximas da Página 1',
    target: Math.max(1, (d.nearPage1 || 0) + 2),
    current: d.nearPage1 || 0,
    pct: d.nearPage1 ? Math.round((d.nearPage1 / Math.max(1, (d.nearPage1 || 0) + 2)) * 100) : 0,
    unit: 'queries'
  });

  goals.push({
    name: 'Páginas órfãs eliminadas',
    target: d.orphanPages || 0,
    current: 0,
    pct: (d.orphanPages || 0) === 0 ? 100 : 0,
    unit: 'páginas'
  });

  goals.push({
    name: 'Score SEO médio',
    target: 80,
    current: d.averageScore || 0,
    pct: Math.round(((d.averageScore || 0) / 80) * 100),
    unit: 'pontos'
  });

  goals.push({
    name: 'Backlinks conquistados',
    target: Math.max(3, d.backlinksRecommended || 3),
    current: 0,
    pct: 0,
    unit: 'backlinks'
  });

  return {
    month: new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
    goals,
    generatedAt: new Date().toISOString()
  };
}

module.exports = { generateDailyPlan, generateWeeklyPlan, generateMonthlyGoals };
