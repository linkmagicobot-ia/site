/**
 * seo/config.js — Configuração centralizada do SEOProvider v1
 * 
 * Toda configuração do módulo SEO em um único lugar.
 * Nenhum número mágico espalhado pelo código.
 * 
 * REGRAS:
 * - Este módulo é exclusivamente um provider de configuração
 * - Nunca contém lógica de negócio
 * - Valores configuráveis via variáveis de ambiente
 */

'use strict';

module.exports = {
  // Versão do provider
  PROVIDER_VERSION: 'v1',

  // Site
  GOOGLE_SITE_URL: process.env.GOOGLE_SITE_URL || 'sc-domain:linkmagico.app.br',
  BING_SITE_URL: process.env.BING_SITE_URL || 'https://linkmagico.app.br',
  // Manter SITE_URL para compatibilidade se algo usar
  SITE_URL: 'https://site.linkmagico.app.br',

  // Timeouts (configuráveis via env)
  REQUEST_TIMEOUT: parseInt(process.env.SEO_REQUEST_TIMEOUT || '15000', 10),
  RETRIES: 3,
  RETRY_DELAY: 1000, // base em ms (exponencial: 1s → 2s → 4s)

  // Cache TTLs (ms)
  CACHE_TTL: {
    auth_token:  55 * 60 * 1000,       // 55 min
    summary:     30 * 60 * 1000,       // 30 min
    queries:      6 * 60 * 60 * 1000,  // 6h
    pages:        6 * 60 * 60 * 1000,  // 6h
    devices:      6 * 60 * 60 * 1000,  // 6h
    countries:    6 * 60 * 60 * 1000,  // 6h
    backlinks:   24 * 60 * 60 * 1000,  // 24h
  },

  // Cache limits
  CACHE_MAX_ENTRIES: 100,
  CACHE_EVICTION: 'LRU',

  // Google API
  GOOGLE_TOKEN_URL: 'https://oauth2.googleapis.com/token',
  GOOGLE_SC_API: 'https://searchconsole.googleapis.com/webmasters/v3',
  GOOGLE_SCOPE: 'https://www.googleapis.com/auth/webmasters.readonly',

  // Bing API
  BING_API_HOST: 'ssl.bing.com',
  BING_API_BASE_PATH: '/webmaster/api.svc/json',

  // Períodos válidos
  VALID_PERIODS: ['7d', '30d', '90d'],
  DEFAULT_PERIOD: '30d',

  // Helpers
  periodToDays(period) {
    const map = { '7d': 7, '30d': 30, '90d': 90 };
    return map[period] || 30;
  },

  getDateStr(daysOffset) {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().slice(0, 10);
  }
};
