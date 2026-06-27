/**
 * seo/bing/index.js — Integração com Bing Webmaster Tools API
 * Preparado para receber API key. Sem dependências externas.
 * 
 * Configurar: BING_WEBMASTER_API_KEY
 * Docs: https://learn.microsoft.com/en-us/bingwebmaster/
 */

const https = require('https');

const SITE_URL = 'https://site.linkmagico.app.br';
const API_BASE = 'ssl.bing.com';
const API_KEY = process.env.BING_WEBMASTER_API_KEY || '';

/**
 * Verifica se a integração está configurada
 */
function isConfigured() {
  return !!API_KEY;
}

/**
 * Status da integração
 */
function getStatus() {
  if (!API_KEY) {
    return { status: 'not_configured', message: 'Configure BING_WEBMASTER_API_KEY com sua chave de API' };
  }
  return { status: 'ready', message: 'Pronto para consultar' };
}

/**
 * Faz requisição à API do Bing Webmaster
 * @param {string} endpoint
 * @param {string} [method='GET']
 * @param {object} [body]
 */
function apiRequest(endpoint, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    if (!API_KEY) {
      resolve(getStatus());
      return;
    }

    const encodedSite = encodeURIComponent(SITE_URL);
    const fullPath = `/webmaster/api.svc/json/${endpoint}?siteUrl=${encodedSite}&apikey=${API_KEY}`;

    const options = {
      hostname: API_BASE,
      port: 443,
      path: fullPath,
      method,
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ raw: data, statusCode: res.statusCode });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });

    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

/**
 * Autentica verificando se a chave funciona
 * @param {string} [apiKey] - Chave alternativa
 */
async function authenticate(apiKey) {
  if (apiKey) process.env.BING_WEBMASTER_API_KEY = apiKey;
  if (!isConfigured()) return getStatus();

  try {
    const result = await apiRequest('GetSites');
    return { status: 'authenticated', sites: result };
  } catch (e) {
    return { status: 'error', message: e.message };
  }
}

/**
 * Busca dados de desempenho
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 */
async function fetchPerformance(startDate, endDate) {
  if (!isConfigured()) return getStatus();
  return apiRequest('GetQueryStats');
}

/**
 * Busca páginas indexadas
 */
async function fetchIndexedPages() {
  if (!isConfigured()) return getStatus();
  return apiRequest('GetUrlTrafficInfo');
}

/**
 * Busca palavras-chave
 */
async function fetchKeywords() {
  if (!isConfigured()) return getStatus();
  return apiRequest('GetQueryStats');
}

/**
 * Busca cliques
 */
async function fetchClicks() {
  if (!isConfigured()) return getStatus();
  return apiRequest('GetPageStats');
}

/**
 * Busca backlinks
 */
async function fetchBacklinks() {
  if (!isConfigured()) return getStatus();
  return apiRequest('GetLinkCounts');
}

// CLI
if (require.main === module) {
  const status = getStatus();
  console.log('\n📊 Bing Webmaster Tools — Status\n');
  console.log(`  Status: ${status.status}`);
  console.log(`  ${status.message}\n`);

  if (status.status === 'not_configured') {
    console.log('  Para configurar:');
    console.log('  1. Acesse https://www.bing.com/webmasters');
    console.log('  2. Adicione seu site');
    console.log('  3. Vá em Settings > API Access');
    console.log('  4. Copie a API Key');
    console.log('  5. Defina: BING_WEBMASTER_API_KEY=sua_chave\n');
  }
}

module.exports = { authenticate, fetchPerformance, fetchIndexedPages, fetchKeywords, fetchClicks, fetchBacklinks, getStatus, isConfigured };
