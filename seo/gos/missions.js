/**
 * seo/gos/missions.js — Mission Center + Achievement System
 * 
 * V2.4 — Persistência em arquivo JSON para sobreviver restarts.
 * Fallback: se file I/O falhar, funciona 100% em memória (comportamento anterior).
 */
'use strict';

const fs = require('fs');
const path = require('path');

// Arquivo de persistência — na raiz do projeto
const STORE_FILE = path.join(__dirname, '..', '..', 'data', 'missions-status.json');

const store = new Map();
const achievements = new Map();
const STATUS = { PENDING: 'Pendente', IN_PROGRESS: 'Em andamento', COMPLETED: 'Concluída', SKIPPED: 'Ignorada' };

// ===== PERSISTÊNCIA (safe, com fallback) =====

/**
 * Carrega status salvos do disco para o Map em memória.
 * Se o arquivo não existir ou estiver corrompido, ignora silenciosamente.
 */
function loadFromDisk() {
  try {
    if (!fs.existsSync(STORE_FILE)) {
      console.log('[GOS] Missions → nenhum arquivo de persistência encontrado, iniciando vazio.');
      return;
    }
    const raw = fs.readFileSync(STORE_FILE, 'utf-8');
    const data = JSON.parse(raw);
    if (data && typeof data === 'object') {
      Object.entries(data).forEach(([id, mission]) => {
        store.set(id, mission);
      });
      console.log(`[GOS] Missions → ${store.size} status carregados do disco.`);
    }
  } catch (e) {
    console.error(`[GOS] Missions → erro ao carregar persistência (fallback memória): ${e.message}`);
  }
}

/**
 * Salva o Map em memória para disco.
 * Se falhar, loga o erro mas não impacta o funcionamento.
 */
function saveToDisk() {
  try {
    const dir = path.dirname(STORE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const data = {};
    store.forEach((v, k) => { data[k] = v; });
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`[GOS] Missions → ${store.size} status salvos em disco.`);
  } catch (e) {
    console.error(`[GOS] Missions → erro ao salvar persistência (dados em memória intactos): ${e.message}`);
  }
}

// Carregar dados salvos na inicialização
loadFromDisk();

// ===== MISSÕES =====

function generateMissions(actions) {
  return (actions || []).map((a, i) => {
    const id = `gos_m_${a.type}_${i}`;
    const existing = store.get(id);
    return {
      id, rank: a.rank || i + 1, type: a.type, title: a.title, target: a.target,
      impactLabel: a.impactLabel, estimatedTime: a.estimatedTime, estimatedGain: a.estimatedGain,
      complexity: a.complexity || 'Média', stars: a.stars || 3,
      status: existing ? existing.status : STATUS.PENDING,
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
      completedAt: existing ? existing.completedAt : null
    };
  });
}

function updateMission(id, newStatus) {
  const valid = Object.values(STATUS);
  if (!valid.includes(newStatus)) return { error: true, message: 'Status inválido' };
  const m = store.get(id) || { id, createdAt: new Date().toISOString() };
  m.status = newStatus;
  if (newStatus === STATUS.COMPLETED) { m.completedAt = new Date().toISOString(); checkAchievements(); }
  store.set(id, m);
  saveToDisk(); // Persiste imediatamente
  console.log(`[GOS] Mission ${id} → ${newStatus}`);
  return { success: true, id, status: newStatus };
}

function getStats() {
  const all = Array.from(store.values());
  return {
    total: all.length,
    pending: all.filter(m => m.status === STATUS.PENDING).length,
    inProgress: all.filter(m => m.status === STATUS.IN_PROGRESS).length,
    completed: all.filter(m => m.status === STATUS.COMPLETED).length,
    skipped: all.filter(m => m.status === STATUS.SKIPPED).length
  };
}

// ===== ACHIEVEMENTS =====
const ACHIEVEMENT_DEFS = [
  { id: 'first_mission', name: 'Primeira Missão', desc: 'Concluir a primeira missão', check: s => s.completed >= 1 },
  { id: 'five_missions', name: 'Executor', desc: 'Concluir 5 missões', check: s => s.completed >= 5 },
  { id: 'ten_missions', name: 'Estrategista', desc: 'Concluir 10 missões', check: s => s.completed >= 10 },
  { id: 'twenty_missions', name: 'Growth Master', desc: 'Concluir 20 missões', check: s => s.completed >= 20 }
];

function checkAchievements() {
  const stats = getStats();
  ACHIEVEMENT_DEFS.forEach(a => {
    if (!achievements.has(a.id) && a.check(stats)) {
      achievements.set(a.id, { ...a, earnedAt: new Date().toISOString(), status: 'Conquistado' });
      console.log(`[GOS] Achievement unlocked: ${a.name}`);
    }
  });
}

function getAchievements(extraChecks) {
  // Extra checks baseados em dados externos
  const extra = [
    { id: 'page1', name: 'Primeira Página', desc: 'Ter pelo menos 1 query no Top 10', status: (extraChecks && extraChecks.nearPage1 > 0) ? 'Conquistado' : 'Em andamento' },
    { id: 'indexed_100', name: '100 Páginas Indexadas', desc: 'Ter 100+ páginas indexadas', status: (extraChecks && extraChecks.totalPages >= 100) ? 'Conquistado' : 'Em andamento' },
    { id: 'ctr_10', name: 'CTR Acima de 10%', desc: 'CTR médio superior a 10%', status: (extraChecks && extraChecks.ctr > 10) ? 'Conquistado' : 'Em andamento' },
    { id: 'no_orphans', name: 'Sem Órfãs', desc: 'Zero páginas sem links internos', status: (extraChecks && extraChecks.orphanPages === 0) ? 'Conquistado' : 'Em andamento' },
    { id: 'score_80', name: 'Score 80+', desc: 'Score SEO médio acima de 80', status: (extraChecks && extraChecks.averageScore >= 80) ? 'Conquistado' : 'Em andamento' }
  ];

  const missionAchs = ACHIEVEMENT_DEFS.map(a => {
    const earned = achievements.get(a.id);
    return { id: a.id, name: a.name, desc: a.desc, status: earned ? 'Conquistado' : 'Em andamento', earnedAt: earned ? earned.earnedAt : null };
  });

  return [...missionAchs, ...extra];
}

module.exports = { generateMissions, updateMission, getStats, getAchievements, STATUS };
