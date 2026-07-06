/**
 * routes/seo.js — Rotas da API SEO (SEOProvider v1)
 * 
 * REGRAS:
 * - Rotas APENAS orquestram (chamam provider, retornam JSON)
 * - Nunca contêm lógica de negócio
 * - Nunca processam dados
 * - Nunca geram HTML
 * - Todas com try/catch e fallback JSON
 */

'use strict';

const express = require('express');
const router = express.Router();
const google = require('../seo/search-console/index');
const bing = require('../seo/bing/index');
const cache = require('../seo/cache');
const telemetry = require('../seo/telemetry');
const config = require('../seo/config');

// ============================================================
// GET /api/seo/status
// ============================================================
router.get('/status', (req, res) => {
  try {
    res.json({
      google: google.getStatus(),
      bing: bing.getStatus(),
      version: config.PROVIDER_VERSION
    });
  } catch (e) {
    console.error('[SEO] Route /status error:', e.message);
    res.json({ error: true, message: 'Erro ao verificar status' });
  }
});

// ============================================================
// GET /api/seo/health
// ============================================================
router.get('/health', async (req, res) => {
  try {
    const googleStatus = google.getStatus();
    const bingStatus = bing.getStatus();
    const cacheStats = cache.stats();
    const telemetryData = telemetry.getSnapshot();

    let googleHealth = { jwt: false, token: false, api: false, data: false };
    if (googleStatus.status === 'ready') {
      try {
        await google.authenticate();
        googleHealth.jwt = true;
        googleHealth.token = true;
        googleHealth.api = true;
        // Tenta buscar dados para confirmar acesso
        const summary = await google.getSummary('7d');
        googleHealth.data = !summary.error;
      } catch (e) {
        console.error('[SEO] Health check Google error:', e.message);
      }
    }

    let bingHealth = { api: false, backlinks: false };
    if (bingStatus.status === 'ready') {
      try {
        const bingCheck = await bing.checkHealth();
        bingHealth.api = bingCheck.api;
        const bl = await bing.getBacklinks();
        bingHealth.backlinks = !bl.error;
      } catch (e) {
        console.error('[SEO] Health check Bing error:', e.message);
      }
    }

    res.json({
      google: googleHealth,
      bing: bingHealth,
      cache: cacheStats,
      telemetry: telemetryData,
      version: config.PROVIDER_VERSION
    });
  } catch (e) {
    console.error('[SEO] Route /health error:', e.message);
    res.json({ error: true, message: 'Erro no health check' });
  }
});

// ============================================================
// GET /api/seo/summary?p=30d
// ============================================================
router.get('/summary', async (req, res) => {
  try {
    const period = req.query.p || config.DEFAULT_PERIOD;
    const data = await google.getSummary(period);
    res.json(data);
  } catch (e) {
    console.error('[SEO] Route /summary error:', e.message);
    res.json({ impressions: 0, clicks: 0, ctr: 0, position: 0, period: req.query.p || '30d', error: true, message: 'Serviço temporariamente indisponível' });
  }
});

// ============================================================
// GET /api/seo/queries?p=30d
// ============================================================
router.get('/queries', async (req, res) => {
  try {
    const period = req.query.p || config.DEFAULT_PERIOD;
    const data = await google.getQueries(period);
    res.json(data);
  } catch (e) {
    console.error('[SEO] Route /queries error:', e.message);
    res.json({ rows: [], total: 0, error: true, message: 'Serviço temporariamente indisponível' });
  }
});

// ============================================================
// GET /api/seo/pages?p=30d
// ============================================================
router.get('/pages', async (req, res) => {
  try {
    const period = req.query.p || config.DEFAULT_PERIOD;
    const data = await google.getPages(period);
    res.json(data);
  } catch (e) {
    console.error('[SEO] Route /pages error:', e.message);
    res.json({ rows: [], total: 0, error: true, message: 'Serviço temporariamente indisponível' });
  }
});

// ============================================================
// GET /api/seo/devices?p=30d
// ============================================================
router.get('/devices', async (req, res) => {
  try {
    const period = req.query.p || config.DEFAULT_PERIOD;
    const data = await google.getDevices(period);
    res.json(data);
  } catch (e) {
    console.error('[SEO] Route /devices error:', e.message);
    res.json({ rows: [], error: true, message: 'Serviço temporariamente indisponível' });
  }
});

// ============================================================
// GET /api/seo/countries?p=30d
// ============================================================
router.get('/countries', async (req, res) => {
  try {
    const period = req.query.p || config.DEFAULT_PERIOD;
    const data = await google.getCountries(period);
    res.json(data);
  } catch (e) {
    console.error('[SEO] Route /countries error:', e.message);
    res.json({ rows: [], error: true, message: 'Serviço temporariamente indisponível' });
  }
});

// ============================================================
// GET /api/seo/backlinks
// ============================================================
router.get('/backlinks', async (req, res) => {
  try {
    const data = await bing.getBacklinks();
    res.json(data);
  } catch (e) {
    console.error('[SEO] Route /backlinks error:', e.message);
    res.json({ total: 0, domains: [], error: true, message: 'Serviço temporariamente indisponível' });
  }
});

module.exports = router;
