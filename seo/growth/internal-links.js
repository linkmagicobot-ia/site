/**
 * seo/growth/internal-links.js — Mapa de Linkagem Interna (V2.1)
 * 
 * Analisa TODA a arquitetura de links internos do site.
 * Identifica páginas órfãs, isoladas, overlinked e clusters desconectados.
 * Gera sugestões de novos links — NUNCA modifica nada.
 * 
 * REGRAS:
 * - Apenas analisa e sugere — NUNCA cria links
 * - Retorna exclusivamente JSON padronizado
 * - Logs iniciam com [SEO-GROWTH]
 */

'use strict';

const fs = require('fs');
const path = require('path');
const audit = require('../audit');
const cache = require('../cache');

const PUBLIC_DIR = path.join(__dirname, '..', '..', 'public');
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

// Clusters conhecidos
const CLUSTERS = ['clinicas', 'imobiliarias', 'ecommerce', 'restaurantes', 'infoprodutores'];
const CLUSTER_SUBTYPES = ['templates', 'fluxos', 'checklists', 'prompts', 'exemplos'];

/**
 * Extrai todos os links internos de um arquivo HTML
 */
function extractLinks(html) {
  const links = [];
  const regex = /<a\s+[^>]*href=["']([^"'#]*?)["'][^>]*>/gi;
  let m;
  while ((m = regex.exec(html)) !== null) {
    let href = m[1].trim();
    if (!href) continue;
    if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) continue;

    // Normalizar links internos
    if (href.startsWith('https://site.linkmagico.app.br')) {
      href = href.replace('https://site.linkmagico.app.br', '');
    }
    if (href.startsWith('https://linkmagico.app.br')) {
      href = href.replace('https://linkmagico.app.br', '');
    }

    // Ignorar links externos
    if (href.startsWith('http://') || href.startsWith('https://')) continue;

    // Normalizar
    if (!href.startsWith('/')) href = '/' + href;
    href = href.replace(/\.html$/, '').replace(/\/index$/, '').replace(/\/$/, '') || '/';

    links.push(href);
  }

  return [...new Set(links)]; // deduplicar
}

/**
 * Converte caminho do arquivo para URL path
 */
function fileToPath(filePath) {
  const rel = path.relative(PUBLIC_DIR, filePath).replace(/\\/g, '/');
  let urlPath = '/' + rel.replace(/\.html$/, '').replace(/\/index$/, '');
  if (urlPath === '/') return '/';
  return urlPath;
}

/**
 * Determina a qual cluster uma página pertence
 */
function getCluster(pagePath) {
  for (const cluster of CLUSTERS) {
    if (pagePath.includes(cluster)) return cluster;
  }
  return null;
}

/**
 * Analisa mapa completo de linkagem interna
 */
