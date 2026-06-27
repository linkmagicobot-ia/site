/**
 * seo/history.js — Gestão de snapshots históricos
 * Salva, carrega e compara snapshots diários em data/seo/YYYY-MM-DD/
 * 
 * Uso: node seo/history.js list | node seo/history.js latest
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data', 'seo');

/** @param {string} [date] - formato YYYY-MM-DD, padrão hoje */
function getDateDir(date) {
  const d = date || new Date().toISOString().slice(0, 10);
  return path.join(DATA_DIR, d);
}

/**
 * Salva snapshot de dados
 * @param {string|null} date - YYYY-MM-DD ou null para hoje
 * @param {object} data - Dados do snapshot
 */
function saveSnapshot(date, data) {
  const dir = getDateDir(date);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, 'snapshot.json');
  const snapshot = { ...data, savedAt: new Date().toISOString(), date: date || new Date().toISOString().slice(0, 10) };
  fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2));
  console.log(`✅ Snapshot salvo: ${filePath}`);
  return filePath;
}

/**
 * Carrega snapshot de uma data
 * @param {string} date - YYYY-MM-DD
 * @returns {object|null}
 */
function loadSnapshot(date) {
  const filePath = path.join(getDateDir(date), 'snapshot.json');
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

/**
 * Lista todos os snapshots disponíveis
 * @returns {string[]} Datas ordenadas
 */
function listSnapshots() {
  if (!fs.existsSync(DATA_DIR)) return [];
  return fs.readdirSync(DATA_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(d.name))
    .map(d => d.name)
    .sort();
}

/**
 * Retorna o snapshot mais recente
 * @returns {object|null}
 */
function getLatestSnapshot() {
  const dates = listSnapshots();
  if (dates.length === 0) return null;
  return loadSnapshot(dates[dates.length - 1]);
}

/**
 * Compara dois snapshots
 * @param {string} date1 - Data anterior
 * @param {string} date2 - Data mais recente
 * @returns {object} Diferenças
 */
function compareSnapshots(date1, date2) {
  const s1 = loadSnapshot(date1);
  const s2 = loadSnapshot(date2);

  if (!s1 || !s2) {
    return { error: `Snapshot não encontrado: ${!s1 ? date1 : date2}` };
  }

  const diff = { period: { from: date1, to: date2 }, changes: {} };

  // Comparar métricas numéricas no nível summary
  if (s1.summary && s2.summary) {
    for (const key of Object.keys(s2.summary)) {
      if (typeof s2.summary[key] === 'number' && typeof s1.summary[key] === 'number') {
        const delta = s2.summary[key] - s1.summary[key];
        const pct = s1.summary[key] !== 0 ? ((delta / s1.summary[key]) * 100).toFixed(1) : 'N/A';
        diff.changes[key] = { before: s1.summary[key], after: s2.summary[key], delta, percentChange: pct };
      }
    }
  }

  // Comparar contagem de páginas
  if (s1.pages && s2.pages) {
    const newPages = (s2.pages || []).filter(p => !(s1.pages || []).includes(p));
    const removedPages = (s1.pages || []).filter(p => !(s2.pages || []).includes(p));
    diff.newPages = newPages;
    diff.removedPages = removedPages;
  }

  return diff;
}

// CLI
if (require.main === module) {
  const cmd = process.argv[2];
  if (cmd === 'list') {
    const snapshots = listSnapshots();
    if (snapshots.length === 0) {
      console.log('Nenhum snapshot encontrado. Execute: npm run seo:daily');
    } else {
      console.log(`📸 ${snapshots.length} snapshot(s):`);
      snapshots.forEach(s => console.log(`  ${s}`));
    }
  } else if (cmd === 'latest') {
    const latest = getLatestSnapshot();
    if (latest) {
      console.log(JSON.stringify(latest, null, 2));
    } else {
      console.log('Nenhum snapshot encontrado.');
    }
  } else if (cmd === 'compare') {
    const d1 = process.argv[3];
    const d2 = process.argv[4];
    if (!d1 || !d2) { console.log('Uso: node seo/history.js compare YYYY-MM-DD YYYY-MM-DD'); process.exit(1); }
    const diff = compareSnapshots(d1, d2);
    console.log(JSON.stringify(diff, null, 2));
  } else {
    console.log('Uso:');
    console.log('  node seo/history.js list                      Lista snapshots');
    console.log('  node seo/history.js latest                    Último snapshot');
    console.log('  node seo/history.js compare YYYY-MM-DD YYYY-MM-DD   Comparar');
  }
}

module.exports = { saveSnapshot, loadSnapshot, listSnapshots, getLatestSnapshot, compareSnapshots };
