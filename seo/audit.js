/**
 * seo/audit.js — Auditoria SEO automatizada
 * Verifica title, description, canonical, OG, schema, H1, links, robots, sitemap.
 * 
 * Uso: node seo/audit.js
 * npm: npm run seo:audit
 * Saída: reports/seo-audit.json, reports/seo-audit.md
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const REPORTS_DIR = path.join(__dirname, '..', 'reports');

const results = { timestamp: new Date().toISOString(), pages: [], global: [], summary: { total: 0, passed: 0, warnings: 0, errors: 0 } };

function addCheck(page, check, status, detail) {
  const entry = { page, check, status, detail };
  results.pages.push(entry);
  results.summary.total++;
  if (status === 'PASS') results.summary.passed++;
  else if (status === 'WARN') results.summary.warnings++;
  else results.summary.errors++;
}

function addGlobal(check, status, detail) {
  results.global.push({ check, status, detail });
  results.summary.total++;
  if (status === 'PASS') results.summary.passed++;
  else if (status === 'WARN') results.summary.warnings++;
  else results.summary.errors++;
}

/**
 * Coleta todos os .html recursivamente
 */
function getHtmlFiles(dir, base = dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Pular admin/
      if (entry.name === 'admin') continue;
      files.push(...getHtmlFiles(full, base));
    } else if (entry.name.endsWith('.html')) {
      files.push(full);
    }
  }
  return files;
}

/**
 * Audita uma página HTML individual
 */
