/**
 * seo/reports.js — Geração de relatórios SEO
 * Gera relatórios diários, semanais e mensais.
 * 
 * Uso: node seo/reports.js daily|weekly|monthly
 */

const fs = require('fs');
const path = require('path');

const REPORTS_DIR = path.join(__dirname, '..', 'reports');

/**
 * Gera relatório diário
 * @param {object} data - Dados da auditoria/snapshot
 * @returns {string} Caminho do relatório
 */
function generateDaily(data) {
  if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const date = new Date().toISOString().slice(0, 10);
  
  let md = `# Relatório Diário SEO — ${date}\n\n`;
  md += `**Gerado:** ${new Date().toISOString()}\n\n`;
  md += `## Resumo do Dia\n\n`;

  if (data && data.summary) {
    md += `| Métrica | Valor |\n|---|---|\n`;
    const labels = { total: 'Verificações', passed: 'Aprovadas', warnings: 'Avisos', errors: 'Erros', totalUrls: 'URLs no sitemap', totalHtmlFiles: 'Arquivos HTML', orphanPages: 'Páginas órfãs' };
    for (const [k, v] of Object.entries(data.summary)) {
      md += `| ${labels[k] || k} | ${v} |\n`;
    }
  } else {
    md += `Sem dados disponíveis. Execute \`npm run seo:audit\` primeiro.\n`;
  }

  md += `\n## Status\n\n`;
  md += `- Auditoria: ${data ? '✅ Executada' : '⏳ Pendente'}\n`;
  md += `- Search Console: ⏳ Aguardando integração\n`;
  md += `- Bing Webmaster: ⏳ Aguardando integração\n`;
  md += `- IndexNow: ${process.env.INDEXNOW_KEY ? '✅ Configurado' : '⏳ Pendente'}\n`;

  const filePath = path.join(REPORTS_DIR, `daily-${date}.md`);
  fs.writeFileSync(filePath, md);
  fs.writeFileSync(path.join(REPORTS_DIR, `daily-${date}.json`), JSON.stringify({ date, type: 'daily', data, generatedAt: new Date().toISOString() }, null, 2));

  console.log(`📄 Relatório diário: ${filePath}`);
  return filePath;
}

/**
 * Gera relatório semanal comparativo
 * @param {object} currentData - Dados atuais
 * @param {object|null} previousData - Dados da semana anterior
 */
function generateWeekly(currentData, previousData) {
  if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const date = new Date().toISOString().slice(0, 10);

  let md = `# Relatório Semanal SEO — Semana de ${date}\n\n`;
  md += `**Gerado:** ${new Date().toISOString()}\n\n`;

  md += `## Comparação Semanal\n\n`;
  md += `| Métrica | Anterior | Atual | Δ |\n|---|---|---|---|\n`;

  if (currentData?.summary && previousData?.summary) {
    for (const key of Object.keys(currentData.summary)) {
      if (typeof currentData.summary[key] === 'number') {
        const curr = currentData.summary[key];
        const prev = previousData.summary[key] || 0;
        const delta = curr - prev;
        const icon = delta > 0 ? '📈' : delta < 0 ? '📉' : '➡️';
        md += `| ${key} | ${prev} | ${curr} | ${icon} ${delta > 0 ? '+' : ''}${delta} |\n`;
      }
    }
  } else {
    md += `| — | — | — | Dados insuficientes |\n`;
  }

  md += `\n## Recomendações\n\n`;
  md += `1. Verificar páginas com avisos na auditoria\n`;
  md += `2. Monitorar Core Web Vitals no Search Console\n`;
  md += `3. Revisar consultas em queda no Search Console\n`;
  md += `4. Verificar novos backlinks no Bing Webmaster\n`;

  const filePath = path.join(REPORTS_DIR, `weekly-${date}.md`);
  fs.writeFileSync(filePath, md);
  fs.writeFileSync(path.join(REPORTS_DIR, `weekly-${date}.json`), JSON.stringify({ date, type: 'weekly', currentData, previousData, generatedAt: new Date().toISOString() }, null, 2));

  console.log(`📄 Relatório semanal: ${filePath}`);
  return filePath;
}

/**
 * Gera relatório mensal
 * @param {object} currentData
 * @param {object|null} previousData
 */
function generateMonthly(currentData, previousData) {
  if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const date = new Date().toISOString().slice(0, 10);
  const month = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  let md = `# Relatório Mensal SEO — ${month}\n\n`;
  md += `**Gerado:** ${new Date().toISOString()}\n\n`;

  md += `## Visão Geral do Mês\n\n`;
  if (currentData?.summary) {
    md += `| Métrica | Valor |\n|---|---|\n`;
    for (const [k, v] of Object.entries(currentData.summary)) {
      md += `| ${k} | ${v} |\n`;
    }
  }

  md += `\n## Desempenho por Cluster\n\n`;
  md += `| Cluster | Páginas | Status |\n|---|---|---|\n`;
  const clusters = ['clínicas', 'imobiliárias', 'e-commerce', 'restaurantes', 'infoprodutores'];
  clusters.forEach(c => md += `| ${c} | 6 | ✅ Ativo |\n`);

  md += `\n## Conteúdo\n\n`;
  md += `| Tipo | Total |\n|---|---|\n`;
  md += `| Glossário | 17 termos |\n`;
  md += `| Blog | 6 artigos |\n`;
  md += `| Ferramentas | 1 |\n`;
  md += `| Clusters | 25 ativos |\n`;

  md += `\n## Próximos Passos\n\n`;
  md += `1. Expandir glossário com novos termos\n`;
  md += `2. Publicar novos artigos no blog\n`;
  md += `3. Considerar novos segmentos de cluster\n`;
  md += `4. Otimizar páginas com CTR baixo\n`;
  md += `5. Criar conteúdo para consultas em crescimento\n`;

  const filePath = path.join(REPORTS_DIR, `monthly-${date}.md`);
  fs.writeFileSync(filePath, md);
  fs.writeFileSync(path.join(REPORTS_DIR, `monthly-${date}.json`), JSON.stringify({ date, type: 'monthly', currentData, previousData, generatedAt: new Date().toISOString() }, null, 2));

  console.log(`📄 Relatório mensal: ${filePath}`);
  return filePath;
}

// CLI
if (require.main === module) {
  const type = process.argv[2];
  if (type === 'daily') generateDaily(null);
  else if (type === 'weekly') generateWeekly(null, null);
  else if (type === 'monthly') generateMonthly(null, null);
  else {
    console.log('Uso: node seo/reports.js daily|weekly|monthly');
  }
}

module.exports = { generateDaily, generateWeekly, generateMonthly };
