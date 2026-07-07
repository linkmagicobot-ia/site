/**
 * seo/search-console/index.js — Google Search Console Provider (SEOProvider v1)
 * 
 * Autenticação JWT nativa com módulos Node.js (https + crypto).
 * Zero dependências externas.
 * 
 * REGRAS:
 * - Este módulo é exclusivamente um provider de dados
 * - Retorna EXCLUSIVAMENTE JSON padronizado
 * - Nunca HTML, nunca DOM, nunca template
 * - Nunca registra credenciais ou tokens nos logs
 * - Em caso de erro: { error: true, message: '...' }
 * - Em caso de dados vazios: { rows: [], total: 0, message: '...' }
 * - Nunca undefined, nunca null, nunca string solta
 */

'use strict';

const https = require('https');
const crypto = require('crypto');
const config = require('../config');
const cache = require('../cache');
const telemetry = require('../telemetry');

// ============================================================
// Autenticação JWT nativa
// ============================================================

/**
 * Parseia as credenciais da Service Account da env var
 * @returns {object|null} Credenciais ou null
 */
function getCredentials() {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!json) return null;

  try {
    return JSON.parse(json);
  } catch (e) {
    console.error('[SEO] Google Error → credenciais JSON inválidas');
    return null;
  }
}

/**
 * Cria um JWT assinado com RSA-SHA256
 * @param {object} creds - Credenciais da Service Account
 * @returns {string} JWT assinado
 */
function createJWT(creds) {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600; // 1 hora

  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: creds.client_email,
    scope: config.GOOGLE_SCOPE,
    aud: config.GOOGLE_TOKEN_URL,
    iat: now,
    exp: exp
  };

  const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const unsigned = `${b64(header)}.${b64(payload)}`;

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(unsigned);
  const signature = sign.sign(creds.private_key, 'base64url');

  return `${unsigned}.${signature}`;
}

/**
 * Troca JWT por access token via Google OAuth2
 * @returns {string} Access token
 */
