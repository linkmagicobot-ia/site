/**
 * seo/bing/index.js — Bing Webmaster Tools Provider (SEOProvider v1)
 * 
 * Zero dependências externas (https nativo).
 * 
 * REGRAS:
 * - Este módulo é exclusivamente um provider de dados
 * - Retorna EXCLUSIVAMENTE JSON padronizado
 * - Nunca HTML, nunca DOM, nunca template
 * - Nunca registra API keys nos logs
 * - Em caso de erro: { error: true, message: '...' }
 * - Nunca undefined, nunca null, nunca string solta
 */

'use strict';

const https = require('https');
const config = require('../config');
const cache = require('../cache');
const telemetry = require('../telemetry');

// ============================================================
// HTTP Helper
// ============================================================

/**
 * Faz requisição à API do Bing Webmaster
 * @param {string} endpoint - Endpoint da API
 * @param {number} [retryCount=0] - Contagem de retries
 * @returns {object} Response JSON
 */
function apiRequest(endpoint, retryCount = 0) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.BING_WEBMASTER_API_KEY;
    if (!apiKey) {
      resolve({ error: true, message: 'BING_WEBMASTER_API_KEY não configurada' });
      return;
    }

    const encodedSite = encodeURIComponent(config.SITE_URL);
    const fullPath = `${config.BING_API_BASE_PATH}/${endpoint}?siteUrl=${encodedSite}&apikey=${apiKey}`;

    const options = {
      hostname: config.BING_API_HOST,
      port: 443,
      path: fullPath,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      timeout: config.REQUEST_TIMEOUT
    };

    const startTime = Date.now();
    telemetry.increment('seo_bing_requests_total');

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        telemetry.recordLatency('bing', Date.now() - startTime);

        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 400) {
            telemetry.increment('seo_bing_errors_total');
            console.error(`[SEO] Bing Error → ${res.statusCode}`);
            resolve({ error: true, message: `Bing API retornou HTTP ${res.statusCode}` });
          } else {
            resolve(parsed);
          }
        } catch (e) {
          resolve({ error: true, message: `Response não é JSON (HTTP ${res.statusCode})` });
        }
      });
    });

    req.on('error', async (err) => {
      telemetry.increment('seo_bing_errors_total');
      if (retryCount < config.RETRIES) {
        const delay = config.RETRY_DELAY * Math.pow(2, retryCount);
        console.log(`[SEO] Bing Retry ${retryCount + 1}/${config.RETRIES} em ${delay}ms...`);
        await sleep(delay);
        try {
          resolve(await apiRequest(endpoint, retryCount + 1));
        } catch (e) {
          reject(e);
        }
      } else {
        reject(err);
      }
    });

    req.on('timeout', () => {
      req.destroy();
      telemetry.increment('seo_bing_errors_total');
      if (retryCount < config.RETRIES) {
        const delay = config.RETRY_DELAY * Math.pow(2, retryCount);
        console.log(`[SEO] Bing Timeout → Retry ${retryCount + 1}/${config.RETRIES}...`);
        sleep(delay).then(() => {
          apiRequest(endpoint, retryCount + 1).then(resolve).catch(reject);
        });
      } else {
        reject(new Error(`Bing Timeout após ${config.RETRIES} tentativas`));
      }
    });

    req.end();
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================
// Contrato SEOProvider v1
// ============================================================

/**
 * Verifica se a integração está configurada
 */
function isConfigured() {
  return !!process.env.BING_WEBMASTER_API_KEY;
}

/**
 * Status da integração
 */
function getStatus() {
  if (!process.env.BING_WEBMASTER_API_KEY) {
    return { status: 'not_configured', message: 'Configure BING_WEBMASTER_API_KEY no Render' };
  }
  return { status: 'ready', message: 'Pronto para consultar' };
}

/**
 * Busca backlinks
 * @returns {object} { total, domains: [{ url, count }] }
 */
async function getBacklinks() {
  if (!isConfigured()) {
    return { total: 0, domains: [], error: true, message: 'Bing não configurado' };
  }

  try {
    return await cache.getOrFetch('backlinks', config.CACHE_TTL.backlinks, async () => {
      const data = await apiRequest('GetLinkCounts');

      if (data.error) {
        return { total: 0, domains: [], error: true, message: data.message };
      }

      // A API retorna um array de objetos com Url e LinkCount
      let total = 0;
      let domains = [];

      if (Array.isArray(data)) {
        domains = data.map(item => ({
          url: item.Url || item.url || '',
          count: item.LinkCount || item.linkCount || item.count || 0
        }));
        total = domains.reduce((sum, d) => sum + d.count, 0);
      } else if (data.d && Array.isArray(data.d)) {
        domains = data.d.map(item => ({
          url: item.Url || '',
          count: item.LinkCount || 0
        }));
        total = domains.reduce((sum, d) => sum + d.count, 0);
      } else if (typeof data === 'number') {
        total = data;
      }

      console.log(`[SEO] Bing Backlinks → ${total} total, ${domains.length} domains`);
      return { total, domains };
    });
  } catch (e) {
    console.error(`[SEO] Bing Backlinks Error → ${e.message}`);
    return { total: 0, domains: [], error: true, message: e.message };
  }
}

/**
 * Verifica se a API está acessível (para health check)
 */
async function checkHealth() {
  if (!isConfigured()) {
    return { api: false, message: 'Não configurado' };
  }

  try {
    const result = await apiRequest('GetSites');
    return { api: !result.error, message: result.error ? result.message : 'OK' };
  } catch (e) {
    return { api: false, message: e.message };
  }
}

// CLI
if (require.main === module) {
  const status = getStatus();
  console.log('\n📊 Bing Webmaster Tools — SEOProvider v1\n');
  console.log(`  Status: ${status.status}`);
  console.log(`  ${status.message}\n`);
}

module.exports = {
  // Contrato SEOProvider v1
  getStatus,
  getBacklinks,
  // Internos (para health check)
  checkHealth,
  isConfigured
};
