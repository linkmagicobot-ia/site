#!/usr/bin/env node
/**
 * scripts/update-stats.js
 * 
 * Pre-deploy script — Atualiza os fallbacks estáticos do HTML
 * com dados reais da API antes de cada deploy.
 * 
 * Executa automaticamente via buildCommand no render.yaml.
 * Se a API estiver fora, mantém os valores atuais (fail-safe).
 * 
 * REGRA: Incremental, isolado, reversível, com fallback.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const API_URL = 'https://linkmagico.app.br/api/analytics/public-stats';
const HTML_FILE = path.join(__dirname, '..', 'public', 'index.html');
const TIMEOUT_MS = 8000;

function fetchStats() {
  return new Promise((resolve, reject) => {
    const client = API_URL.startsWith('https') ? https : http;
    const req = client.get(API_URL, { timeout: TIMEOUT_MS }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.success) {
            resolve({
              leads: json.totalLeads || 0,
              assistants: json.totalAssistants || 0,
              conversations: json.totalConversations || 0
            });
          } else {
            reject(new Error('API retornou success=false'));
          }
        } catch (e) {
          reject(new Error('JSON parse error: ' + e.message));
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function updateHTML(stats) {
  let html = fs.readFileSync(HTML_FILE, 'utf-8');
  const original = html;

  // 1. Atualizar data-count no HTML (fallbacks visuais)
  html = html.replace(
    /id="dynamicLeads"\s+data-count="\d+"/,
    `id="dynamicLeads" data-count="${stats.leads}"`
  );
  html = html.replace(
    /id="dynamicConversations"\s+data-count="\d+"/,
    `id="dynamicConversations" data-count="${stats.conversations}"`
  );
  html = html.replace(
    /id="dynamicAssistants"\s+data-count="\d+"/,
    `id="dynamicAssistants" data-count="${stats.assistants}"`
  );

  // 2. Atualizar fallbacks no JS (valores || default)
  html = html.replace(
    /d\.totalLeads\s*\|\|\s*\d+/,
    `d.totalLeads || ${stats.leads}`
  );
  html = html.replace(
    /d\.totalAssistants\s*\|\|\s*\d+/,
    `d.totalAssistants || ${stats.assistants}`
  );
  html = html.replace(
    /d\.totalConversations\s*\|\|\s*\d+/,
    `d.totalConversations || ${stats.conversations}`
  );

  // Verificar se houve mudanças
  if (html === original) {
    console.log('⚠️  [update-stats] Nenhuma alteração detectada (valores já atualizados)');
    return false;
  }

  fs.writeFileSync(HTML_FILE, html, 'utf-8');
  return true;
}

async function main() {
  console.log('🔄 [update-stats] Buscando dados reais da API...');
  
  try {
    const stats = await fetchStats();
    console.log(`📊 [update-stats] API retornou: Leads=${stats.leads}, Assistentes=${stats.assistants}, Conversas=${stats.conversations}`);
    
    const updated = updateHTML(stats);
    if (updated) {
      console.log('✅ [update-stats] Fallbacks do HTML atualizados com sucesso!');
    }
  } catch (err) {
    // FAIL-SAFE: Se a API falhar, NÃO quebra o deploy.
    // Os fallbacks anteriores permanecem intactos.
    console.warn('⚠️  [update-stats] API indisponível (' + err.message + '). Mantendo fallbacks atuais.');
    console.warn('⚠️  [update-stats] Isso é seguro — o JS do cliente tentará buscar dados em tempo real.');
  }

  // Sempre sai com código 0 para não bloquear o deploy
  process.exit(0);
}

main();
