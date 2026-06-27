/**
 * seo/alerts.js — Sistema de alertas SEO
 * Detecta quedas de métricas, erros e problemas.
 * 
 * Uso: node seo/alerts.js check
 * npm: npm run seo:alerts
 */

const fs = require('fs');
const path = require('path');
const history = require('./history');

const ALERTS_DIR = path.join(__dirname, '..', 'data', 'seo', 'alerts');

/** Limiares de alerta */
const THRESHOLDS = {
  impressionsDrop: 20,    // % queda
  ctrDrop: 15,            // % queda
  positionDrop: 3,        // posições
  pagesRemoved: 1,        // qualquer remoção
};

/**
 * Compara dados atuais vs anteriores e gera alertas
 * @param {object} current - Dados atuais
 * @param {object} previous - Dados do período anterior
 * @returns {object[]} Lista de alertas
 */
function checkAlerts(current, previous) {
  const alerts = [];

  if (!current || !previous) {
    return [{ type: 'info', message: 'Dados insuficientes para comparação. Execute ao menos 2 snapshots diários.', severity: 'low' }];
  }

  const cs = current.summary || {};
  const ps = previous.summary || {};

  // Queda de impressões
  if (ps.impressions && cs.impressions) {
    const drop = ((ps.impressions - cs.impressions) / ps.impressions) * 100;
    if (drop >= THRESHOLDS.impressionsDrop) {
      alerts.push({ type: 'impressions_drop', severity: 'high', message: `Impressões caíram ${drop.toFixed(1)}% (${ps.impressions} → ${cs.impressions})`, threshold: THRESHOLDS.impressionsDrop, actual: drop.toFixed(1) });
    }
  }

  // Queda de CTR
  if (ps.ctr && cs.ctr) {
    const drop = ((ps.ctr - cs.ctr) / ps.ctr) * 100;
    if (drop >= THRESHOLDS.ctrDrop) {
      alerts.push({ type: 'ctr_drop', severity: 'high', message: `CTR caiu ${drop.toFixed(1)}% (${ps.ctr}% → ${cs.ctr}%)`, threshold: THRESHOLDS.ctrDrop, actual: drop.toFixed(1) });
    }
  }

  // Queda de posição
  if (ps.position && cs.position) {
    const drop = cs.position - ps.position;
    if (drop >= THRESHOLDS.positionDrop) {
      alerts.push({ type: 'position_drop', severity: 'medium', message: `Posição média caiu ${drop.toFixed(1)} posições (${ps.position} → ${cs.position})`, threshold: THRESHOLDS.positionDrop, actual: drop.toFixed(1) });
    }
  }

  // Páginas removidas do índice
  if (ps.indexedPages && cs.indexedPages) {
    const removed = ps.indexedPages - cs.indexedPages;
    if (removed >= THRESHOLDS.pagesRemoved) {
      alerts.push({ type: 'pages_removed', severity: 'high', message: `${removed} página(s) removida(s) do índice (${ps.indexedPages} → ${cs.indexedPages})`, threshold: THRESHOLDS.pagesRemoved, actual: removed });
    }
  }

  // Erros de auditoria local
  if (cs.errors && cs.errors > 0) {
    alerts.push({ type: 'audit_errors', severity: 'medium', message: `${cs.errors} erro(s) na auditoria SEO local`, actual: cs.errors });
  }

  // Links quebrados
  if (cs.brokenLinks && cs.brokenLinks > 0) {
    alerts.push({ type: 'broken_links', severity: 'high', message: `${cs.brokenLinks} link(s) quebrado(s) detectado(s)`, actual: cs.brokenLinks });
  }

  return alerts;
}

/**
 * Formata alertas para exibição
 * @param {object[]} alerts
 * @returns {string}
 */
function formatAlerts(alerts) {
  if (alerts.length === 0) return '✅ Nenhum alerta ativo.\n';

  let output = `⚠️  ${alerts.length} alerta(s) detectado(s):\n\n`;
  const icons = { high: '🔴', medium: '🟡', low: '🔵', info: 'ℹ️' };

  for (const alert of alerts) {
    output += `${icons[alert.severity] || '⚠️'} [${alert.type}] ${alert.message}\n`;
  }

  return output;
}

/**
 * Salva alertas no histórico
 * @param {object[]} alerts
 */
function saveAlerts(alerts) {
  if (!fs.existsSync(ALERTS_DIR)) fs.mkdirSync(ALERTS_DIR, { recursive: true });
  const filename = `alerts-${new Date().toISOString().slice(0, 10)}.json`;
  const filePath = path.join(ALERTS_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify({ timestamp: new Date().toISOString(), alerts }, null, 2));
  console.log(`📄 Alertas salvos: ${filePath}`);
}

// CLI
if (require.main === module) {
  const cmd = process.argv[2];

  if (cmd === 'check') {
    console.log(`\n╔══════════════════════════════════════════╗`);
    console.log(`║  🔔 Sistema de Alertas SEO               ║`);
    console.log(`╚══════════════════════════════════════════╝\n`);

    const snapshots = history.listSnapshots();
    if (snapshots.length < 2) {
      console.log('ℹ️  Dados insuficientes. Execute ao menos 2 snapshots diários:');
      console.log('   npm run seo:daily\n');
      process.exit(0);
    }

    const current = history.loadSnapshot(snapshots[snapshots.length - 1]);
    const previous = history.loadSnapshot(snapshots[snapshots.length - 2]);

    const alerts = checkAlerts(current, previous);
    console.log(formatAlerts(alerts));

    if (alerts.length > 0) {
      saveAlerts(alerts);
    }
  } else {
    console.log('Uso: node seo/alerts.js check');
  }
}

module.exports = { checkAlerts, formatAlerts, saveAlerts, THRESHOLDS };
