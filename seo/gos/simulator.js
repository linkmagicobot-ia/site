/**
 * seo/gos/simulator.js — Simulação de crescimento
 * Claramente identificado como SIMULAÇÃO, nunca previsão garantida.
 */
'use strict';

const scoring = require('./scoring');

function simulate(params) {
  const { currentScore, currentSEOHealth, currentCTR, currentPosition, missionsToComplete } = params;
  const n = missionsToComplete || 3;

  // Simulação conservadora
  const projectedScore = Math.min(100, (currentScore || 50) + Math.round(n * 2.7));
  const projectedSEO = Math.min(100, (currentSEOHealth || 60) + Math.round(n * 2));
  const projectedCTR = Math.round(((currentCTR || 2) + (n * 0.4)) * 10) / 10;
  const projectedPosition = Math.max(1, Math.round((currentPosition || 40) - (n * 3)));

  return {
    type: 'simulation',
    disclaimer: 'Simulação baseada em médias. Resultados reais podem variar.',
    missionsToComplete: n,
    before: {
      growthScore: currentScore || 50,
      seoHealth: currentSEOHealth || 60,
      ctr: (currentCTR || 2) + '%',
      positionAvg: currentPosition || 40
    },
    after: {
      growthScore: projectedScore,
      seoHealth: projectedSEO,
      ctr: projectedCTR + '%',
      positionAvg: projectedPosition
    },
    deltas: {
      growthScore: '+' + (projectedScore - (currentScore || 50)),
      seoHealth: '+' + (projectedSEO - (currentSEOHealth || 60)),
      ctr: '+' + ((projectedCTR - (currentCTR || 2)).toFixed(1)) + '%',
      positionAvg: (projectedPosition - (currentPosition || 40))
    },
    generatedAt: new Date().toISOString()
  };
}

module.exports = { simulate };
