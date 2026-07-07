/**
 * seo/growth/missions.js — Centro de Missões (V5)
 * 
 * Sistema de missões geradas automaticamente.
 * Armazenamento local em memória (sem DB).
 * 
 * REGRAS:
 * - NUNCA modifica páginas, Search Console, ou APIs
 * - Apenas registra status de missões localmente
 */

'use strict';

const roi = require('./roi');
const cache = require('../cache');

// Armazenamento em memória (sem banco de dados)
const missionStore = new Map();

const STATUS = { PENDING: 'Pendente', IN_PROGRESS: 'Em andamento', COMPLETED: 'Concluída', SKIPPED: 'Ignorada' };

/**
 * Gera missões a partir das oportunidades do engine
 */
function generateMissions(engineActions) {
  const missions = [];

  (engineActions || []).forEach((action, i) => {
    const id = `mission_${action.type}_${i}_${Date.now()}`;
    const existing = missionStore.get(id);

    const mission = {
      id: existing ? existing.id : id,
      rank: action.rank || i + 1,
      type: action.type,
      title: action.title,
      target: action.target,
      impactLabel: action.impactLabel || 'Médio',
      estimatedTime: action.estimatedTime || '—',
      estimatedGain: action.estimatedGain || '—',
      complexity: getComplexity(action.type),
      status: existing ? existing.status : STATUS.PENDING,
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
      completedAt: existing ? existing.completedAt : null,
      details: action.details || ''
    };

    missions.push(mission);
  });

  return missions;
}

function getComplexity(type) {
  const map = {
    optimize_page: 'Baixa',
    backlinks: 'Média',
    content: 'Média',
    internal_links: 'Baixa',
    link_suggestions: 'Baixa',
    clusters: 'Média',
    indexnow: 'Baixa'
  };
  return map[type] || 'Média';
}

/**
 * Atualiza status de uma missão
 */
function updateMission(missionId, newStatus) {
  if (!STATUS[newStatus] && !Object.values(STATUS).includes(newStatus)) {
    return { error: true, message: `Status inválido: ${newStatus}` };
  }

  const mission = missionStore.get(missionId);
  if (!mission) {
    // Criar registro novo
    missionStore.set(missionId, {
      id: missionId,
      status: newStatus,
      createdAt: new Date().toISOString(),
      completedAt: newStatus === 'Concluída' ? new Date().toISOString() : null
    });
  } else {
    mission.status = newStatus;
    if (newStatus === 'Concluída') mission.completedAt = new Date().toISOString();
    missionStore.set(missionId, mission);
  }

  console.log(`[SEO-GROWTH-V5] Missions → ${missionId} → ${newStatus}`);
  return { success: true, missionId, status: newStatus };
}

/**
 * Retorna todas as missões com status
 */
function getAllMissions() {
  return Array.from(missionStore.values());
}

/**
 * Retorna estatísticas
 */
function getStats() {
  const all = getAllMissions();
  return {
    total: all.length,
    pending: all.filter(m => m.status === STATUS.PENDING).length,
    inProgress: all.filter(m => m.status === STATUS.IN_PROGRESS).length,
    completed: all.filter(m => m.status === STATUS.COMPLETED).length,
    skipped: all.filter(m => m.status === STATUS.SKIPPED).length
  };
}

module.exports = { generateMissions, updateMission, getAllMissions, getStats, STATUS };
