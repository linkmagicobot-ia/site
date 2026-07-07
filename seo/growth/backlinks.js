/**
 * seo/growth/backlinks.js — Centro de Backlinks Intelligence (V2.1)
 * 
 * Inteligência de backlinks. NUNCA compra ou automatiza backlinks.
 * Apenas analisa e sugere oportunidades.
 * 
 * REGRAS:
 * - Logs iniciam com [SEO-GROWTH]
 * - Retorna exclusivamente JSON
 */

'use strict';

const bing = require('../bing/index');
const cache = require('../cache');

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

// Oportunidades de backlinks (base de conhecimento)
const OPPORTUNITIES = [
  { type: 'directory', name: 'Diretórios de Negócios', examples: ['Google Business Profile', 'Bing Places', 'Clutch.co', 'G2.com', 'Capterra'], effort: 'low', impact: 'medium', description: 'Cadastre o Link Mágico em diretórios de software e negócios locais' },
  { type: 'guest_post', name: 'Guest Posts', examples: ['Blogs de marketing digital', 'Portais de IA e chatbots', 'Blogs de automação'], effort: 'medium', impact: 'high', description: 'Publique artigos como convidado em blogs relevantes do setor' },
  { type: 'partnership', name: 'Parcerias Estratégicas', examples: ['Integradores WhatsApp', 'Agências digitais', 'Consultorias de marketing'], effort: 'medium', impact: 'high', description: 'Parcerias com empresas complementares que podem linkar para o Link Mágico' },
  { type: 'community', name: 'Comunidades', examples: ['Product Hunt', 'IndieHackers', 'Dev.to', 'TabNews', 'Reddit r/chatbots'], effort: 'low', impact: 'medium', description: 'Participação em comunidades de tecnologia e empreendedorismo' },
  { type: 'tool', name: 'Ferramentas como Link Bait', examples: ['Calculadora ROI (já existente)', 'Gerador de scripts para chatbot', 'Avaliador de atendimento'], effort: 'low', impact: 'high', description: 'Ferramentas gratuitas que atraem links naturalmente' },
  { type: 'education', name: 'Universidades e Educação', examples: ['Cursos de marketing digital', 'Pós-graduações em IA', 'Workshops online'], effort: 'high', impact: 'high', description: 'Parcerias educacionais que geram links de alta autoridade (.edu)' },
  { type: 'event', name: 'Eventos e Webinars', examples: ['Webinars sobre chatbots', 'Lives sobre automação', 'Palestras em conferências'], effort: 'medium', impact: 'medium', description: 'Participação em eventos gera menções e backlinks editoriais' },
  { type: 'press', name: 'Imprensa e PR Digital', examples: ['HARO (Help a Reporter Out)', 'Releases para portais de tech', 'Entrevistas em podcasts'], effort: 'medium', impact: 'high', description: 'Cobertura de imprensa e menções em portais de notícias' }
];

/**
 * Gera relatório completo de backlinks
 */
async function generateReport() {
  const cacheKey = 'growth_backlinks_report';

  try {
    return await cache.getOrFetch(cacheKey, CACHE_TTL, async () => {
      console.log('[SEO-GROWTH] Backlinks → gerando relatório...');

      const current = await bing.getBacklinks();

      const report = {
        current: {
          total: current.total || 0,
          domains: current.domains || [],
          status: current.error ? 'error' : current.total > 0 ? 'active' : 'no_data'
        },
        opportunities: OPPORTUNITIES,
        actions: generateActions(current),
        analyzedAt: new Date().toISOString()
      };

      console.log(`[SEO-GROWTH] Backlinks → total: ${report.current.total}, ${report.opportunities.length} oportunidades`);
      return report;
    });
  } catch (e) {
    console.error(`[SEO-GROWTH] Backlinks Error → ${e.message}`);
    return { current: { total: 0, domains: [], status: 'error' }, opportunities: OPPORTUNITIES, actions: [], error: true, message: e.message };
  }
}

/**
 * Gera ações prioritárias baseadas no estado atual
 */
function generateActions(current) {
  const actions = [];

  if (!current || current.total === 0) {
    actions.push({ priority: 'high', action: 'Cadastrar em Google Business Profile e Bing Places', type: 'directory', estimatedImpact: 'Primeiros backlinks de alta autoridade' });
    actions.push({ priority: 'high', action: 'Publicar no Product Hunt e IndieHackers', type: 'community', estimatedImpact: 'Visibilidade + backlinks de comunidades tech' });
    actions.push({ priority: 'medium', action: 'Promover a Calculadora ROI como ferramenta gratuita', type: 'tool', estimatedImpact: 'Link bait — gera links naturais de blogs' });
  }

  if (current && current.total > 0 && current.total < 10) {
    actions.push({ priority: 'high', action: 'Escrever 2-3 guest posts em blogs de marketing/IA', type: 'guest_post', estimatedImpact: 'Backlinks editoriais de alta qualidade' });
    actions.push({ priority: 'medium', action: 'Buscar parcerias com integradores WhatsApp', type: 'partnership', estimatedImpact: 'Links de sites relevantes do mesmo nicho' });
  }

  if (current && current.total >= 10) {
    actions.push({ priority: 'medium', action: 'Participar de webinars e podcasts do setor', type: 'event', estimatedImpact: 'Backlinks editoriais + autoridade de marca' });
    actions.push({ priority: 'low', action: 'Buscar cobertura de imprensa via HARO', type: 'press', estimatedImpact: 'Links de alta autoridade de portais de notícias' });
  }

  return actions;
}

module.exports = { generateReport, OPPORTUNITIES };