function auditPage(filePath) {
  const rel = path.relative(PUBLIC_DIR, filePath).replace(/\\/g, '/');
  const content = fs.readFileSync(filePath, 'utf-8');

  // Title
  const titleMatch = content.match(/<title[^>]*>([^<]*)<\/title>/i);
  if (titleMatch && titleMatch[1].trim()) {
    addCheck(rel, 'Title', 'PASS', titleMatch[1].trim().substring(0, 80));
  } else {
    addCheck(rel, 'Title', 'ERROR', 'Tag <title> ausente ou vazia');
  }

  // Meta description
  const descMatch = content.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
  if (descMatch && descMatch[1].trim()) {
    const len = descMatch[1].length;
    if (len < 50) addCheck(rel, 'Meta Description', 'WARN', `Muito curta (${len} chars)`);
    else if (len > 160) addCheck(rel, 'Meta Description', 'WARN', `Muito longa (${len} chars)`);
    else addCheck(rel, 'Meta Description', 'PASS', `${len} chars`);
  } else {
    addCheck(rel, 'Meta Description', 'WARN', 'Ausente');
  }

  // Canonical
  const canonMatch = content.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i);
  if (canonMatch) {
    addCheck(rel, 'Canonical', 'PASS', canonMatch[1]);
  } else {
    // Verificar formato alternativo
    const canonAlt = content.match(/rel=["']canonical["']/i);
    if (canonAlt) addCheck(rel, 'Canonical', 'PASS', 'Presente');
    else addCheck(rel, 'Canonical', 'WARN', 'Ausente');
  }

  // Open Graph
  const ogTags = ['og:title', 'og:description', 'og:url', 'og:image'];
  let ogCount = 0;
  for (const tag of ogTags) {
    if (content.match(new RegExp(`property=["']${tag}["']`, 'i'))) ogCount++;
  }
  if (ogCount === 4) addCheck(rel, 'Open Graph', 'PASS', '4/4 tags');
  else if (ogCount > 0) addCheck(rel, 'Open Graph', 'WARN', `${ogCount}/4 tags`);
  else addCheck(rel, 'Open Graph', 'WARN', 'Nenhuma OG tag');

  // JSON-LD Schema
  const schemaMatch = content.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>/gi);
  if (schemaMatch) {
    addCheck(rel, 'JSON-LD Schema', 'PASS', `${schemaMatch.length} bloco(s)`);
  } else {
    // Não é erro crítico para todas as páginas
    addCheck(rel, 'JSON-LD Schema', 'WARN', 'Ausente');
  }

  // H1
  const h1Matches = content.match(/<h1[^>]*>/gi) || [];
  if (h1Matches.length === 1) {
    addCheck(rel, 'H1', 'PASS', '1 H1 (correto)');
  } else if (h1Matches.length === 0) {
    addCheck(rel, 'H1', 'WARN', 'Nenhum H1');
  } else {
    addCheck(rel, 'H1', 'ERROR', `${h1Matches.length} H1s (deve ter exatamente 1)`);
  }

  // Imagens sem alt
  const imgMatches = content.match(/<img[^>]*>/gi) || [];
  let noAlt = 0;
  for (const img of imgMatches) {
    if (!img.match(/alt=["'][^"']*["']/i)) noAlt++;
  }
  if (imgMatches.length === 0) {
    addCheck(rel, 'Imagens', 'PASS', 'Sem imagens');
  } else if (noAlt === 0) {
    addCheck(rel, 'Imagens', 'PASS', `${imgMatches.length} imagens, todas com alt`);
  } else {
    addCheck(rel, 'Imagens', 'WARN', `${noAlt}/${imgMatches.length} imagens sem alt`);
  }

  // Links internos
  const linkMatches = content.match(/href=["'](\/[^"'#]*?)["']/g) || [];
  let brokenLinks = 0;
  const checkedLinks = new Set();
  for (const lm of linkMatches) {
    const href = lm.match(/href=["'](\/[^"'#]*?)["']/)[1];
    if (href.match(/\.(css|js|png|jpg|svg|ico|json|xml|txt|woff|woff2)$/)) continue;
    if (checkedLinks.has(href)) continue;
    checkedLinks.add(href);
    
    const target = href.replace(/^\//, '');
    let fileLookup = '';
    if (target === '' || target === '/') fileLookup = 'index.html';
    else if (target === 'blog/') fileLookup = 'blog/index.html';
    else if (target.endsWith('/')) fileLookup = target + 'index.html';
    else fileLookup = target + '.html';

    const fullPath = path.join(PUBLIC_DIR, fileLookup);
    if (!fs.existsSync(fullPath)) {
      // Tentar sem .html
      const altPath = path.join(PUBLIC_DIR, target);
      if (!fs.existsSync(altPath) && !fs.existsSync(path.join(PUBLIC_DIR, target, 'index.html'))) {
        brokenLinks++;
        addCheck(rel, `Link quebrado`, 'ERROR', href);
      }
    }
  }

  return { rel, brokenLinks, linksChecked: checkedLinks.size };
}

/**
 * Verifica robots.txt
 */
function auditRobots() {
  const robotsPath = path.join(PUBLIC_DIR, 'robots.txt');
  if (fs.existsSync(robotsPath)) {
    const content = fs.readFileSync(robotsPath, 'utf-8');
    addGlobal('robots.txt existe', 'PASS', `${content.length} bytes`);
    if (content.toLowerCase().includes('sitemap')) {
      addGlobal('robots.txt referencia sitemap', 'PASS', 'Sim');
    } else {
      addGlobal('robots.txt referencia sitemap', 'WARN', 'Adicionar Sitemap: https://...');
    }
    if (content.includes('Disallow: /')) {
      addGlobal('robots.txt bloqueio total', 'WARN', 'Contém "Disallow: /" — verificar se intencional');
    }
  } else {
    addGlobal('robots.txt existe', 'ERROR', 'Arquivo não encontrado');
  }
}

/**
 * Verifica sitemap.xml vs arquivos reais
 */
function auditSitemap() {
  const sitemapPath = path.join(PUBLIC_DIR, 'sitemap.xml');
  if (!fs.existsSync(sitemapPath)) {
    addGlobal('sitemap.xml existe', 'ERROR', 'Arquivo não encontrado');
    return;
  }

  const content = fs.readFileSync(sitemapPath, 'utf-8');
  const urls = [];
  const regex = /<loc>([^<]+)<\/loc>/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    urls.push(match[1]);
  }

  addGlobal('sitemap.xml existe', 'PASS', `${urls.length} URLs`);

  // Verificar XML válido
  if (content.includes('<?xml') && content.includes('</urlset>')) {
    addGlobal('sitemap.xml formato', 'PASS', 'XML válido');
  } else {
    addGlobal('sitemap.xml formato', 'ERROR', 'XML incompleto');
  }

  // Verificar cada URL tem arquivo
  let missing = 0;
  for (const url of urls) {
    const urlPath = new URL(url).pathname;
    let filePath = '';
    if (urlPath === '/' || urlPath === '') filePath = 'index.html';
    else if (urlPath === '/blog/') filePath = 'blog/index.html';
    else if (urlPath.endsWith('/')) filePath = urlPath.slice(1) + 'index.html';
    else filePath = urlPath.slice(1) + '.html';

    if (!fs.existsSync(path.join(PUBLIC_DIR, filePath))) {
      addGlobal(`Sitemap URL sem arquivo`, 'ERROR', `${url} → ${filePath}`);
      missing++;
    }
  }
  if (missing === 0) {
    addGlobal('Sitemap integridade', 'PASS', 'Todas as URLs têm arquivo correspondente');
  }

  // Verificar páginas órfãs (HTML sem entrada no sitemap)
  const htmlFiles = getHtmlFiles(PUBLIC_DIR);
  const sitemapPaths = urls.map(u => {
    const p = new URL(u).pathname;
    return p === '/' ? '/' : p;
  });

  let orphans = 0;
  for (const file of htmlFiles) {
    const rel = path.relative(PUBLIC_DIR, file).replace(/\\/g, '/');
    // Construir path equivalente
    let pagePath = '/' + rel.replace('.html', '').replace(/\/index$/, '/');
    if (pagePath === '/index') pagePath = '/';

    const isUtility = ['404', 'BEMVINDO'].some(u => rel.startsWith(u));
    if (isUtility) continue;

    if (!sitemapPaths.some(sp => sp === pagePath || sp === pagePath.replace(/\/$/, ''))) {
      addGlobal('Página órfã (não no sitemap)', 'WARN', rel);
      orphans++;
    }
  }
  if (orphans === 0) {
    addGlobal('Páginas órfãs', 'PASS', 'Nenhuma (exceto utilitárias)');
  }
}

