/**
 * seo/indexnow.js — Suporte ao protocolo IndexNow
 * Notifica Bing, Yandex e Naver sobre URLs novas/atualizadas.
 * 
 * Uso:
 *   node seo/indexnow.js generate-key
 *   node seo/indexnow.js submit <url>
 *   node seo/indexnow.js all
 * 
 * Env: INDEXNOW_KEY, INDEXNOW_HOST (padrão: site.linkmagico.app.br)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const HOST = process.env.INDEXNOW_HOST || 'site.linkmagico.app.br';
const KEY = process.env.INDEXNOW_KEY || '';
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const SITEMAP_PATH = path.join(PUBLIC_DIR, 'sitemap.xml');
const INDEXNOW_API = 'api.indexnow.org';

/**
 * Gera uma chave IndexNow e salva o arquivo de verificação
 * @returns {string} Chave gerada
 */
function generateKey() {
  const key = crypto.randomUUID().replace(/-/g, '');
  const keyFilePath = path.join(PUBLIC_DIR, `${key}.txt`);
  fs.writeFileSync(keyFilePath, key);
  console.log(`✅ Chave gerada: ${key}`);
  console.log(`📄 Arquivo de verificação: public/${key}.txt`);
  console.log(`\n⚠️  Configure a variável de ambiente:`);
  console.log(`   INDEXNOW_KEY=${key}\n`);
  return key;
}

/**
 * Envia URLs ao IndexNow API
 * @param {string[]} urls - Lista de URLs completas
 * @returns {Promise<{status: number, body: string}>}
 */
function submitUrls(urls) {
  return new Promise((resolve, reject) => {
    if (!KEY) {
      reject(new Error('INDEXNOW_KEY não configurada. Execute: node seo/indexnow.js generate-key'));
      return;
    }

    const payload = JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: `https://${HOST}/${KEY}.txt`,
      urlList: urls
    });

    const options = {
      hostname: INDEXNOW_API,
      port: 443,
      path: '/indexnow',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 15000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(payload);
    req.end();
  });
}

/**
 * Envia uma única URL
 * @param {string} url - URL completa
 */
async function notifyUrlChange(url) {
  const fullUrl = url.startsWith('http') ? url : `https://${HOST}${url}`;
  console.log(`📤 Enviando: ${fullUrl}`);
  try {
    const result = await submitUrls([fullUrl]);
    if (result.status === 200 || result.status === 202) {
      console.log(`  ✅ Aceito (HTTP ${result.status})`);
    } else {
      console.log(`  ⚠️  HTTP ${result.status}: ${result.body}`);
    }
    return result;
  } catch (e) {
    console.log(`  ❌ Erro: ${e.message}`);
    throw e;
  }
}

/**
 * Extrai URLs do sitemap e envia todas
 */
async function submitSitemap() {
  if (!fs.existsSync(SITEMAP_PATH)) {
    console.error('❌ sitemap.xml não encontrado em public/');
    process.exit(1);
  }

  const content = fs.readFileSync(SITEMAP_PATH, 'utf-8');
  const urls = [];
  const regex = /<loc>([^<]+)<\/loc>/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    urls.push(match[1]);
  }

  console.log(`📋 ${urls.length} URLs encontradas no sitemap\n`);

  // IndexNow aceita até 10.000 URLs por requisição
  const batchSize = 500;
  let sent = 0;

  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    console.log(`📤 Lote ${Math.floor(i/batchSize)+1}: ${batch.length} URLs...`);
    try {
      const result = await submitUrls(batch);
      sent += batch.length;
      if (result.status === 200 || result.status === 202) {
        console.log(`  ✅ Aceito (HTTP ${result.status})`);
      } else {
        console.log(`  ⚠️  HTTP ${result.status}: ${result.body}`);
      }
    } catch (e) {
      console.log(`  ❌ Erro: ${e.message}`);
    }
  }

  console.log(`\n✅ ${sent}/${urls.length} URLs enviadas ao IndexNow`);
}

// CLI
if (require.main === module) {
  const cmd = process.argv[2];
  
  if (cmd === 'generate-key') {
    generateKey();
  } else if (cmd === 'submit') {
    const url = process.argv[3];
    if (!url) { console.error('Uso: node seo/indexnow.js submit <url>'); process.exit(1); }
    notifyUrlChange(url).catch(() => process.exit(1));
  } else if (cmd === 'all') {
    submitSitemap().catch(() => process.exit(1));
  } else {
    console.log('Uso:');
    console.log('  node seo/indexnow.js generate-key     Gera chave IndexNow');
    console.log('  node seo/indexnow.js submit <url>      Envia URL única');
    console.log('  node seo/indexnow.js all               Envia todas do sitemap');
  }
}

module.exports = { generateKey, submitUrls, notifyUrlChange, submitSitemap };
