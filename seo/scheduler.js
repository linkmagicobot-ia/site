/**
 * seo/scheduler.js — Orquestrador de tarefas SEO
 * Executa auditoria, salva snapshots e gera relatórios.
 * 
 * Uso: node seo/scheduler.js daily|weekly|monthly
 * npm: npm run seo:daily | npm run seo:weekly | npm run seo:monthly
 */

const path = require('path');
const { execSync } = require('child_process');
const history = require('./history');
const reports = require('./reports');
const { checkAlerts, formatAlerts, saveAlerts } = require('./alerts');

const ROOT = path.join(__dirname, '..');

/**
 * Executa auditoria e retorna dados
 */
function runAudit() {
  try {
    execSync('node seo/audit.js', { cwd: ROOT, stdio: 'pipe' });
    const reportPath = path.join(ROOT, 'reports', 'seo-audit.json');
    const fs = require('fs');
    if (fs.existsSync(reportPath)) {
      return JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
    }
  } catch (e) {
    console.log(`⚠️  Auditoria retornou com avisos: ${e.message.split('\n')[0]}`);
    // Mesmo com warnings, o report pode ter sido gerado
    const fs = require('fs');
    const reportPath = path.join(ROOT, 'reports', 'seo-audit.json');
    if (fs.existsSync(reportPath)) {
      return JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
    }
  }
  return null;
}

/**
 * Tarefa diária: auditoria + snapshot + alertas
 */
async function runDaily() {
  console.log(`\n╔══════════════════════════════════════════╗`);
  console.log(`║  📅 Tarefa Diária SEO                    ║`);
  console.log(`╚══════════════════════════════════════════╝\n`);

  const date = new Date().toISOString().slice(0, 10);
  console.log(`📅 Data: ${date}\n`);

  // 1. Executar auditoria
  console.log('1️⃣  Executando auditoria SEO...');
  const auditData = runAudit();
  if (auditData) {
    console.log(`   ✅ ${auditData.summary.passed} aprovados, ${auditData.summary.warnings} avisos, ${auditData.summary.errors} erros\n`);
  } else {
    console.log('   ⚠️  Falha ao executar auditoria\n');
  }

  // 2. Executar relatório de indexação
  console.log('2️⃣  Gerando relatório de indexação...');
  try {
    execSync('node seo/index-report.js', { cwd: ROOT, stdio: 'pipe' });
    console.log('   ✅ Relatório gerado\n');
  } catch (e) {
    console.log(`   ⚠️  ${e.message.split('\n')[0]}\n`);
  }

  // 3. Salvar snapshot
  console.log('3️⃣  Salvando snapshot...');
  const snapshotData = {
    summary: auditData ? auditData.summary : {},
    pages: auditData ? Object.keys(auditData.pages.reduce((acc, p) => { acc[p.page] = true; return acc; }, {})) : [],
    global: auditData ? auditData.global : []
  };
  history.saveSnapshot(date, snapshotData);

  // 4. Verificar alertas
  console.log('\n4️⃣  Verificando alertas...');
  const snapshots = history.listSnapshots();
  if (snapshots.length >= 2) {
    const current = history.loadSnapshot(snapshots[snapshots.length - 1]);
    const previous = history.loadSnapshot(snapshots[snapshots.length - 2]);
    const alerts = checkAlerts(current, previous);
    console.log(formatAlerts(alerts));
    if (alerts.length > 0 && alerts[0].type !== 'info') saveAlerts(alerts);
  } else {
    console.log('   ℹ️  Primeiro snapshot, sem comparação disponível\n');
  }

  // 5. Gerar relatório diário
  console.log('5️⃣  Gerando relatório diário...');
  reports.generateDaily(auditData);

  console.log(`\n✅ Tarefa diária concluída para ${date}\n`);
}

/**
 * Tarefa semanal: comparação + relatório
 */
async function runWeekly() {
  console.log(`\n╔══════════════════════════════════════════╗`);
  console.log(`║  📊 Tarefa Semanal SEO                   ║`);
  console.log(`╚══════════════════════════════════════════╝\n`);

  const snapshots = history.listSnapshots();
  const latest = snapshots.length > 0 ? history.loadSnapshot(snapshots[snapshots.length - 1]) : null;

  // Encontrar snapshot de ~7 dias atrás
  let previous = null;
  if (snapshots.length >= 2) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - 7);
    const targetStr = targetDate.toISOString().slice(0, 10);
    
    // Encontrar o mais próximo de 7 dias atrás
    let closest = snapshots[0];
    for (const s of snapshots) {
      if (s <= targetStr) closest = s;
    }
    previous = history.loadSnapshot(closest);
  }

  reports.generateWeekly(latest, previous);
  console.log('\n✅ Tarefa semanal concluída\n');
}

/**
 * Tarefa mensal: resumo + relatório
 */
async function runMonthly() {
  console.log(`\n╔══════════════════════════════════════════╗`);
  console.log(`║  📈 Tarefa Mensal SEO                    ║`);
  console.log(`╚══════════════════════════════════════════╝\n`);

  const snapshots = history.listSnapshots();
  const latest = snapshots.length > 0 ? history.loadSnapshot(snapshots[snapshots.length - 1]) : null;

  // Encontrar snapshot de ~30 dias atrás
  let previous = null;
  if (snapshots.length >= 2) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - 30);
    const targetStr = targetDate.toISOString().slice(0, 10);
    
    let closest = snapshots[0];
    for (const s of snapshots) {
      if (s <= targetStr) closest = s;
    }
    previous = history.loadSnapshot(closest);
  }

  reports.generateMonthly(latest, previous);
  console.log('\n✅ Tarefa mensal concluída\n');
}

// CLI
if (require.main === module) {
  const cmd = process.argv[2];
  if (cmd === 'daily') runDaily().catch(e => { console.error('Erro:', e.message); process.exit(1); });
  else if (cmd === 'weekly') runWeekly().catch(e => { console.error('Erro:', e.message); process.exit(1); });
  else if (cmd === 'monthly') runMonthly().catch(e => { console.error('Erro:', e.message); process.exit(1); });
  else {
    console.log('Uso: node seo/scheduler.js daily|weekly|monthly');
  }
}

module.exports = { runDaily, runWeekly, runMonthly };