/**
 * Gera relatórios
 */
function generateReports() {
  if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });

  // JSON
  fs.writeFileSync(path.join(REPORTS_DIR, 'seo-audit.json'), JSON.stringify(results, null, 2));

  // Markdown
  let md = `# Auditoria SEO — LinkMágico\n\n`;
  md += `**Data:** ${results.timestamp}\n\n`;
  md += `## Resumo\n\n`;
  md += `| Métrica | Total |\n|---|---|\n`;
  md += `| ✅ Aprovado | ${results.summary.passed} |\n`;
  md += `| ⚠️ Aviso | ${results.summary.warnings} |\n`;
  md += `| ❌ Erro | ${results.summary.errors} |\n`;
  md += `| **Total** | **${results.summary.total}** |\n\n`;

  // Global checks
  md += `## Verificações Globais\n\n`;
  md += `| Verificação | Status | Detalhe |\n|---|---|---|\n`;
  for (const g of results.global) {
    const icon = g.status === 'PASS' ? '✅' : g.status === 'WARN' ? '⚠️' : '❌';
    md += `| ${g.check} | ${icon} | ${g.detail} |\n`;
  }

  // Page checks - group by page
  md += `\n## Verificações por Página\n\n`;
  const pageGroups = {};
  for (const p of results.pages) {
    if (!pageGroups[p.page]) pageGroups[p.page] = [];
    pageGroups[p.page].push(p);
  }

  // Only show pages with issues
  const pagesWithIssues = Object.entries(pageGroups).filter(([_, checks]) =>
    checks.some(c => c.status !== 'PASS')
  );

  if (pagesWithIssues.length === 0) {
    md += `✅ Todas as páginas passaram em todas as verificações.\n`;
  } else {
    md += `⚠️ ${pagesWithIssues.length} página(s) com avisos ou erros:\n\n`;
    for (const [page, checks] of pagesWithIssues) {
      md += `### ${page}\n\n`;
      md += `| Verificação | Status | Detalhe |\n|---|---|---|\n`;
      for (const c of checks) {
        const icon = c.status === 'PASS' ? '✅' : c.status === 'WARN' ? '⚠️' : '❌';
        md += `| ${c.check} | ${icon} | ${c.detail} |\n`;
      }
      md += '\n';
    }
  }

  fs.writeFileSync(path.join(REPORTS_DIR, 'seo-audit.md'), md);
}

async function main() {
  console.log(`\n╔══════════════════════════════════════════╗`);
  console.log(`║  🔍 Auditoria SEO — LinkMágico          ║`);
  console.log(`╚══════════════════════════════════════════╝\n`);

  // Verificações globais
  console.log('📋 Verificando robots.txt...');
  auditRobots();

  console.log('🗺️  Verificando sitemap.xml...');
  auditSitemap();

  // Auditar cada página
  const htmlFiles = getHtmlFiles(PUBLIC_DIR);
  console.log(`\n📄 Auditando ${htmlFiles.length} páginas HTML...\n`);

  let totalLinks = 0;
  let totalBroken = 0;

  for (const file of htmlFiles) {
    const result = auditPage(file);
    totalLinks += result.linksChecked;
    totalBroken += result.brokenLinks;
  }

  console.log(`   Links verificados: ${totalLinks}`);
  console.log(`   Links quebrados: ${totalBroken}`);

  // Gerar relatórios
  generateReports();

  console.log(`\n${'═'.repeat(50)}`);
  console.log(`  ✅ ${results.summary.passed} aprovados`);
  console.log(`  ⚠️  ${results.summary.warnings} avisos`);
  console.log(`  ❌ ${results.summary.errors} erros`);
  console.log(`${'═'.repeat(50)}`);
  console.log(`\n📄 reports/seo-audit.md`);
  console.log(`📊 reports/seo-audit.json\n`);

  process.exit(results.summary.errors > 0 ? 1 : 0);
}

if (require.main === module) {
  main().catch(e => { console.error('Erro:', e.message); process.exit(1); });
}

module.exports = { auditPage, auditRobots, auditSitemap, getHtmlFiles };
