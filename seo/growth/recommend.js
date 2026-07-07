/**
 * seo/growth/recommend.js — Motor de Recomendações SEO (V2.1)
 * 
 * Analisa cada página e gera recomendações com score por categoria.
 * Reutiliza seo/audit.js existente (apenas importa, não modifica).
 * 
 * REGRAS:
 * - Apenas analisa e recomenda — NUNCA modifica nada
 * - Retorna exclusivamente JSON padronizado
 * - Logs iniciam com [SEO-GROWTH]
 */

'use strict';

const fs = require('fs');
const path = require('path');
const audit = require('../audit');
const cache = require('../cache');

const PUBLIC_DIR = path.join(__dirname, '..', '..', 'public');
const CACHE_TTL = 12 * 60 * 60 * 1000; // 12h

// ============================================================
// Análise de HTML (leitura somente)
// ============================================================

/**
 * Lê conteúdo HTML de uma página
 */
function readPage(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    return null;
  }
}

/**
 * Extrai title tag
 */
function extractTitle(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? match[1].trim() : null;
}

/**
 * Extrai meta description
 */
function extractMetaDescription(html) {
  const match = html.match(/<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["']/i)
    || html.match(/<meta\s+content=["']([\s\S]*?)["']\s+name=["']description["']/i);
  return match ? match[1].trim() : null;
}

/**
 * Extrai todas as headings
 */
function extractHeadings(html) {
  const result = { h1: [], h2: [], h3: [] };
  const patterns = {
    h1: /<h1[^>]*>([\s\S]*?)<\/h1>/gi,
    h2: /<h2[^>]*>([\s\S]*?)<\/h2>/gi,
    h3: /<h3[^>]*>([\s\S]*?)<\/h3>/gi
  };

  for (const [tag, regex] of Object.entries(patterns)) {
    let m;
    while ((m = regex.exec(html)) !== null) {
      result[tag].push(m[1].replace(/<[^>]+>/g, '').trim());
    }
  }

  return result;
}

/**
 * Extrai links internos
 */
function extractInternalLinks(html) {
  const links = [];
  const regex = /<a\s+[^>]*href=["']([^"']*?)["'][^>]*>/gi;
  let m;
  while ((m = regex.exec(html)) !== null) {
    const href = m[1];
    if (href && !href.startsWith('http') && !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.startsWith('#') && !href.startsWith('javascript:')) {
      links.push(href);
    }
  }
  return links;
}

/**
 * Extrai texto visível (para análise de conteúdo)
 */
function extractVisibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Detecta tipos de Schema JSON-LD
 */
function extractSchemaTypes(html) {
  const types = [];
  const regex = /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = regex.exec(html)) !== null) {
    try {
      const data = JSON.parse(m[1]);
      if (data['@type']) types.push(data['@type']);
      if (Array.isArray(data['@graph'])) {
        data['@graph'].forEach(item => { if (item['@type']) types.push(item['@type']); });
      }
    } catch (e) { /* JSON inválido, ignorar */ }
  }
  return types;
}

/**
 * Detecta presença de FAQ
 */
function hasFAQ(html) {
  return /faq|perguntas\s+frequentes|frequently\s+asked/i.test(html)
    && /<(details|dt|dd|h[23])/i.test(html);
}

/**
 * Detecta presença de CTA
 */
function hasCTA(html) {
  return /(teste\s+gr[aá]tis|comece\s+agora|solicite|agende|fale\s+conosco|whatsapp|cadastre|experimente)/i.test(html);
}

// ============================================================
// Scoring por categoria
// ============================================================

function scoreTitle(title) {
  const recs = [];
  if (!title) {
    recs.push({ severity: 'high', message: 'Title ausente — adicionar título descritivo com palavra-chave principal' });
    return { score: 0, recommendations: recs };
  }
  let score = 100;
  if (title.length < 30) { score -= 20; recs.push({ severity: 'medium', message: `Title muito curto (${title.length} chars) — ideal: 50-60 caracteres` }); }
  if (title.length > 60) { score -= 15; recs.push({ severity: 'low', message: `Title muito longo (${title.length} chars) — pode ser truncado no Google` }); }
  if (title.length >= 30 && title.length <= 60) { /* ideal */ }
  return { score: Math.max(0, score), recommendations: recs };
}

function scoreMetaDescription(desc) {
  const recs = [];
  if (!desc) {
    recs.push({ severity: 'high', message: 'Meta description ausente — adicionar descrição atrativa com 120-160 caracteres' });
    return { score: 0, recommendations: recs };
  }
  let score = 100;
  if (desc.length < 80) { score -= 25; recs.push({ severity: 'medium', message: `Meta description curta (${desc.length} chars) — ideal: 120-160 caracteres` }); }
  if (desc.length > 160) { score -= 10; recs.push({ severity: 'low', message: `Meta description longa (${desc.length} chars) — será truncada` }); }
  return { score: Math.max(0, score), recommendations: recs };
}

function scoreHeadings(headings) {
  const recs = [];
  let score = 100;

  if (headings.h1.length === 0) { score -= 30; recs.push({ severity: 'high', message: 'H1 ausente — cada página deve ter exatamente 1 H1' }); }
  else if (headings.h1.length > 1) { score -= 15; recs.push({ severity: 'medium', message: `${headings.h1.length} H1 encontrados — deve haver apenas 1` }); }

  if (headings.h2.length === 0) { score -= 15; recs.push({ severity: 'medium', message: 'Nenhum H2 — usar H2 para organizar seções do conteúdo' }); }
  if (headings.h2.length > 0 && headings.h3.length === 0 && headings.h2.length > 3) {
    score -= 5;
    recs.push({ severity: 'low', message: 'Considerar adicionar H3 para sub-seções' });
  }

  return { score: Math.max(0, score), recommendations: recs };
}

function scoreContent(text, html) {
  const recs = [];
  let score = 100;
  const wordCount = text.split(/\s+/).length;

  if (wordCount < 300) { score -= 30; recs.push({ severity: 'high', message: `Conteúdo curto (${wordCount} palavras) — ideal: 800+ palavras para ranqueamento` }); }
  else if (wordCount < 800) { score -= 15; recs.push({ severity: 'medium', message: `Conteúdo médio (${wordCount} palavras) — expandir para 800+ pode melhorar posição` }); }

  if (!hasFAQ(html)) { score -= 10; recs.push({ severity: 'medium', message: 'Sem seção FAQ detectada — adicionar perguntas frequentes melhora SEO e Featured Snippets' }); }
  if (!hasCTA(html)) { score -= 10; recs.push({ severity: 'low', message: 'Sem CTA claro detectado — adicionar chamada para ação' }); }

  return { score: Math.max(0, score), recommendations: recs };
}

function scoreInternalLinks(links, totalPages) {
  const recs = [];
  let score = 100;

  if (links.length === 0) { score -= 40; recs.push({ severity: 'high', message: 'Nenhum link interno — isola a página da arquitetura do site' }); }
  else if (links.length < 3) { score -= 20; recs.push({ severity: 'medium', message: `Apenas ${links.length} link(s) interno(s) — ideal: 5-15 links relevantes` }); }
  else if (links.length < 5) { score -= 10; recs.push({ severity: 'low', message: `${links.length} links internos — considerar adicionar mais links contextuais` }); }

  if (links.length > 50) { score -= 10; recs.push({ severity: 'low', message: `${links.length} links internos — excesso pode diluir link juice` }); }

  return { score: Math.max(0, score), recommendations: recs };
}

function scoreSchema(schemaTypes) {
  const recs = [];
  let score = 100;
  const desirable = ['FAQPage', 'BreadcrumbList', 'Article', 'SoftwareApplication', 'Organization'];
  const missing = desirable.filter(t => !schemaTypes.includes(t));

  const penalty = Math.min(missing.length * 16, 80);
  score -= penalty;

  if (!schemaTypes.includes('Organization')) { recs.push({ severity: 'medium', message: 'Schema Organization ausente — adicionar para Knowledge Panel' }); }
  if (!schemaTypes.includes('FAQPage')) { recs.push({ severity: 'medium', message: 'Schema FAQPage ausente — adicionar para Rich Results de FAQ' }); }
  if (!schemaTypes.includes('BreadcrumbList')) { recs.push({ severity: 'low', message: 'Schema BreadcrumbList ausente — melhora navegação no Google' }); }
  if (!schemaTypes.includes('SoftwareApplication')) { recs.push({ severity: 'low', message: 'Schema SoftwareApplication ausente — útil para produtos SaaS' }); }

  return { score: Math.max(0, score), recommendations: recs };
}

// ============================================================
// Funções públicas
// ============================================================

/**
 * Gera recomendações para uma página específica
 * @param {string} pagePath - caminho relativo (ex: '/imobiliarias' ou 'imobiliarias.html')
 */
async function analyzePage(pagePath) {
  const cacheKey = `growth_rec_${pagePath}`;

  try {
    return await cache.getOrFetch(cacheKey, CACHE_TTL, async () => {
      // Resolver caminho do arquivo
      let filePath = pagePath;
      if (!path.isAbsolute(filePath)) {
        // Normalizar caminho
        let normalized = pagePath.replace(/^\//, '');
        if (!normalized.endsWith('.html')) normalized += '.html';
        filePath = path.join(PUBLIC_DIR, normalized);

        // Tentar com index.html se for diretório
        if (!fs.existsSync(filePath)) {
          const dirPath = path.join(PUBLIC_DIR, pagePath.replace(/^\//, ''), 'index.html');
          if (fs.existsSync(dirPath)) filePath = dirPath;
        }
      }

      if (!fs.existsSync(filePath)) {
        return { page: pagePath, error: true, message: `Arquivo não encontrado: ${pagePath}` };
      }

      console.log(`[SEO-GROWTH] Recommend → analisando ${pagePath}...`);

      const html = readPage(filePath);
      if (!html) {
        return { page: pagePath, error: true, message: 'Não foi possível ler o arquivo' };
      }

      const title = extractTitle(html);
      const metaDesc = extractMetaDescription(html);
      const headings = extractHeadings(html);
      const text = extractVisibleText(html);
      const links = extractInternalLinks(html);
      const schemaTypes = extractSchemaTypes(html);

      const titleResult = scoreTitle(title);
      const descResult = scoreMetaDescription(metaDesc);
      const headingsResult = scoreHeadings(headings);
      const contentResult = scoreContent(text, html);
      const linksResult = scoreInternalLinks(links, 73);
      const schemaResult = scoreSchema(schemaTypes);

      // Score geral ponderado
      const overall = Math.round(
        titleResult.score * 0.15 +
        descResult.score * 0.15 +
        headingsResult.score * 0.10 +
        contentResult.score * 0.25 +
        linksResult.score * 0.15 +
        schemaResult.score * 0.20
      );

      // Consolidar recomendações
      const allRecs = [
        ...titleResult.recommendations.map(r => ({ ...r, category: 'title' })),
        ...descResult.recommendations.map(r => ({ ...r, category: 'metaDescription' })),
        ...headingsResult.recommendations.map(r => ({ ...r, category: 'headings' })),
        ...contentResult.recommendations.map(r => ({ ...r, category: 'content' })),
        ...linksResult.recommendations.map(r => ({ ...r, category: 'internalLinks' })),
        ...schemaResult.recommendations.map(r => ({ ...r, category: 'schema' }))
      ];

      // Ordenar por severidade
      const severityOrder = { high: 0, medium: 1, low: 2 };
      allRecs.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

      console.log(`[SEO-GROWTH] Recommend → ${pagePath} → score ${overall}/100, ${allRecs.length} recomendações`);

      return {
        page: pagePath,
        scores: {
          title: titleResult.score,
          metaDescription: descResult.score,
          headings: headingsResult.score,
          content: contentResult.score,
          internalLinks: linksResult.score,
          schema: schemaResult.score,
          overall
        },
        recommendations: allRecs,
        totalRecommendations: allRecs.length,
        details: {
          titleLength: title ? title.length : 0,
          descLength: metaDesc ? metaDesc.length : 0,
          h1Count: headings.h1.length,
          h2Count: headings.h2.length,
          h3Count: headings.h3.length,
          wordCount: text.split(/\s+/).length,
          internalLinksCount: links.length,
          schemaTypes,
          hasFAQ: hasFAQ(html),
          hasCTA: hasCTA(html)
        },
        analyzedAt: new Date().toISOString()
      };
    });
  } catch (e) {
    console.error(`[SEO-GROWTH] Recommend Error → ${pagePath}: ${e.message}`);
    return { page: pagePath, error: true, message: e.message };
  }
}

/**
 * Gera recomendações para TODAS as páginas principais
 */
async function analyzeAll() {
  const cacheKey = 'growth_rec_all';

  try {
    return await cache.getOrFetch(cacheKey, CACHE_TTL, async () => {
      console.log('[SEO-GROWTH] Recommend → analisando todas as páginas...');

      // Páginas principais (excluir admin, 404)
      const htmlFiles = audit.getHtmlFiles(PUBLIC_DIR)
        .filter(f => !f.includes('admin') && !f.includes('404'));

      const results = [];
      for (const filePath of htmlFiles) {
        const relativePath = '/' + path.relative(PUBLIC_DIR, filePath).replace(/\\/g, '/').replace(/\.html$/, '').replace(/\/index$/, '');
        const result = await analyzePage(filePath);
        if (!result.error) {
          result.page = relativePath === '/' ? '/' : relativePath;
          results.push(result);
        }
      }

      // Ordenar por score (menor primeiro — piores primeiro)
      results.sort((a, b) => a.scores.overall - b.scores.overall);

      const avgScore = results.length > 0
        ? Math.round(results.reduce((sum, r) => sum + r.scores.overall, 0) / results.length)
        : 0;

      console.log(`[SEO-GROWTH] Recommend → ${results.length} páginas analisadas, score médio: ${avgScore}`);

      return {
        pages: results,
        total: results.length,
        averageScore: avgScore,
        analyzedAt: new Date().toISOString()
      };
    });
  } catch (e) {
    console.error(`[SEO-GROWTH] Recommend All Error → ${e.message}`);
    return { pages: [], total: 0, averageScore: 0, error: true, message: e.message };
  }
}

module.exports = { analyzePage, analyzeAll };
