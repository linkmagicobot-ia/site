const fs = require('fs');
const path = require('path');

const slug = process.argv[2];
if (!slug) { console.error('Uso: node generate-cluster.js <slug>'); process.exit(1); }

const configPath = path.join(__dirname, 'cluster-config', slug + '.json');
if (!fs.existsSync(configPath)) { console.error(`Config não encontrado: ${configPath}`); process.exit(1); }

const C = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const BASE = 'https://site.linkmagico.app.br';

// Ensure dirs
['templates','fluxos','checklists','prompts','exemplos'].forEach(d => {
  const dir = path.join(__dirname, 'public', d);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ========== SHARED ==========
const head = (title, desc, canonical) => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — LinkMágico</title>
<meta name="description" content="${desc}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${BASE}/${canonical}">
<meta property="og:type" content="article">
<meta property="og:title" content="${title} — LinkMágico">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${BASE}/${canonical}">
<meta property="og:image" content="${BASE}/og-linkmagico.png">
<meta property="og:locale" content="pt_BR">
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%237c3aed'><path d='M13 2L3 14h7l-2 8 10-12h-7l2-8z'/></svg>">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">`;

const bcSchema = (items) => items.map((it,i) => `{"@type":"ListItem","position":${i+1},"name":"${it.n}"${it.u?`,"item":"${BASE}${it.u}"`:''}}` ).join(',');
const bcHtml = (items) => items.map((it,i) => i < items.length-1 ? `<a href="${it.u||'/'}">${it.n}</a> ›` : `<strong>${it.n}</strong>`).join(' ');

const css = `*{margin:0;padding:0;box-sizing:border-box}:root{--bg:#06060e;--surface:#0e0e1a;--surface2:#151525;--border:#1e1e35;--purple:#7c3aed;--purple-l:#a78bfa;--green:#10b981;--green-l:#34d399;--text:#f0eeff;--muted:#7a7896;--accent:${C.cor}}body{font-family:'Inter',system-ui,sans-serif;color:var(--text);background:var(--bg);line-height:1.7}a{color:var(--purple-l);text-decoration:none}a:hover{text-decoration:underline}.container{max-width:800px;margin:0 auto;padding:0 24px}
header{position:fixed;top:0;left:0;right:0;z-index:100;padding:14px 0;background:rgba(6,6,14,.92);backdrop-filter:blur(16px);border-bottom:1px solid var(--border)}.nav{display:flex;align-items:center;justify-content:space-between;max-width:1140px;margin:0 auto;padding:0 24px}.nav__logo{font-size:1.25rem;font-weight:800;font-family:'Space Grotesk',sans-serif}.logo-hl{background:linear-gradient(135deg,var(--purple),var(--green));-webkit-background-clip:text;-webkit-text-fill-color:transparent}.nav__links{display:flex;gap:20px;align-items:center}.nav__links a{color:var(--muted);font-size:.9rem}.nav__links a:hover{color:var(--text);text-decoration:none}.btn-cta{background:linear-gradient(135deg,var(--purple),#5b21b6);color:#fff!important;padding:8px 20px;border-radius:8px;font-weight:600;font-size:.85rem}
.breadcrumb{padding:90px 0 0;font-size:.83rem;color:var(--muted)}.breadcrumb a{color:var(--muted)}
.hero{padding:24px 0 32px;text-align:center}.hero .tag{display:inline-flex;align-items:center;gap:8px;background:${C.corRgba},.15);border:1px solid ${C.corRgba},.3);color:var(--accent);padding:6px 16px;border-radius:20px;font-size:.8rem;font-weight:600;margin-bottom:12px}
h1{font-family:'Space Grotesk',sans-serif;font-size:clamp(1.4rem,3.5vw,2rem);font-weight:800;margin-bottom:8px;line-height:1.3}h1 span{color:var(--accent)}
.subtitle{color:var(--muted);font-size:.95rem;max-width:560px;margin:0 auto}
h2{font-family:'Space Grotesk',sans-serif;font-size:1.15rem;font-weight:700;margin:32px 0 16px;display:flex;align-items:center;gap:8px}h2 i{color:var(--accent);font-size:1rem}
.card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:18px;margin-bottom:12px;transition:border-color .3s}.card:hover{border-color:var(--accent)}
.card-title{font-weight:700;font-size:.9rem;margin-bottom:4px;display:flex;align-items:center;gap:8px}.card-title i{color:var(--accent)}
.card p{font-size:.85rem;color:var(--muted)}
.msg-box{background:var(--surface);border-left:3px solid var(--accent);border-radius:0 10px 10px 0;padding:14px 18px;margin:10px 0;font-size:.86rem;color:var(--muted);white-space:pre-line}
.copy-btn{background:rgba(124,58,237,.15);border:1px solid rgba(124,58,237,.3);color:var(--purple-l);padding:4px 12px;border-radius:6px;font-size:.75rem;cursor:pointer;font-family:'Inter',sans-serif;margin-left:auto}.copy-btn:hover{background:rgba(124,58,237,.3)}
.step{display:flex;gap:14px;margin-bottom:16px}.step-num{width:32px;height:32px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.85rem;flex-shrink:0}.step-content{flex:1}.step-content strong{display:block;font-size:.9rem;margin-bottom:2px}.step-content p{font-size:.84rem;color:var(--muted)}
.check-item{display:flex;align-items:flex-start;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)}.check-item:last-child{border-bottom:none}.check-item i{color:var(--green-l);margin-top:3px;flex-shrink:0}.check-item span{font-size:.88rem}
.tag-list{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.tag-item{background:${C.corRgba},.1);border:1px solid ${C.corRgba},.2);color:var(--accent);padding:5px 14px;border-radius:16px;font-size:.8rem;font-weight:600}
.related{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:20px;margin-top:32px}.related h3{font-size:.9rem;margin-bottom:10px}.related a{display:block;font-size:.84rem;padding:5px 0;color:var(--purple-l);border-bottom:1px solid var(--border)}.related a:last-child{border-bottom:none}.related a:hover{color:var(--green-l);text-decoration:none}.related a i{margin-right:6px;font-size:.7rem}
.cta-box{background:linear-gradient(135deg,rgba(124,58,237,.1),${C.corRgba},.1));border:1px solid rgba(124,58,237,.2);border-radius:14px;padding:28px;text-align:center;margin-top:32px}.cta-box h3{font-family:'Space Grotesk',sans-serif;font-size:1.1rem;margin-bottom:6px}.cta-box p{color:var(--muted);font-size:.88rem;margin-bottom:14px}.cta-box .btn-cta{display:inline-block;padding:10px 28px;font-size:.95rem;border-radius:10px;text-decoration:none}
.flow-diagram{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:24px;margin:16px 0}
.flow-row{display:flex;align-items:center;gap:12px;margin:8px 0;flex-wrap:wrap;justify-content:center}
.flow-box{background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:10px 16px;font-size:.84rem;text-align:center;min-width:140px}
.flow-box.start{border-color:var(--accent);color:var(--accent);font-weight:700}
.flow-box.action{border-color:var(--green);color:var(--green-l)}
.flow-box.decision{border-color:var(--purple);color:var(--purple-l)}
.flow-box.end_yes{border-color:var(--green);background:rgba(16,185,129,.1);color:var(--green-l);font-weight:700}
.flow-box.end_no{border-color:var(--muted);color:var(--muted)}
.flow-arrow-d{text-align:center;color:var(--muted);font-size:.75rem;padding:4px 0}
.flow-branch{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:8px 0}
.flow-label{font-size:.72rem;color:var(--muted);text-align:center;padding:2px 8px;background:var(--surface2);border-radius:4px;display:inline-block}
.chat{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:20px;margin:16px 0}
.chat-msg{display:flex;gap:10px;margin-bottom:12px}.chat-msg:last-child{margin-bottom:0}
.chat-avatar{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.8rem;flex-shrink:0}
.chat-avatar.user{background:${C.corRgba},.2);color:var(--accent)}
.chat-avatar.bot{background:rgba(124,58,237,.2);color:var(--purple-l)}
.chat-bubble{background:var(--bg);border-radius:0 12px 12px 12px;padding:10px 14px;font-size:.85rem;color:var(--muted);max-width:80%;line-height:1.6;white-space:pre-line}
.chat-msg.bot .chat-bubble{border-radius:12px 0 12px 12px}
.chat-label{font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px}
.chat-label.user{color:var(--accent)}.chat-label.bot{color:var(--purple-l)}
.example-note{background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.2);border-radius:8px;padding:10px 14px;font-size:.8rem;color:#f59e0b;margin:16px 0;display:flex;align-items:center;gap:8px}
footer{margin-top:60px;padding:40px 0;border-top:1px solid var(--border);text-align:center;color:var(--muted);font-size:.85rem}
@media(max-width:480px){.container{padding:0 16px}.nav__links a:not(.btn-cta){display:none}}`;

const hdr = `<header><nav class="nav"><a href="/" class="nav__logo">⚡ <span class="logo-hl">LinkMágico</span></a><div class="nav__links"><a href="/">Home</a><a href="/blog/">Blog</a><a href="/glossario">Glossário</a><a href="https://linkmagico.app.br/pricing.html" class="btn-cta">Ver Planos</a></div></nav></header>`;
const ftr = `<footer><div class="container"><p>© 2025 LinkMágico — Todos os direitos reservados.</p><p style="margin-top:8px"><a href="/">Início</a> · <a href="/${slug}">${C.segmento}</a> · <a href="/glossario">Glossário</a> · <a href="/docs">Docs</a> · <a href="/politica-de-privacidade">Privacidade</a></p></div></footer>`;

const glossaryLinks = C.glossario.map(g => `<a href="/glossario/${g}"><i class="fas fa-book-open"></i> ${g.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</a>`).join('\n');

const clusterNav = `<div class="related" style="background:linear-gradient(135deg,${C.corRgba},.05),rgba(124,58,237,.05));border-color:${C.corRgba},.2)">
<h3>📋 Cluster ${C.segmento} — Navegação</h3>
<a href="/${slug}" style="color:${C.cor}"><i class="fas ${C.icone}"></i> Landing Page — Chatbot para ${C.segmento}</a>
<a href="/templates/${slug}"><i class="fas fa-message"></i> Templates de Mensagens</a>
<a href="/fluxos/${slug}"><i class="fas fa-diagram-project"></i> Fluxos de Atendimento</a>
<a href="/checklists/${slug}"><i class="fas fa-list-check"></i> Checklist de Implantação</a>
<a href="/prompts/${slug}"><i class="fas fa-brain"></i> Biblioteca de Prompts</a>
<a href="/exemplos/${slug}"><i class="fas fa-comments"></i> Exemplos de Conversa</a>
<a href="/ferramentas/calculadora-roi"><i class="fas fa-calculator"></i> Calculadora de ROI</a>
${glossaryLinks}
</div>`;

const ctaBox = `<div class="cta-box"><h3>Teste o LinkMágico para ${C.segmento.toLowerCase()}</h3><p>Crie seu assistente virtual em menos de 2 minutos. Plano gratuito disponível.</p><a href="https://linkmagico.app.br/signup.html" class="btn-cta">Criar Conta Grátis →</a></div>`;

const copyScript = `<script>function copyMsg(btn){const msg=btn.closest('.card').querySelector('.msg-box').textContent;navigator.clipboard.writeText(msg);btn.textContent='✅ Copiado!';setTimeout(()=>btn.textContent='Copiar',2000)}</script>`;

// ========== 1. TEMPLATES ==========
function genTemplates() {
  const bc = [{n:'Início',u:'/'},{n:'Templates'},{n:C.segmento}];
  let body = '';
  for (const [cat, msgs] of Object.entries(C.templates)) {
    const catName = cat.replace(/([A-Z])/g,' $1').replace(/^./,s=>s.toUpperCase()).replace('Pos ','Pós-');
    body += `<h2><i class="fas fa-message"></i> ${catName}</h2>\n`;
    msgs.forEach((m,i) => {
      body += `<div class="card"><div class="card-title"><span>${catName} #${i+1}</span><button class="copy-btn" onclick="copyMsg(this)">Copiar</button></div><div class="msg-box">${m}</div></div>\n`;
    });
  }
  const total = Object.values(C.templates).flat().length;
  return `${head(`Templates de Mensagens para ${C.segmento}`,`${total} templates prontos de mensagens para chatbot de ${C.segmento.toLowerCase()}: qualificação, agendamento, follow-up e mais.`,`templates/${slug}`)}
<script type="application/ld+json">[{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[${bcSchema(bc)}]}]</script>
<style>${css}</style></head><body>${hdr}<main><div class="container">
<nav class="breadcrumb" aria-label="Breadcrumb">${bcHtml(bc)}</nav>
<section class="hero"><span class="tag"><i class="fas fa-message"></i> Templates</span>
<h1>Templates de Mensagens para <span>${C.segmento}</span></h1>
<p class="subtitle">${total} mensagens prontas para configurar no chatbot. Copie, personalize e use.</p></section>
${body}
${clusterNav}
${ctaBox}
</div></main>${ftr}
${copyScript}
</body></html>`;
}

// ========== 2. FLUXOS ==========
function genFluxos() {
  const bc = [{n:'Início',u:'/'},{n:'Fluxos'},{n:C.segmento}];
  let body = '';
  C.fluxosDiagramas.forEach(f => {
    body += `<h2><i class="fas ${f.icone}"></i> ${f.titulo}</h2>\n<div class="flow-diagram">\n`;
    f.steps.forEach((s,i) => {
      if (s.box === 'decision') {
        body += `<div class="flow-arrow-d">↓</div>\n<div class="flow-row"><div class="flow-box decision">${s.texto}</div></div>\n`;
        const yes = f.steps[i+1];
        const no = f.steps[i+2];
        if (yes && no) {
          body += `<div class="flow-branch"><div><div class="flow-arrow-d"><span class="flow-label">✅ Sim</span> ↓</div><div class="flow-box ${yes.box}">${yes.texto}</div></div><div><div class="flow-arrow-d"><span class="flow-label">❌ Não</span> ↓</div><div class="flow-box ${no.box}">${no.texto}</div></div></div>\n`;
        }
      } else if (i > 0 && f.steps[i-1]?.box === 'decision') {
        // skip, handled above
      } else if (i > 1 && f.steps[i-2]?.box === 'decision') {
        // skip
      } else {
        if (i > 0) body += `<div class="flow-arrow-d">↓</div>\n`;
        body += `<div class="flow-row"><div class="flow-box ${s.box}">${s.texto}</div></div>\n`;
      }
    });
    body += `</div>\n`;
  });
  return `${head(`Fluxos de Atendimento para ${C.segmento}`,`Diagramas visuais de fluxos de conversa para chatbot de ${C.segmento.toLowerCase()}.`,`fluxos/${slug}`)}
<script type="application/ld+json">[{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[${bcSchema(bc)}]}]</script>
<style>${css}</style></head><body>${hdr}<main><div class="container">
<nav class="breadcrumb" aria-label="Breadcrumb">${bcHtml(bc)}</nav>
<section class="hero"><span class="tag"><i class="fas fa-diagram-project"></i> Fluxos</span>
<h1>Fluxos de Atendimento para <span>${C.segmento}</span></h1>
<p class="subtitle">Diagramas visuais dos principais fluxos de conversa para ${C.segmento.toLowerCase()}.</p></section>
${body}
${clusterNav}
${ctaBox}
</div></main>${ftr}</body></html>`;
}

// ========== 3. CHECKLIST ==========
function genChecklist() {
  const bc = [{n:'Início',u:'/'},{n:'Checklists'},{n:C.segmento}];
  const stepsSchema = C.checklistEtapas.map(e => `{"@type":"HowToStep","name":"${e.titulo}","text":"${e.itens[0]}"}`).join(',');
  let body = '';
  C.checklistEtapas.forEach((e,i) => {
    body += `<div class="step"><div class="step-num">${i+1}</div><div class="step-content"><strong>${e.titulo}</strong></div></div>\n`;
    body += `<div class="card">${e.itens.map(it => `<div class="check-item"><i class="fas fa-square"></i><span>${it}</span></div>`).join('\n')}</div>\n`;
  });
  return `${head(`Checklist de Implantação para ${C.segmento}`,`Guia passo a passo para implantar chatbot com IA em ${C.segmento.toLowerCase()}: ${C.checklistEtapas.length} etapas.`,`checklists/${slug}`)}
<script type="application/ld+json">[{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[${bcSchema(bc)}]},{"@context":"https://schema.org","@type":"HowTo","name":"Como implantar chatbot em ${C.segmento.toLowerCase()}","step":[${stepsSchema}]}]</script>
<style>${css}</style></head><body>${hdr}<main><div class="container">
<nav class="breadcrumb" aria-label="Breadcrumb">${bcHtml(bc)}</nav>
<section class="hero"><span class="tag"><i class="fas fa-list-check"></i> Checklist</span>
<h1>Checklist de Implantação para <span>${C.segmento}</span></h1>
<p class="subtitle">${C.checklistEtapas.length} etapas para implantar chatbot com IA em ${C.segmento.toLowerCase()}.</p></section>
${body}
${clusterNav}
${ctaBox}
</div></main>${ftr}</body></html>`;
}

// ========== 4. PROMPTS ==========
function genPrompts() {
  const bc = [{n:'Início',u:'/'},{n:'Prompts'},{n:C.segmento}];
  const total = C.promptsCategories.reduce((a,c) => a + c.items.length, 0);
  const tags = C.promptsCategories.map(c => `<span class="tag-item">${c.cat}</span>`).join('');
  let body = '';
  C.promptsCategories.forEach(c => {
    body += `<h2><i class="fas ${c.icone}"></i> ${c.cat}</h2>\n`;
    c.items.forEach((p,i) => {
      body += `<div class="card"><div class="card-title"><span>${c.cat} #${i+1}</span><button class="copy-btn" onclick="copyMsg(this)">Copiar</button></div><div class="msg-box">${p}</div></div>\n`;
    });
  });
  return `${head(`Biblioteca de Prompts para ${C.segmento}`,`${total} prompts organizados por categoria para chatbot de ${C.segmento.toLowerCase()}.`,`prompts/${slug}`)}
<script type="application/ld+json">[{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[${bcSchema(bc)}]}]</script>
<style>${css}</style></head><body>${hdr}<main><div class="container">
<nav class="breadcrumb" aria-label="Breadcrumb">${bcHtml(bc)}</nav>
<section class="hero"><span class="tag"><i class="fas fa-brain"></i> Biblioteca de Prompts</span>
<h1>Prompts para Chatbot de <span>${C.segmento}</span></h1>
<p class="subtitle">${total} prompts organizados por categoria.</p></section>
<div class="tag-list">${tags}</div>
${body}
${clusterNav}
${ctaBox}
</div></main>${ftr}
${copyScript}
</body></html>`;
}

// ========== 5. EXEMPLOS ==========
function genExemplos() {
  const bc = [{n:'Início',u:'/'},{n:'Exemplos'},{n:C.segmento}];
  let body = '<div class="example-note"><i class="fas fa-info-circle"></i> Os exemplos abaixo são simulações para demonstração. Nomes e dados são fictícios.</div>\n';
  C.exemplosConversas.forEach(ex => {
    body += `<h2><i class="fas ${ex.icone}"></i> ${ex.titulo}</h2>\n<div class="chat">\n`;
    ex.mensagens.forEach(m => {
      const isBot = m.tipo === 'bot';
      body += `<div class="chat-msg${isBot?' bot':''}"><div class="chat-avatar ${m.tipo}">${isBot?'🤖':'👤'}</div><div><div class="chat-label ${m.tipo}">${isBot?'Assistente':'Cliente'}</div><div class="chat-bubble">${m.texto}</div></div></div>\n`;
    });
    body += `</div>\n`;
  });
  return `${head(`Exemplos de Conversa — Chatbot para ${C.segmento}`,`Exemplos simulados de conversas entre cliente e chatbot de IA para ${C.segmento.toLowerCase()}.`,`exemplos/${slug}`)}
<script type="application/ld+json">[{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[${bcSchema(bc)}]}]</script>
<style>${css}</style></head><body>${hdr}<main><div class="container">
<nav class="breadcrumb" aria-label="Breadcrumb">${bcHtml(bc)}</nav>
<section class="hero"><span class="tag"><i class="fas fa-comments"></i> Exemplos</span>
<h1>Exemplos de Conversa para <span>${C.segmento}</span></h1>
<p class="subtitle">Veja como um chatbot de IA interage com clientes de ${C.segmento.toLowerCase()}.</p></section>
${body}
${clusterNav}
${ctaBox}
</div></main>${ftr}</body></html>`;
}

// ========== GENERATE + MANIFEST ==========
const files = [
  { path: `public/templates/${slug}.html`, fn: genTemplates },
  { path: `public/fluxos/${slug}.html`, fn: genFluxos },
  { path: `public/checklists/${slug}.html`, fn: genChecklist },
  { path: `public/prompts/${slug}.html`, fn: genPrompts },
  { path: `public/exemplos/${slug}.html`, fn: genExemplos }
];

files.forEach(f => {
  fs.writeFileSync(path.join(__dirname, f.path), f.fn(), 'utf8');
  console.log(`✅ ${f.path}`);
});

// Generate manifest
const manifest = {
  segment: slug,
  segmento: C.segmento,
  version: '1.0',
  generatedAt: new Date().toISOString(),
  pages: [
    `/${slug}`,
    `/templates/${slug}`,
    `/fluxos/${slug}`,
    `/checklists/${slug}`,
    `/prompts/${slug}`,
    `/exemplos/${slug}`
  ],
  glossary: C.glossario,
  definitionOfDone: { total: 29, passed: 'pending-audit' }
};

const manifestDir = path.join(__dirname, 'cluster-config');
fs.writeFileSync(path.join(manifestDir, `${slug}.manifest.json`), JSON.stringify(manifest, null, 2), 'utf8');
console.log(`✅ cluster-config/${slug}.manifest.json`);

console.log(`\n🎯 Cluster ${C.segmento}: ${files.length} ativos + manifest gerados`);
