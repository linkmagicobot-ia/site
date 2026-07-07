/**
 * routes/seo-growth.js — Rotas API Growth Intelligence (SEO V2.1)
 * 
 * REGRAS:
 * - Rotas APENAS orquestram — NUNCA contêm lógica
 * - Todas com try/catch e fallback JSON
 * - Logs iniciam com [SEO-GROWTH]
 */

'use strict';

const express = require('express');
const router = express.Router();
const quickWins = require('../seo/growth/quick-wins');
const recommend = require('../seo/growth/recommend');
const internalLinks = require('../seo/growth/internal-links');
const backlinks = require('../seo/growth/backlinks');
const trends = require('../seo/growth/trends');
const cache = require('../seo/cache');
const telemetry = require('../seo/telemetry');

// ============================================================
// GET /api/seo/growth/quick-wins
// ============================================================
router.get('/quick-wins', async (req, res) => {
  try {
    telemetry.increment('seo_growth_quick_wins_generated');
    const data = await quickWins.analyze({
      positionMin: parseFloat(req.query.posMin) || undefined,
      positionMax: parseFloat(req.query.posMax) || undefined,
      impressionsMin: parseInt(req.query.impMin) || undefined,
      ctrBelow: parseFloat(req.query.ctrMax) || undefined
    });
    res.json(data);
  } catch (e) {
    console.error('[SEO-GROWTH] Route /quick-wins error:', e.message);
    res.json({ opportunities: [], total: 0, error: true, message: 'Serviço temporariamente indisponível' });
  }
});

// ============================================================
// GET /api/seo/growth/recommendations?page=/imobiliarias
// ============================================================
router.get('/recommendations', async (req, res) => {
  try {
    telemetry.increment('seo_growth_recommendations_generated');
    const page = req.query.page;
    if (!page) {
      return res.json({ error: true, message: 'Parâmetro page é obrigatório. Ex: ?page=/imobiliarias' });
    }
    const data = await recommend.analyzePage(page);
    res.json(data);
  } catch (e) {
    console.error('[SEO-GROWTH] Route /recommendations error:', e.message);
    res.json({ error: true, message: 'Serviço temporariamente indisponível' });
  }
});

// ============================================================
// GET /api/seo/growth/recommendations/all
// ============================================================
router.get('/recommendations/all', async (req, res) => {
  try {
    telemetry.increment('seo_growth_recommendations_generated');
    const data = await recommend.analyzeAll();
    res.json(data);
  } catch (e) {
    console.error('[SEO-GROWTH] Route /recommendations/all error:', e.message);
    res.json({ pages: [], total: 0, averageScore: 0, error: true, message: 'Serviço temporariamente indisponível' });
  }
});

// ============================================================
// GET /api/seo/growth/internal-links
// ============================================================
router.get('/internal-links', async (req, res) => {
  try {
    telemetry.increment('seo_growth_internal_links_analyzed');
    const data = await internalLinks.analyze();
    res.json(data);
  } catch (e) {
    console.error('[SEO-GROWTH] Route /internal-links error:', e.message);
    res.json({ linkMap: [], suggestions: [], orphanPages: [], stats: {}, error: true, message: 'Serviço temporariamente indisponível' });
  }
});

// ============================================================
// GET /api/seo/growth/backlinks/report
// ============================================================
router.get('/backlinks/report', async (req, res) => {
  try {
    telemetry.increment('seo_growth_backlinks_checked');
    const data = await backlinks.generateReport();
    res.json(data);
  } catch (e) {
    console.error('[SEO-GROWTH] Route /backlinks/report error:', e.message);
    res.json({ current: { total: 0, domains: [] }, opportunities: [], error: true, message: 'Serviço temporariamente indisponível' });
  }
});

// ============================================================
// GET /api/seo/growth/trends
// ============================================================
router.get('/trends', async (req, res) => {
  try {
    const data = await trends.analyze();
    res.json(data);
  } catch (e) {
    console.error('[SEO-GROWTH] Route /trends error:', e.message);
    res.json({ periods: {}, trends: {}, insights: [], error: true, message: 'Serviço temporariamente indisponível' });
  }
});

// ============================================================
// GET /api/seo/growth/health
// ============================================================
router.get('/health', async (req, res) => {
  try {
    telemetry.increment('seo_growth_dashboard_views');
    const cacheStats = cache.stats();

    res.json({
      status: 'ok',
      version: 'v2.1',
      modules: {
        quickWins: true,
        recommendations: true,
        internalLinks: true,
        backlinks: true,
        trends: true
      },
      cache: cacheStats,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error('[SEO-GROWTH] Route /health error:', e.message);
    res.json({ status: 'error', message: e.message });
  }
});

module.exports = router;
