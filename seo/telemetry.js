/**
 * seo/telemetry.js — Contadores e métricas de latência do SEOProvider v1
 * 
 * REGRAS:
 * - Apenas contadores em memória (expansível para Prometheus no futuro)
 * - Nunca registra credenciais ou tokens
 * - Nunca registra dados pessoais
 * - Latência: mantém últimas 100 medições por provider
 */

'use strict';

const MAX_LATENCY_SAMPLES = 100;

const counters = {
  seo_google_requests_total: 0,
  seo_google_errors_total: 0,
  seo_bing_requests_total: 0,
  seo_bing_errors_total: 0,
  seo_cache_hit_total: 0,
  seo_cache_miss_total: 0,
  seo_dashboard_loads_total: 0,
};

const latency = {
  seo_google_latency_ms: [],
  seo_bing_latency_ms: [],
};

/**
 * Incrementa um contador
 * @param {string} name - Nome do contador
 */
function increment(name) {
  if (counters[name] !== undefined) {
    counters[name]++;
  }
}

/**
 * Registra uma medição de latência
 * @param {string} provider - 'google' ou 'bing'
 * @param {number} ms - Latência em milissegundos
 */
function recordLatency(provider, ms) {
  const key = `seo_${provider}_latency_ms`;
  if (!latency[key]) return;

  latency[key].push(ms);

  // Mantém apenas as últimas MAX_LATENCY_SAMPLES medições
  if (latency[key].length > MAX_LATENCY_SAMPLES) {
    latency[key].shift();
  }
}

/**
 * Calcula estatísticas de latência
 * @param {string} provider - 'google' ou 'bing'
 * @returns {object} { avg, min, max, p95, samples }
 */
function getLatencyStats(provider) {
  const key = `seo_${provider}_latency_ms`;
  const samples = latency[key] || [];

  if (samples.length === 0) {
    return { avg: 0, min: 0, max: 0, p95: 0, samples: 0 };
  }

  const sorted = [...samples].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const p95Index = Math.floor(sorted.length * 0.95);

  return {
    avg: Math.round(sum / sorted.length),
    min: sorted[0],
    max: sorted[sorted.length - 1],
    p95: sorted[p95Index] || sorted[sorted.length - 1],
    samples: sorted.length
  };
}

/**
 * Retorna snapshot completo de telemetria
 */
function getSnapshot() {
  return {
    counters: { ...counters },
    latency: {
      google: getLatencyStats('google'),
      bing: getLatencyStats('bing'),
    },
    timestamp: new Date().toISOString()
  };
}

/**
 * Reseta todos os contadores (para testes)
 */
function reset() {
  Object.keys(counters).forEach(k => counters[k] = 0);
  Object.keys(latency).forEach(k => latency[k] = []);
}

module.exports = { increment, recordLatency, getLatencyStats, getSnapshot, reset };
