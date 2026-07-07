/**
 * routes/gos.js — Growth Operating System API
 * Todas as rotas GOS. Nenhuma rota existente é alterada.
 */
'use strict';

const express = require('express');
const router = express.Router();

const engine = require('../seo/gos/engine');
const missions = require('../seo/gos/missions');
const planner = require('../seo/gos/planner');
const snapshots = require('../seo/gos/snapshots');
const opportunities = require('../seo/gos/opportunities');
const telemetry = require('../seo/gos/telemetry');

function safe(fn) {
  return async (req, res) => {
    try { const data = await fn(req); res.json(data); }
    catch (e) { console.error(`[GOS] Route error: ${e.message}`); res.json({ error: true, message: 'Dados temporariamente indisponíveis' }); }
  };
}

// Executive Dashboard
router.get('/dashboard', safe(async () => {
  telemetry.track('query');
  return engine.getExecutiveDashboard();
}));

// Intelligence
router.get('/intelligence', safe(async () => {
  telemetry.track('query');
  return engine.getIntelligence();
}));

// Strategy Advisor
router.get('/strategy', safe(async () => {
  telemetry.track('query');
  return engine.getStrategyAdvice();
}));

// Daily Planner
router.get('/planner/daily', safe(async () => {
  const dash = await engine.getExecutiveDashboard();
  return planner.generateDailyPlan(dash.actions);
}));

// Weekly Planner
router.get('/planner/weekly', safe(async () => {
  const dash = await engine.getExecutiveDashboard();
  return planner.generateWeeklyPlan(dash.actions);
}));

// Monthly Goals
router.get('/planner/goals', safe(async () => {
  const intel = await engine.getIntelligence();
  return planner.generateMonthlyGoals(intel);
}));

// Opportunities
router.get('/opportunities', safe(async () => {
  telemetry.track('query');
  return opportunities.analyzeAll();
}));

// Future Opportunities
router.get('/opportunities/future', safe(() => opportunities.getFutureOpportunities()));

// Opportunity Score (per page)
router.get('/opportunity-score', safe(async (req) => {
  const roi = require('../seo/gos/roi');
  return roi.opportunityScore({
    position: parseFloat(req.query.position) || 50, ctr: parseFloat(req.query.ctr) || 0,
    impressions: parseInt(req.query.impressions) || 0, clicks: parseInt(req.query.clicks) || 0,
    internalLinks: parseInt(req.query.links) || 0, backlinks: parseInt(req.query.backlinks) || 0
  });
}));

// Missions
router.get('/missions', safe(async () => {
  const dash = await engine.getExecutiveDashboard();
  const list = missions.generateMissions(dash.actions);
  return { missions: list, stats: missions.getStats(), generatedAt: new Date().toISOString() };
}));

router.post('/missions/:id/status', (req, res) => {
  try {
    const { status } = req.body || {};
    if (!status) return res.json({ error: true, message: 'Campo status obrigatório' });
    telemetry.track('mission_complete');
    res.json(missions.updateMission(req.params.id, status));
  } catch (e) { res.json({ error: true, message: e.message }); }
});

// Achievements
router.get('/achievements', safe(async () => {
  const intel = await engine.getIntelligence();
  return { achievements: missions.getAchievements(intel), generatedAt: new Date().toISOString() };
}));

// Timeline
router.get('/timeline', safe(async () => snapshots.getTimeline()));

// Health Evolution
router.get('/health-evolution', safe(() => snapshots.getHealthEvolution()));

router.post('/health-score', (req, res) => {
  try {
    const { score } = req.body || {};
    if (score === undefined) return res.json({ error: true, message: 'Campo score obrigatório' });
    snapshots.recordHealthScore(parseInt(score));
    res.json({ success: true });
  } catch (e) { res.json({ error: true, message: e.message }); }
});

// Telemetry
router.get('/telemetry', safe(() => telemetry.getStats()));

// Health
router.get('/health', safe(() => ({
  status: 'ok', modules: ['engine', 'missions', 'planner', 'snapshots', 'opportunities', 'telemetry', 'scoring', 'advisor', 'financial', 'simulator'],
  telemetry: telemetry.getStats(), timestamp: new Date().toISOString()
})));

// ============================================================
// V2.2 — Centro de Comando Inteligente
// ============================================================
const scoring = require('../seo/gos/scoring');
const advisor = require('../seo/gos/advisor');
const financial = require('../seo/gos/financial');
const simulator = require('../seo/gos/simulator');

// Growth Score
router.get('/growth-score', safe(async () => {
  const intel = await engine.getIntelligence();
  const stats = missions.getStats();
  const scoreData = scoring.calculate({ ...intel, missionsCompleted: stats.completed, missionsTotal: stats.total });
  const projection = scoring.project(scoreData.score, 3);
  return { ...scoreData, projection, generatedAt: new Date().toISOString() };
}));

// General Advisor
router.get('/advisor', safe(async () => advisor.getGeneralAdvice()));

// Page-specific Advisor
router.get('/advisor/page', safe(async (req) => {
  const page = req.query.page || '/';
  return advisor.adviseForPage(page);
}));

// Financial Estimation for a mission
router.get('/financial', safe(async (req) => {
  const impressions = parseInt(req.query.impressions) || 25;
  const ctr = parseFloat(req.query.ctr) || 3;
  return financial.estimateFinancial({ impressions, ctr });
}));

// Simulator
router.get('/simulate', safe(async (req) => {
  const intel = await engine.getIntelligence();
  const stats = missions.getStats();
  const gs = scoring.calculate({ ...intel, missionsCompleted: stats.completed, missionsTotal: stats.total });
  return simulator.simulate({
    currentScore: gs.score,
    currentSEOHealth: 75,
    currentCTR: intel.ctr || 2,
    currentPosition: intel.avgPosition || 40,
    missionsToComplete: parseInt(req.query.missions) || 3
  });
}));

// Learning Metrics
router.get('/learning', safe(async () => {
  const dash = await engine.getExecutiveDashboard();
  const mList = missions.generateMissions(dash.actions);
  const stats = missions.getStats();
  const metrics = scoring.getLearningMetrics(mList);
  return { ...metrics, stats, generatedAt: new Date().toISOString() };
}));

module.exports = router;
