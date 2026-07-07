/**
 * seo/gos/financial.js — Estimativa Financeira (funil)
 * impressões → visitantes → leads → vendas → R$
 * NUNCA previsão garantida. Sempre "Estimativa baseada em médias."
 */
'use strict';

// Taxas médias (conservadoras)
const DEFAULTS = {
  ctrToVisitor: 0.03,   // 3% CTR → visitante
  visitorToLead: 0.02,  // 2% conversão lead
  leadToSale: 0.05,     // 5% conversão venda
  avgTicket: 297         // ticket médio R$
};

function estimateFinancial(params) {
  const impressions = params.impressions || 0;
  const ctr = (params.ctr || 3) / 100;
  const visitors = Math.round(impressions * ctr);
  const leads = Math.max(0, Math.round(visitors * DEFAULTS.visitorToLead * 10) / 10);
  const sales = Math.max(0, Math.round(leads * DEFAULTS.leadToSale * 10) / 10);
  const revenue = Math.round(sales * DEFAULTS.avgTicket);

  return {
    impressions,
    visitors,
    leads: parseFloat(leads.toFixed(1)),
    sales: parseFloat(sales.toFixed(1)),
    revenue: 'R$ ' + revenue.toLocaleString('pt-BR'),
    disclaimer: 'Valores aproximados baseados em médias históricas.',
    funnel: [
      { stage: 'Impressões', value: '+' + impressions },
      { stage: 'Visitantes', value: '≈' + visitors },
      { stage: 'Leads', value: '≈' + leads.toFixed(1) },
      { stage: 'Vendas', value: '≈' + sales.toFixed(1) },
      { stage: 'Potencial', value: 'R$ ' + revenue }
    ]
  };
}

function estimateForMission(mission) {
  const gain = mission.estimatedGain || '';
  const num = parseInt(gain.replace(/[^0-9]/g, '')) || 10;
  return estimateFinancial({ impressions: num, ctr: mission.ctr || 3 });
}

module.exports = { estimateFinancial, estimateForMission };
