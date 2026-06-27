/**
 * seo/index-report.js — Relatório de Indexação
 * Verifica cobertura do sitemap, canonical, robots e páginas órfãs.
 * 
 * Uso: node seo/index-report.js
 * npm: npm run seo:index-report
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const REPORTS_DIR = path.join(__dirname, '..', 'reports');

function getHtmlFiles(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'admin') files.push(...getHtmlFiles(full));
    else if (entry.name.endsWith('.html')) files.push(full);
  }
  return files;
}

async function main() {
  console.log(`\n╔══════════════════════════════════════════╗`);
  console.log(`║  📊 Relatório de Indexação               ║`);
  console.log(`╚══════════════════════════════════════════╝\n`);

  const report = { timestamp: new Date().toISOString(), urls: [], orphans: [], blocked: [], noCanonical: [], summary: {} };

  // Parse sitemap
  const sitemapContent = fs.readFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), 'utf-8');
  const sitemapUrls = [];
  const regex = /<loc>([^<]+)<\/loc>/g;
  let match;
  while ((match = regex.exec(sitemapContent)) !== null) sitemapUrls.push(match[1]);

  // Verificar cada URL do sitemap
  for (const url of sitemapUrls) {
    const urlPath = new URL(url).pathname;
    let filePath = '';
    if (urlPath === '/' || urlPath === '') filePath = 'index.html';
    else if (urlPath === '/blog/') filePath = 'blog/index.html';
    else if (urlPath.endsWith('/')) filePath = urlPath.slice(1) + 'index.html';
    else filePath = urlPath.slice(1) + '.html';

    const fullPath = path.join(PUBLIC_DIR, filePath);
    const exists = fs.existsSync(fullPath);
    let canonical = null;
    let hasRobotsBlock = false;

    if (exists) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const canonMatch = content.match(/rel=["']canonical["']\s+href=["']([^"']*)["']/i) ||
                         content.match(/href=["']([^"']*)["']\s+rel=["']canonical["']/i);
      canonical = canonMatch ? canonMatch[1] : null;
      hasRobotsBlock = /noindex/i.test(content);
    }

    report.urls.push({ url, file: filePath, exists, canonical, blocked: hasRobotsBlock });
    if (!canonical) report.noCanonical.push(url);
    if (hasRobotsBlock) report.blocked.push(url);
  }

  // Encontrar páginas órfãs
  const allHtml = getHtmlFiles(PUBLIC_DIR);
  const sitemapPaths = sitemapUrls.map(u => new URL(u).pathname);

  for (const file of allHtml) {
    const rel = path.relative(PUBLIC_DIR, file).replace(/\\/g, '/');
    const isUtility = ['404', 'BEMVINDO', 'admin/'].some(u => rel.startsWith(u));
    if (isUtility) continue;

    let pagePath = '/' + rel.replace('.html', '').replace(/\/index$/, '/');
    if (pagePath === '/index') pagePath = '/';

    const inSitemap = sitemapPaths.some(sp => sp === pagePath || sp === pagePath.replace(/\/$/, ''));
    if (!inSitemap) report.orphans.push(rel);
  }

  // Summary
  report.summary = {
    totalUrls: sitemapUrls.length,
    totalHtmlFiles: allHtml.length,
    urlsWithFile: report.urls.filter(u => u.exists).length,
    urlsWithoutFile: report.urls.filter(u => !u.exists).length,
    urlsWithCanonical: report.urls.filter(u => u.canonical).length,
    urlsBlocked: report.blocked.length,
    orphanPages: report.orphans.length
  };

  // Console output
  console.log(`  URLs no sitemap:      ${report.summary.totalUrls}`);
  console.log(`  Arquivos HTML:        ${report.summary.totalHtmlFiles}`);
  console.log(`  URLs com arquivo:     ${report.summary.urlsWithFile}`);
  console.log(`  URLs sem arquivo:     ${report.summary.urlsWithoutFile}`);
  console.log(`  URLs com canonical:   ${report.summary.urlsWithCanonical}`);
  console.log(`  URLs bloqueadas:      ${report.summary.urlsBlocked}`);
  console.log(`  Páginas órfãs:        ${report.summary.orphanPages}`);

  if (report.orphans.length > 0) {
    console.log(`\n  ⚠️  Páginas órfãs:`);
    report.orphans.forEach(o => console.log(`     - ${o}`));
  }

  // Save
  if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
  fs.writeFileSync(path.join(REPORTS_DIR, 'index-report.json'), JSON.stringify(report, null, 2));

  let md = `# Relatório de Indexação — LinkMágico\n\n`;
  md += `**Data:** ${report.timestamp}\n\n`;
  md += `## Resumo\n\n`;
  md += `| Métrica | Valor |\n|---|---|\n`;
  Object.entries(report.summary).forEach(([k, v]) => {
    const labels = { totalUrls:'URLs no sitemap', totalHtmlFiles:'Arquivos HTML', urlsWithFile:'URLs com arquivo', urlsWithoutFile:'URLs sem arquivo', urlsWithCanonical:'URLs com canonical', urlsBlocked:'URLs bloqueadas', orphanPages:'Páginas órfãs' };
    md += `| ${labels[k] || k} | ${v} |\n`;
  });

  if (report.orphans.length > 0) {
    md += `\n## Páginas Órfãs\n\n`;
    report.orphans.forEach(o => md += `- ${o}\n`);
  }

  md += `\n## Todas as URLs\n\n`;
  md += `| URL | Arquivo | Canonical | Bloqueada |\n|---|---|---|---|\n`;
  for (const u of report.urls) {
    md += `| ${new URL(u.url).pathname} | ${u.exists ? '✅' : '❌'} | ${u.canonical ? '✅' : '⚠️'} | ${u.blocked ? '🚫' : '—'} |\n`;
  }

  fs.writeFileSync(path.join(REPORTS_DIR, 'index-report.md'), md);
  console.log(`\n📄 reports/index-report.md`);
  console.log(`📊 reports/index-report.json\n`);
}

if (require.main === module) {
  main().catch(e => { console.error('Erro:', e.message); process.exit(1); });
}

module.exports = { getHtmlFiles };