async function authenticate() {
  // Verifica cache do token
  const cached = cache.get('seo_auth_token');
  if (cached) return cached;

  const creds = getCredentials();
  if (!creds) {
    throw new Error('Credenciais Google não configuradas');
  }

  const jwt = createJWT(creds);
  const body = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`;

  const startTime = Date.now();

  const response = await httpRequest({
    hostname: 'oauth2.googleapis.com',
    path: '/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(body)
    }
  }, body);

  telemetry.recordLatency('google', Date.now() - startTime);

  if (response.error) {
    telemetry.increment('seo_google_errors_total');
    throw new Error(`Google Auth Error: ${response.error_description || response.error}`);
  }

  const token = response.access_token;
  cache.set('seo_auth_token', token, config.CACHE_TTL.auth_token);
  console.log(`[SEO] Authenticate → success (token expires in ${response.expires_in}s)`);

  return token;
}

// ============================================================
// HTTP Helper (nativo)
// ============================================================

/**
 * Faz requisição HTTPS com timeout e retry
 * @param {object} options - Opções do https.request
 * @param {string} [body] - Body da requisição
 * @param {number} [retryCount=0] - Contagem de retries
 * @returns {object} Response parseada como JSON
 */
function httpRequest(options, body = null, retryCount = 0) {
  return new Promise((resolve, reject) => {
    options.timeout = config.REQUEST_TIMEOUT;

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ error: true, message: `Response não é JSON (HTTP ${res.statusCode})`, raw: data.substring(0, 200) });
        }
      });
    });

    req.on('error', async (err) => {
      if (retryCount < config.RETRIES) {
        const delay = config.RETRY_DELAY * Math.pow(2, retryCount);
        console.log(`[SEO] Retry ${retryCount + 1}/${config.RETRIES} em ${delay}ms...`);
        await sleep(delay);
        try {
          resolve(await httpRequest(options, body, retryCount + 1));
        } catch (e) {
          reject(e);
        }
      } else {
        reject(err);
      }
    });

    req.on('timeout', () => {
      req.destroy();
      if (retryCount < config.RETRIES) {
        const delay = config.RETRY_DELAY * Math.pow(2, retryCount);
        console.log(`[SEO] Timeout → Retry ${retryCount + 1}/${config.RETRIES} em ${delay}ms...`);
        sleep(delay).then(() => {
          httpRequest(options, body, retryCount + 1).then(resolve).catch(reject);
        });
      } else {
        reject(new Error(`Timeout após ${config.RETRIES} tentativas`));
      }
    });

    if (body) req.write(body);
    req.end();
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================
// Search Console API
// ============================================================

/**
 * Busca dados de desempenho na Search Console API
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 * @param {string[]} dimensions - ['query','page','country','device','date']
 * @returns {object} Dados da API
 */
async function fetchPerformance(startDate, endDate, dimensions = ['query']) {
  const token = await authenticate();
  const encodedSite = encodeURIComponent(config.GOOGLE_SITE_URL);
  const body = JSON.stringify({
    startDate,
    endDate,
    dimensions,
    rowLimit: 100
  });

  const startTime = Date.now();
  telemetry.increment('seo_google_requests_total');

  const response = await httpRequest({
    hostname: 'searchconsole.googleapis.com',
    path: `/webmasters/v3/sites/${encodedSite}/searchAnalytics/query`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    }
  }, body);

  telemetry.recordLatency('google', Date.now() - startTime);

  if (response.error) {
    telemetry.increment('seo_google_errors_total');
    const msg = response.error.message || response.error || 'Erro desconhecido';
    console.error(`[SEO] Google Error → ${typeof response.error === 'object' ? response.error.code : ''} ${msg}`);
    return { error: true, message: msg };
  }

  return response;
}

// ============================================================
// Contrato SEOProvider v1 — Funções públicas
// ============================================================

/**
 * Verifica se a integração está configurada
 */
function isConfigured() {
  return !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
}

/**
 * Status da integração
 */
function getStatus() {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    return { status: 'not_configured', message: 'Configure GOOGLE_SERVICE_ACCOUNT_JSON no Render' };
  }

  const creds = getCredentials();
  if (!creds) {
    return { status: 'invalid', message: 'JSON de credenciais inválido' };
  }

  return { status: 'ready', message: 'Pronto para autenticar' };
}

/**
 * Resumo de métricas (impressões, cliques, CTR, posição)
 * @param {string} period - '7d', '30d', '90d'
 */
async function getSummary(period = '30d') {
  const validPeriod = config.VALID_PERIODS.includes(period) ? period : config.DEFAULT_PERIOD;
  const days = config.periodToDays(validPeriod);
  const cacheKey = `summary_${validPeriod}`;

  if (!isConfigured()) {
    return { impressions: 0, clicks: 0, ctr: 0, position: 0, period: validPeriod, error: true, message: 'Google não configurado' };
  }

  try {
    return await cache.getOrFetch(cacheKey, config.CACHE_TTL.summary, async () => {
      const data = await fetchPerformance(
        config.getDateStr(-days),
        config.getDateStr(-1),
        ['date']
      );

      if (data.error) {
        return { impressions: 0, clicks: 0, ctr: 0, position: 0, period: validPeriod, error: true, message: data.message };
      }

      const rows = data.rows || [];
      const impressions = rows.reduce((sum, r) => sum + (r.impressions || 0), 0);
      const clicks = rows.reduce((sum, r) => sum + (r.clicks || 0), 0);
      const ctr = impressions > 0 ? parseFloat(((clicks / impressions) * 100).toFixed(2)) : 0;
      const position = rows.length > 0
        ? parseFloat((rows.reduce((sum, r) => sum + (r.position || 0), 0) / rows.length).toFixed(1))
        : 0;

      const result = { impressions, clicks, ctr, position, period: validPeriod };
      console.log(`[SEO] Summary → ${validPeriod} → ${impressions} impressions, ${clicks} clicks`);
      return result;
    });
  } catch (e) {
    console.error(`[SEO] Summary Error → ${e.message}`);
    return { impressions: 0, clicks: 0, ctr: 0, position: 0, period: validPeriod, error: true, message: e.message };
  }
}

/**
 * Top queries
 * @param {string} period - '7d', '30d', '90d'
 */
async function getQueries(period = '30d') {
  const validPeriod = config.VALID_PERIODS.includes(period) ? period : config.DEFAULT_PERIOD;
  const days = config.periodToDays(validPeriod);
  const cacheKey = `queries_${validPeriod}`;

  if (!isConfigured()) {
    return { rows: [], total: 0, error: true, message: 'Google não configurado' };
  }

  try {
    return await cache.getOrFetch(cacheKey, config.CACHE_TTL.queries, async () => {
      const data = await fetchPerformance(
        config.getDateStr(-days),
        config.getDateStr(-1),
        ['query']
      );

      if (data.error) {
        return { rows: [], total: 0, error: true, message: data.message };
      }

      const rows = (data.rows || []).map(r => ({
        query: r.keys ? r.keys[0] : '',
        clicks: r.clicks || 0,
        impressions: r.impressions || 0,
        ctr: r.ctr ? parseFloat((r.ctr * 100).toFixed(2)) : 0,
        position: r.position ? parseFloat(r.position.toFixed(1)) : 0
      }));

      console.log(`[SEO] Queries → ${validPeriod} → ${rows.length} queries`);
      return { rows, total: rows.length };
    });
  } catch (e) {
    console.error(`[SEO] Queries Error → ${e.message}`);
    return { rows: [], total: 0, error: true, message: e.message };
  }
}

/**
 * Top páginas
 * @param {string} period - '7d', '30d', '90d'
 */
async function getPages(period = '30d') {
  const validPeriod = config.VALID_PERIODS.includes(period) ? period : config.DEFAULT_PERIOD;
  const days = config.periodToDays(validPeriod);
  const cacheKey = `pages_${validPeriod}`;

  if (!isConfigured()) {
    return { rows: [], total: 0, error: true, message: 'Google não configurado' };
  }

  try {
    return await cache.getOrFetch(cacheKey, config.CACHE_TTL.pages, async () => {
      const data = await fetchPerformance(
        config.getDateStr(-days),
        config.getDateStr(-1),
        ['page']
      );

      if (data.error) {
        return { rows: [], total: 0, error: true, message: data.message };
      }

      const rows = (data.rows || []).map(r => ({
        page: r.keys ? r.keys[0] : '',
        clicks: r.clicks || 0,
        impressions: r.impressions || 0,
        ctr: r.ctr ? parseFloat((r.ctr * 100).toFixed(2)) : 0,
        position: r.position ? parseFloat(r.position.toFixed(1)) : 0
      }));

      console.log(`[SEO] Pages → ${validPeriod} → ${rows.length} pages`);
      return { rows, total: rows.length };
    });
  } catch (e) {
    console.error(`[SEO] Pages Error → ${e.message}`);
    return { rows: [], total: 0, error: true, message: e.message };
  }
}

/**
 * Dados por dispositivo
 * @param {string} period - '7d', '30d', '90d'
 */
async function getDevices(period = '30d') {
  const validPeriod = config.VALID_PERIODS.includes(period) ? period : config.DEFAULT_PERIOD;
  const days = config.periodToDays(validPeriod);
  const cacheKey = `devices_${validPeriod}`;

  if (!isConfigured()) {
    return { rows: [], error: true, message: 'Google não configurado' };
  }

  try {
    return await cache.getOrFetch(cacheKey, config.CACHE_TTL.devices, async () => {
      const data = await fetchPerformance(
        config.getDateStr(-days),
        config.getDateStr(-1),
        ['device']
      );

      if (data.error) {
        return { rows: [], error: true, message: data.message };
      }

      const rows = (data.rows || []).map(r => ({
        device: r.keys ? r.keys[0] : '',
        clicks: r.clicks || 0,
        impressions: r.impressions || 0,
        ctr: r.ctr ? parseFloat((r.ctr * 100).toFixed(2)) : 0,
        position: r.position ? parseFloat(r.position.toFixed(1)) : 0
      }));

      console.log(`[SEO] Devices → ${validPeriod} → ${rows.length} devices`);
      return { rows };
    });
  } catch (e) {
    console.error(`[SEO] Devices Error → ${e.message}`);
    return { rows: [], error: true, message: e.message };
  }
}

/**
 * Dados por país
 * @param {string} period - '7d', '30d', '90d'
 */
async function getCountries(period = '30d') {
  const validPeriod = config.VALID_PERIODS.includes(period) ? period : config.DEFAULT_PERIOD;
  const days = config.periodToDays(validPeriod);
  const cacheKey = `countries_${validPeriod}`;

  if (!isConfigured()) {
    return { rows: [], error: true, message: 'Google não configurado' };
  }

  try {
    return await cache.getOrFetch(cacheKey, config.CACHE_TTL.countries, async () => {
      const data = await fetchPerformance(
        config.getDateStr(-days),
        config.getDateStr(-1),
        ['country']
      );

      if (data.error) {
        return { rows: [], error: true, message: data.message };
      }

      const rows = (data.rows || []).map(r => ({
        country: r.keys ? r.keys[0] : '',
        clicks: r.clicks || 0,
        impressions: r.impressions || 0,
        ctr: r.ctr ? parseFloat((r.ctr * 100).toFixed(2)) : 0,
        position: r.position ? parseFloat(r.position.toFixed(1)) : 0
      }));

      console.log(`[SEO] Countries → ${validPeriod} → ${rows.length} countries`);
      return { rows };
    });
  } catch (e) {
    console.error(`[SEO] Countries Error → ${e.message}`);
    return { rows: [], error: true, message: e.message };
  }
}

// CLI
if (require.main === module) {
  const status = getStatus();
  console.log('\n📊 Google Search Console — SEOProvider v1\n');
  console.log(`  Status: ${status.status}`);
  console.log(`  ${status.message}\n`);
}

module.exports = {
  // Contrato SEOProvider v1
  getStatus,
  getSummary,
  getQueries,
  getPages,
  getDevices,
  getCountries,
  // Internos (para health check)
  authenticate,
  isConfigured,
  fetchPerformance
};
