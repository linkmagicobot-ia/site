/**
 * seo/cache.js — Cache em memória com LRU e request deduplication
 * 
 * REGRAS:
 * - Máximo 100 entradas (LRU eviction)
 * - Nunca crescimento ilimitado
 * - Nunca persistência em disco
 * - Request dedup: se há requisição em andamento para mesma chave,
 *   próximas aguardam a mesma Promise
 */

'use strict';

const config = require('./config');

const store = new Map();        // chave → { value, expiresAt, lastAccess }
const inflight = new Map();     // chave → Promise (request dedup)

/**
 * Busca valor no cache
 * @param {string} key
 * @returns {*|null} valor ou null se expirado/inexistente
 */
function get(key) {
  const entry = store.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    console.log(`[SEO] Cache EXPIRED → ${key}`);
    return null;
  }

  entry.lastAccess = Date.now();
  const remaining = Math.round((entry.expiresAt - Date.now()) / 60000);
  console.log(`[SEO] Cache HIT → ${key} (${remaining}m remaining)`);
  return entry.value;
}

/**
 * Armazena valor no cache com TTL
 * @param {string} key
 * @param {*} value
 * @param {number} ttl - TTL em milissegundos
 */
function set(key, value, ttl) {
  // LRU eviction se atingiu o limite
  if (store.size >= config.CACHE_MAX_ENTRIES && !store.has(key)) {
    evictLRU();
  }

  store.set(key, {
    value,
    expiresAt: Date.now() + ttl,
    lastAccess: Date.now()
  });

  const ttlLabel = ttl >= 3600000 ? `${Math.round(ttl / 3600000)}h` : `${Math.round(ttl / 60000)}m`;
  console.log(`[SEO] Cache SET → ${key} (TTL: ${ttlLabel})`);
}

/**
 * Remove a entrada menos recentemente acessada
 */
function evictLRU() {
  let oldestKey = null;
  let oldestAccess = Infinity;

  for (const [key, entry] of store) {
    if (entry.lastAccess < oldestAccess) {
      oldestAccess = entry.lastAccess;
      oldestKey = key;
    }
  }

  if (oldestKey) {
    store.delete(oldestKey);
    console.log(`[SEO] Cache EVICT (LRU) → ${oldestKey}`);
  }
}

/**
 * Request deduplication: executa fn apenas se não há requisição idêntica em andamento
 * @param {string} key - Chave do cache
 * @param {number} ttl - TTL em milissegundos
 * @param {Function} fn - Função async que busca os dados
 * @returns {*} Dados do cache ou resultado da fn
 */
async function getOrFetch(key, ttl, fn) {
  // 1. Tenta cache
  const cached = get(key);
  if (cached !== null) return cached;

  // 2. Verifica se já há requisição em andamento para esta chave
  if (inflight.has(key)) {
    console.log(`[SEO] Cache DEDUP → ${key} (aguardando requisição existente)`);
    try {
      return await inflight.get(key);
    } catch (e) {
      // Se a requisição original falhou, permite nova tentativa
      return null;
    }
  }

  // 3. Dispara nova requisição
  console.log(`[SEO] Cache MISS → ${key} → fetching from API`);
  const promise = fn();
  inflight.set(key, promise);

  try {
    const result = await promise;
    set(key, result, ttl);
    return result;
  } catch (e) {
    console.error(`[SEO] Cache FETCH ERROR → ${key}: ${e.message}`);
    throw e;
  } finally {
    inflight.delete(key);
  }
}

/**
 * Remove uma chave específica
 * @param {string} key
 */
function clear(key) {
  store.delete(key);
}

/**
 * Remove todas as entradas
 */
function clearAll() {
  store.clear();
  inflight.clear();
  console.log('[SEO] Cache CLEARED');
}

/**
 * Retorna estatísticas do cache
 */
function stats() {
  let valid = 0;
  let expired = 0;
  const now = Date.now();

  for (const [, entry] of store) {
    if (now > entry.expiresAt) expired++;
    else valid++;
  }

  return {
    entries: store.size,
    valid,
    expired,
    inflight: inflight.size,
    maxEntries: config.CACHE_MAX_ENTRIES,
    eviction: config.CACHE_EVICTION
  };
}

module.exports = { get, set, getOrFetch, clear, clearAll, stats };
