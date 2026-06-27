/**
 * seo/search-console/index.js — Integração com Google Search Console API
 * Preparado para receber credenciais. Sem dependências externas.
 * 
 * Quando googleapis estiver instalado:
 *   npm install googleapis
 *   Configurar GOOGLE_APPLICATION_CREDENTIALS ou chave de serviço
 */

const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://site.linkmagico.app.br';

let googleapis = null;
try {
  googleapis = require('googleapis');
} catch (e) {
  // googleapis não instalado — modo degradado
}

/**
 * Verifica se a integração está configurada
 */
function isConfigured() {
  return !!(googleapis && (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GOOGLE_SC_KEY_FILE));
}

/**
 * Status da integração
 */
function getStatus() {
  if (!googleapis) {
    return { status: 'not_installed', message: 'googleapis não instalado. Execute: npm install googleapis' };
  }
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.GOOGLE_SC_KEY_FILE) {
    return { status: 'not_configured', message: 'Configure GOOGLE_APPLICATION_CREDENTIALS com o caminho da chave de serviço' };
  }
  return { status: 'ready', message: 'Pronto para autenticar' };
}

/**
 * Autentica com a API
 * @param {string} [keyFilePath] - Caminho do arquivo de chave JSON
 * @returns {object} Cliente autenticado do Search Console
 */
async function authenticate(keyFilePath) {
  if (!googleapis) {
    throw new Error('googleapis não instalado. Execute: npm install googleapis');
  }

  const keyFile = keyFilePath || process.env.GOOGLE_SC_KEY_FILE || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!keyFile || !fs.existsSync(keyFile)) {
    throw new Error(`Arquivo de chave não encontrado: ${keyFile}`);
  }

  const { google } = googleapis;
  const auth = new google.auth.GoogleAuth({
    keyFile,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly']
  });

  const client = await auth.getClient();
  return google.searchconsole({ version: 'v1', auth: client });
}

/**
 * Busca dados de desempenho
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 * @param {string[]} [dimensions] - ['query','page','country','device','date']
 */
async function fetchPerformance(startDate, endDate, dimensions = ['query']) {
  if (!isConfigured()) return getStatus();
  const sc = await authenticate();
  const res = await sc.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: { startDate, endDate, dimensions, rowLimit: 1000 }
  });
  return res.data;
}

/**
 * Busca status de cobertura de indexação
 */
async function fetchCoverage() {
  if (!isConfigured()) return getStatus();
  const sc = await authenticate();
  // Coverage data via URL Inspection API
  return { status: 'not_available', message: 'Coverage requer URL Inspection API individual' };
}

/**
 * Busca páginas indexadas
 */
async function fetchPages() {
  if (!isConfigured()) return getStatus();
  return fetchPerformance(
    getDateStr(-90), getDateStr(0), ['page']
  );
}

/**
 * Busca consultas de pesquisa
 * @param {object} options - { startDate, endDate, rowLimit }
 */
async function fetchQueries(options = {}) {
  if (!isConfigured()) return getStatus();
  const start = options.startDate || getDateStr(-28);
  const end = options.endDate || getDateStr(0);
  return fetchPerformance(start, end, ['query']);
}

/**
 * Busca dados por país
 */
async function fetchCountries() {
  if (!isConfigured()) return getStatus();
  return fetchPerformance(getDateStr(-28), getDateStr(0), ['country']);
}

/**
 * Busca dados por dispositivo
 */
async function fetchDevices() {
  if (!isConfigured()) return getStatus();
  return fetchPerformance(getDateStr(-28), getDateStr(0), ['device']);
}

/**
 * Busca CTR médio
 */
async function fetchCTR() {
  if (!isConfigured()) return getStatus();
  const data = await fetchPerformance(getDateStr(-28), getDateStr(0), ['date']);
  if (data.rows) {
    const totalClicks = data.rows.reduce((sum, r) => sum + r.clicks, 0);
    const totalImpressions = data.rows.reduce((sum, r) => sum + r.impressions, 0);
    return { ctr: totalImpressions > 0 ? (totalClicks / totalImpressions * 100).toFixed(2) : 0, clicks: totalClicks, impressions: totalImpressions };
  }
  return data;
}

/**
 * Busca posição média
 */
async function fetchPositions() {
  if (!isConfigured()) return getStatus();
  const data = await fetchPerformance(getDateStr(-28), getDateStr(0), ['query']);
  if (data.rows) {
    const avgPosition = data.rows.reduce((sum, r) => sum + r.position, 0) / data.rows.length;
    return { averagePosition: avgPosition.toFixed(1), totalQueries: data.rows.length };
  }
  return data;
}

/** Helper: data relativa */
function getDateStr(daysOffset) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().slice(0, 10);
}

// CLI
if (require.main === module) {
  const status = getStatus();
  console.log('\n📊 Google Search Console — Status\n');
  console.log(`  Status: ${status.status}`);
  console.log(`  ${status.message}\n`);

  if (status.status === 'not_installed') {
    console.log('  Para instalar:');
    console.log('  npm install googleapis\n');
  } else if (status.status === 'not_configured') {
    console.log('  Para configurar:');
    console.log('  1. Criar Service Account no Google Cloud Console');
    console.log('  2. Baixar chave JSON');
    console.log('  3. Adicionar email do Service Account como usuário no Search Console');
    console.log('  4. Definir: GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json\n');
  }
}

module.exports = { authenticate, fetchPerformance, fetchCoverage, fetchPages, fetchQueries, fetchCountries, fetchDevices, fetchCTR, fetchPositions, getStatus, isConfigured };
