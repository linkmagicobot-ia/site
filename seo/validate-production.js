/**
 * seo/validate-production.js
 * 
 * Etapa 1 — Validação de produção
 * Verifica HTTPS, canonical, robots, sitemap, status, headers, compressão e cache.
 * 
 * Uso: node seo/validate-production.js [domínio]
 * Padrão: site.linkmagico.app.br
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const DOMAIN = process.argv[2] || 'site.linkmagico.app.br';
const BASE_URL = `https://${DOMAIN}`;

const results = {
  domain: DOMAIN,
  timestamp: new Date().toISOString(),
  checks: [],
  summary: { passed: 0, failed: 0, warnings: 0 }
};

function addResult(category, check, status, detail) {
  results.checks.push({ category, check, status, detail });
  if (status === 'PASS') results.summary.passed++;
  else if (status === 'FAIL') results.summary.failed++;
  else results.summary.warnings++;
}

function fetchUrl(url, options = {}) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const req = proto.get(url, { timeout: 10000, ...options }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ 
        statusCode: res.statusCode, 
        headers: res.headers, 
        body: data,
        url: res.url || url
      }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

async function checkHTTPS() {
  console.log('  🔒 Verificando HTTPS...');
  try {
    const res = await fetchUrl(BASE_URL);
    if (res.statusCode === 200 || res.statusCode === 301 || res.statusCode === 302) {
      addResult('Segurança', 'HTTPS ativo', 'PASS', `Status: ${res.statusCode}`);
    } else {
      addResult('Segurança', 'HTTPS ativo', 'FAIL', `Status inesperado: ${res.statusCode}`);
    }
  } catch (e) {
    addResult('Segurança', 'HTTPS ativo', 'FAIL', e.message);
  }
}

async function checkHTTPRedirect() {
  console.log('  🔄 Verificando redirect HTTP → HTTPS...');
  try {
    const res = await fetchUrl(`http://${DOMAIN}`);
    if (res.statusCode === 301 || res.statusCode === 302) {
      const location = res.headers.location || '';
      if (location.startsWith('https://')) {
        addResult('Segurança', 'Redirect HTTP→HTTPS', 'PASS', `301 → ${location}`);
      } else {
        addResult('Segurança', 'Redirect HTTP→HTTPS', 'WARN', `Redirect para: ${location}`);
      }
    } else {
      addResult('Segurança', 'Redirect HTTP→HTTPS', 'WARN', `Status: ${res.statusCode} (esperado 301)`);
    }
  } catch (e) {
    addResult('Segurança', 'Redirect HTTP→HTTPS', 'WARN', `Não testável: ${e.message}`);
  }
}

async function checkHeaders() {
  console.log('  📋 Verificando headers de segurança...');
  try {
    const res = await fetchUrl(BASE_URL);
    const h = res.headers;
    
    // HSTS
    if (h['strict-transport-security']) {
      const maxAge = h['strict-transport-security'].match(/max-age=(\d+)/);
      const age = maxAge ? parseInt(maxAge[1]) : 0;
      if (age >= 31536000) {
        addResult('Headers', 'HSTS', 'PASS', h['strict-transport-security']);
      } else {
        addResult('Headers', 'HSTS', 'WARN', `max-age=${age} (recomendado: 31536000)`);
      }
    } else {
      addResult('Headers', 'HSTS', 'FAIL', 'Header ausente');
    }

    // X-Content-Type-Options
    if (h['x-content-type-options'] === 'nosniff') {
      addResult('Headers', 'X-Content-Type-Options', 'PASS', 'nosniff');
    } else {
      addResult('Headers', 'X-Content-Type-Options', 'WARN', h['x-content-type-options'] || 'Ausente');
    }

    // X-Frame-Options
    if (h['x-frame-options']) {
      addResult('Headers', 'X-Frame-Options', 'PASS', h['x-frame-options']);
    } else {
      addResult('Headers', 'X-Frame-Options', 'WARN', 'Ausente');
    }

    // Content-Security-Policy
    if (h['content-security-policy']) {
      addResult('Headers', 'Content-Security-Policy', 'PASS', 'Presente');
    } else {
      addResult('Headers', 'Content-Security-Policy', 'WARN', 'Ausente');
    }

    // Compression
    if (h['content-encoding'] && (h['content-encoding'].includes('gzip') || h['content-encoding'].includes('br'))) {
      addResult('Performance', 'Compressão', 'PASS', h['content-encoding']);
    } else {
      addResult('Performance', 'Compressão', 'WARN', 'Sem compressão detectada (pode estar no CDN)');
    }

    // Cache
    if (h['etag'] || h['last-modified'] || (h['cache-control'] && h['cache-control'].includes('max-age'))) {
      addResult('Performance', 'Cache headers', 'PASS', `ETag: ${!!h['etag']}, Cache-Control: ${h['cache-control'] || 'N/A'}`);
    } else {
      addResult('Performance', 'Cache headers', 'WARN', 'Sem cache headers');
    }

    // Referrer-Policy
    if (h['referrer-policy']) {
      addResult('Headers', 'Referrer-Policy', 'PASS', h['referrer-policy']);
    } else {
      addResult('Headers', 'Referrer-Policy', 'WARN', 'Ausente');
    }

  } catch (e) {
    addResult('Headers', 'Verificação de headers', 'FAIL', e.message);
  }
}

async function checkRobots() {
  console.log('  🤖 Verificando robots.txt...');
  try {
    const res = await fetchUrl(`${BASE_URL}/robots.txt`);
    if (res.statusCode === 200) {
      const hasSitemap = res.body.toLowerCase().includes('sitemap');
      const hasAllow = res.body.toLowerCase().includes('allow');
      addResult('SEO', 'robots.txt', 'PASS', `Status 200, Sitemap: ${hasSitemap}, Allow: ${hasAllow}`);
      if (!hasSitemap) {
        addResult('SEO', 'robots.txt contém Sitemap', 'WARN', 'Adicionar referência ao sitemap.xml');
      }
    } else {
      addResult('SEO', 'robots.txt', 'FAIL', `Status: ${res.statusCode}`);
    }
  } catch (e) {
    addResult('SEO', 'robots.txt', 'FAIL', e.message);
  }
}

async function checkSitemap() {
  console.log('  🗺️  Verificando sitemap.xml...');
  try {
    const res = await fetchUrl(`${BASE_URL}/sitemap.xml`);
    if (res.statusCode === 200) {
      const urls = res.body.match(/<loc>([^<]+)<\/loc>/g) || [];
      const urlCount = urls.length;
      addResult('SEO', 'sitemap.xml', 'PASS', `Status 200, ${urlCount} URLs`);
      
      if (urlCount === 0) {
        addResult('SEO', 'sitemap.xml contém URLs', 'FAIL', 'Nenhuma URL encontrada');
      } else {
        addResult('SEO', `sitemap.xml URLs (${urlCount})`, 'PASS', `${urlCount} URLs listadas`);
      }

      // Verificar XML válido
      if (res.body.includes('<?xml') && res.body.includes('</urlset>')) {
        addResult('SEO', 'sitemap.xml formato XML', 'PASS', 'XML válido');
      } else {
        addResult('SEO', 'sitemap.xml formato XML', 'FAIL', 'XML inválido ou incompleto');
      }
    } else {
      addResult('SEO', 'sitemap.xml', 'FAIL', `Status: ${res.statusCode}`);
    }
  } catch (e) {
    addResult('SEO', 'sitemap.xml', 'FAIL', e.message);
  }
}

async function checkCanonical() {
  console.log('  🔗 Verificando canonical da homepage...');
  try {
    const res = await fetchUrl(BASE_URL);
    if (res.body.includes('rel="canonical"')) {
      const match = res.body.match(/rel="canonical"\s+href="([^"]+)"/);
      if (match) {
        addResult('SEO', 'Canonical (homepage)', 'PASS', match[1]);
      } else {
        addResult('SEO', 'Canonical (homepage)', 'WARN', 'Tag existe mas href não extraído');
      }
    } else {
      addResult('SEO', 'Canonical (homepage)', 'WARN', 'Tag canonical ausente na homepage');
    }
  } catch (e) {
    addResult('SEO', 'Canonical', 'FAIL', e.message);
  }
}

async function checkSamplePages() {
  console.log('  📄 Verificando páginas-amostra...');
  const pages = [
    '/', '/sobre', '/clinicas', '/ecommerce', '/glossario',
    '/blog/', '/ferramentas/calculadora-roi', '/templates/clinicas',
    '/glossario/chatbot', '/docs'
  ];
  
  for (const page of pages) {
    try {
      const res = await fetchUrl(`${BASE_URL}${page}`);
      if (res.statusCode === 200) {
        addResult('Páginas', `GET ${page}`, 'PASS', `200 OK (${(res.body.length/1024).toFixed(1)}KB)`);
      } else {
        addResult('Páginas', `GET ${page}`, 'FAIL', `Status: ${res.statusCode}`);
      }
    } catch (e) {
      addResult('Páginas', `GET ${page}`, 'FAIL', e.message);
    }
  }
}

async function checkHealth() {
  console.log('  💓 Verificando health check...');
  try {
    const res = await fetchUrl(`${BASE_URL}/health`);
    if (res.statusCode === 200) {
      const data = JSON.parse(res.body);
      addResult('Infraestrutura', 'Health check', 'PASS', `Status: ${data.status}`);
    } else {
      addResult('Infraestrutura', 'Health check', 'FAIL', `Status: ${res.statusCode}`);
    }
  } catch (e) {
    addResult('Infraestrutura', 'Health check', 'FAIL', e.message);
  }
}

function generateReport() {
  const reportsDir = path.join(__dirname, '..', 'reports');
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

  // JSON
  fs.writeFileSync(
    path.join(reportsDir, 'production-validation.json'),
    JSON.stringify(results, null, 2)
  );

  // Markdown
  let md = `# Validação de Produção — ${DOMAIN}\n\n`;
  md += `**Data:** ${results.timestamp}\n\n`;
  md += `## Resumo\n\n`;
  md += `| Resultado | Total |\n|---|---|\n`;
  md += `| ✅ Aprovado | ${results.summary.passed} |\n`;
  md += `| ❌ Reprovado | ${results.summary.failed} |\n`;
  md += `| ⚠️ Aviso | ${results.summary.warnings} |\n`;
  md += `| **Total** | **${results.checks.length}** |\n\n`;
  md += `## Detalhes\n\n`;

  const categories = [...new Set(results.checks.map(c => c.category))];
  for (const cat of categories) {
    md += `### ${cat}\n\n`;
    md += `| Verificação | Status | Detalhe |\n|---|---|---|\n`;
    for (const c of results.checks.filter(c => c.category === cat)) {
      const icon = c.status === 'PASS' ? '✅' : c.status === 'FAIL' ? '❌' : '⚠️';
      md += `| ${c.check} | ${icon} ${c.status} | ${c.detail} |\n`;
    }
    md += '\n';
  }

  fs.writeFileSync(path.join(reportsDir, 'production-validation.md'), md);
  return md;
}

async function main() {
  console.log(`\n╔══════════════════════════════════════════╗`);
  console.log(`║  🔍 Validação de Produção               ║`);
  console.log(`║  📍 ${DOMAIN}     ║`);
  console.log(`╚══════════════════════════════════════════╝\n`);

  await checkHTTPS();
  await checkHTTPRedirect();
  await checkHeaders();
  await checkRobots();
  await checkSitemap();
  await checkCanonical();
  await checkHealth();
  await checkSamplePages();

  const md = generateReport();

  console.log(`\n${'═'.repeat(50)}`);
  console.log(`  ✅ ${results.summary.passed} aprovados`);
  console.log(`  ❌ ${results.summary.failed} reprovados`);
  console.log(`  ⚠️  ${results.summary.warnings} avisos`);
  console.log(`${'═'.repeat(50)}`);
  console.log(`\n📄 Relatório: reports/production-validation.md`);
  console.log(`📊 Dados: reports/production-validation.json\n`);

  process.exit(results.summary.failed > 0 ? 1 : 0);
}

if (require.main === module) {
  main().catch(e => {
    console.error('Erro fatal:', e.message);
    process.exit(1);
  });
}

module.exports = { fetchUrl, checkHTTPS, checkHeaders, checkRobots, checkSitemap };