async function analyze() {
  const cacheKey = 'growth_internal_links';

  try {
    return await cache.getOrFetch(cacheKey, CACHE_TTL, async () => {
      console.log('[SEO-GROWTH] Internal Links → mapeando arquitetura...');

      const htmlFiles = audit.getHtmlFiles(PUBLIC_DIR)
        .filter(f => !f.includes('admin') && !f.includes('404'));

      const linkMap = [];
      const incomingLinks = {};  // path → [sources]
      const outgoingLinks = {};  // path → [targets]
      const allPages = new Set();

      for (const filePath of htmlFiles) {
        const sourcePath = fileToPath(filePath);
        allPages.add(sourcePath);

        try {
          const html = fs.readFileSync(filePath, 'utf8');
          const links = extractLinks(html);

          outgoingLinks[sourcePath] = links;

          for (const target of links) {
            linkMap.push({ source: sourcePath, target });

            if (!incomingLinks[target]) incomingLinks[target] = [];
            incomingLinks[target].push(sourcePath);
          }
        } catch (e) {
          console.error(`[SEO-GROWTH] Internal Links → erro ao ler ${filePath}: ${e.message}`);
        }
      }

      // Páginas órfãs (sem links apontando para elas)
      const orphanPages = [...allPages].filter(p => {
        const incoming = incomingLinks[p] || [];
        return incoming.length === 0 && p !== '/';
      });

      // Páginas isoladas (não linkam para ninguém)
      const isolatedPages = [...allPages].filter(p => {
        const outgoing = outgoingLinks[p] || [];
        return outgoing.length === 0;
      });

      // Páginas com excesso de links (>40)
      const overlinkedPages = [...allPages]
        .map(p => ({ page: p, linksCount: (outgoingLinks[p] || []).length }))
        .filter(p => p.linksCount > 40)
        .sort((a, b) => b.linksCount - a.linksCount);

      // Clusters desconectados (sem links entre páginas do mesmo cluster)
      const disconnectedClusters = [];
      for (const cluster of CLUSTERS) {
        const clusterPages = [...allPages].filter(p => getCluster(p) === cluster);
        if (clusterPages.length <= 1) continue;

        let hasInternalLink = false;
        for (const page of clusterPages) {
          const targets = outgoingLinks[page] || [];
          if (targets.some(t => getCluster(t) === cluster && t !== page)) {
            hasInternalLink = true;
            break;
          }
        }

        if (!hasInternalLink) {
          disconnectedClusters.push(cluster);
        }
      }

      // Sugestões de links
      const suggestions = generateSuggestions(allPages, incomingLinks, outgoingLinks);

      // Estatísticas
      const linksPerPage = [...allPages].map(p => (outgoingLinks[p] || []).length);
      const totalLinks = linksPerPage.reduce((a, b) => a + b, 0);
      const maxPage = [...allPages].reduce((best, p) => {
        const count = (outgoingLinks[p] || []).length;
        return count > best.count ? { page: p, count } : best;
      }, { page: '', count: 0 });
      const minPage = [...allPages].reduce((best, p) => {
        const count = (outgoingLinks[p] || []).length;
        return count < best.count ? { page: p, count } : best;
      }, { page: '', count: Infinity });

      console.log(`[SEO-GROWTH] Internal Links → ${allPages.size} páginas, ${totalLinks} links, ${orphanPages.length} órfãs, ${suggestions.length} sugestões`);

      return {
        linkMap: linkMap.slice(0, 500), // Limitar para performance
        suggestions,
        orphanPages,
        isolatedPages,
        overlinkedPages,
        disconnectedClusters,
        stats: {
          totalPages: allPages.size,
          totalLinks,
          avgLinksPerPage: allPages.size > 0 ? parseFloat((totalLinks / allPages.size).toFixed(1)) : 0,
          maxLinks: maxPage,
          minLinks: minPage.count === Infinity ? { page: '', count: 0 } : minPage,
          orphanCount: orphanPages.length,
          isolatedCount: isolatedPages.length,
          disconnectedClustersCount: disconnectedClusters.length
        },
        analyzedAt: new Date().toISOString()
      };
    });
  } catch (e) {
    console.error(`[SEO-GROWTH] Internal Links Error → ${e.message}`);
    return { linkMap: [], suggestions: [], orphanPages: [], isolatedPages: [], overlinkedPages: [], disconnectedClusters: [], stats: {}, error: true, message: e.message };
  }
}

/**
 * Gera sugestões de novos links internos
 */
function generateSuggestions(allPages, incomingLinks, outgoingLinks) {
  const suggestions = [];

  // Para cada página com poucos links de entrada
  for (const page of allPages) {
    const incoming = incomingLinks[page] || [];
    if (incoming.length >= 5 || page === '/') continue;

    // Encontrar páginas que poderiam linkar para esta
    const potentialSources = [];
    const pageCluster = getCluster(page);
    const pageWords = page.split(/[\/\-]/).filter(w => w.length > 3);

    for (const source of allPages) {
      if (source === page) continue;
      if (incoming.includes(source)) continue;

      // Mesma área temática?
      const sourceCluster = getCluster(source);
      let relevance = 0;

      if (pageCluster && sourceCluster === pageCluster) relevance += 3;
      if (pageWords.some(w => source.includes(w))) relevance += 2;

      // Páginas de blog, glossário são boas candidatas a linkar
      if (source.includes('/blog/') || source.includes('/glossario/')) relevance += 1;

      if (relevance >= 2) {
        potentialSources.push(source);
      }
    }

    if (potentialSources.length > 0) {
      suggestions.push({
        target: page,
        sources: potentialSources.slice(0, 5),
        currentIncoming: incoming.length,
        suggestedCount: Math.min(potentialSources.length, 5),
        priority: incoming.length === 0 ? 'high' : incoming.length < 3 ? 'medium' : 'low',
        reason: incoming.length === 0
          ? 'Página órfã — sem nenhum link interno apontando para ela'
          : `Apenas ${incoming.length} link(s) de entrada — mais links podem melhorar autoridade`
      });
    }
  }

  // Ordenar por prioridade
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return suggestions.slice(0, 30);
}

module.exports = { analyze };
