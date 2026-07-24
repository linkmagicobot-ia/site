const fs = require('fs');
const path = require('path');

// Ensure directories
['templates','fluxos','checklists','prompts','exemplos','integracoes'].forEach(d => {
  const dir = path.join(__dirname, 'public', d);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const BASE = 'https://site.linkmagico.app.br';

// ========== SHARED STYLES ==========
const sharedHead = (title, desc, slug, canonical) => `<!DOCTYPE html>
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

const breadcrumb = (items) => {
  const schema = items.map((it,i) => `{"@type":"ListItem","position":${i+1},"name":"${it.name}"${it.url?`,"item":"${BASE}${it.url}"`:''}}` ).join(',');
  const html = items.map((it,i) => i < items.length-1 ? `<a href="${it.url||'/'}">${it.name}</a> ›` : `<strong>${it.name}</strong>`).join(' ');
  return { schema: `{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[${schema}]}`, html: `<nav class="breadcrumb" aria-label="Breadcrumb">${html}</nav>` };
};

const sharedCSS = `*{margin:0;padding:0;box-sizing:border-box}:root{--bg:#06060e;--surface:#0e0e1a;--surface2:#151525;--border:#1e1e35;--purple:#7c3aed;--purple-l:#a78bfa;--green:#10b981;--green-l:#34d399;--text:#f0eeff;--muted:#7a7896;--accent:#06b6d4}body{font-family:'Inter',system-ui,sans-serif;color:var(--text);background:var(--bg);line-height:1.7}a{color:var(--purple-l);text-decoration:none}a:hover{text-decoration:underline}.container{max-width:800px;margin:0 auto;padding:0 24px}
header{position:fixed;top:0;left:0;right:0;z-index:100;padding:14px 0;background:rgba(6,6,14,.92);backdrop-filter:blur(16px);border-bottom:1px solid var(--border)}.nav{display:flex;align-items:center;justify-content:space-between;max-width:1140px;margin:0 auto;padding:0 24px}.nav__logo{font-size:1.25rem;font-weight:800;font-family:'Space Grotesk',sans-serif}.logo-hl{background:linear-gradient(135deg,var(--purple),var(--green));-webkit-background-clip:text;-webkit-text-fill-color:transparent}.nav__links{display:flex;gap:20px;align-items:center}.nav__links a{color:var(--muted);font-size:.9rem}.nav__links a:hover{color:var(--text);text-decoration:none}.btn-cta{background:linear-gradient(135deg,var(--purple),#5b21b6);color:#fff!important;padding:8px 20px;border-radius:8px;font-weight:600;font-size:.85rem}
.breadcrumb{padding:90px 0 0;font-size:.83rem;color:var(--muted)}.breadcrumb a{color:var(--muted)}
.hero{padding:24px 0 32px;text-align:center}.hero .tag{display:inline-flex;align-items:center;gap:8px;background:rgba(6,182,212,.15);border:1px solid rgba(6,182,212,.3);color:var(--accent);padding:6px 16px;border-radius:20px;font-size:.8rem;font-weight:600;margin-bottom:12px}
h1{font-family:'Space Grotesk',sans-serif;font-size:clamp(1.4rem,3.5vw,2rem);font-weight:800;margin-bottom:8px;line-height:1.3}h1 span{color:var(--accent)}
.subtitle{color:var(--muted);font-size:.95rem;max-width:560px;margin:0 auto}
h2{font-family:'Space Grotesk',sans-serif;font-size:1.15rem;font-weight:700;margin:32px 0 16px;display:flex;align-items:center;gap:8px}h2 i{color:var(--accent);font-size:1rem}
h3{font-size:.95rem;font-weight:700;margin:20px 0 8px}
.card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:18px;margin-bottom:12px;transition:border-color .3s}.card:hover{border-color:var(--accent)}
.card-title{font-weight:700;font-size:.9rem;margin-bottom:4px;display:flex;align-items:center;gap:8px}.card-title i{color:var(--accent)}
.card p,.card-body{font-size:.85rem;color:var(--muted)}
.msg-box{background:var(--surface);border-left:3px solid var(--accent);border-radius:0 10px 10px 0;padding:14px 18px;margin:10px 0;font-size:.86rem;color:var(--muted);font-style:italic}
.copy-btn{background:rgba(124,58,237,.15);border:1px solid rgba(124,58,237,.3);color:var(--purple-l);padding:4px 12px;border-radius:6px;font-size:.75rem;cursor:pointer;font-family:'Inter',sans-serif;margin-left:8px}.copy-btn:hover{background:rgba(124,58,237,.3)}
.step{display:flex;gap:14px;margin-bottom:16px}.step-num{width:32px;height:32px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.85rem;flex-shrink:0}.step-content{flex:1}.step-content strong{display:block;font-size:.9rem;margin-bottom:2px}.step-content p{font-size:.84rem;color:var(--muted)}
.check-item{display:flex;align-items:flex-start;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)}.check-item:last-child{border-bottom:none}.check-item i{color:var(--green-l);margin-top:3px;flex-shrink:0}.check-item span{font-size:.88rem}
.tag-list{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.tag-item{background:rgba(6,182,212,.1);border:1px solid rgba(6,182,212,.2);color:var(--accent);padding:5px 14px;border-radius:16px;font-size:.8rem;font-weight:600}
.related{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:20px;margin-top:32px}.related h3{font-size:.9rem;margin-bottom:10px}.related a{display:block;font-size:.84rem;padding:5px 0;color:var(--purple-l);border-bottom:1px solid var(--border)}.related a:last-child{border-bottom:none}.related a:hover{color:var(--green-l);text-decoration:none}.related a i{margin-right:6px;font-size:.7rem}
.cta-box{background:linear-gradient(135deg,rgba(124,58,237,.1),rgba(6,182,212,.1));border:1px solid rgba(124,58,237,.2);border-radius:14px;padding:28px;text-align:center;margin-top:32px}.cta-box h3{font-family:'Space Grotesk',sans-serif;font-size:1.1rem;margin-bottom:6px}.cta-box p{color:var(--muted);font-size:.88rem;margin-bottom:14px}.cta-box .btn-cta{display:inline-block;padding:10px 28px;font-size:.95rem;border-radius:10px;text-decoration:none}
footer{margin-top:60px;padding:40px 0;border-top:1px solid var(--border);text-align:center;color:var(--muted);font-size:.85rem}
@media(max-width:480px){.container{padding:0 16px}.nav__links a:not(.btn-cta){display:none}}`;

const header = `<header><nav class="nav"><a href="/" class="nav__logo">⚡ <span class="logo-hl">LinkMágico</span></a><div class="nav__links"><a href="/">Home</a><a href="/blog/">Blog</a><a href="/glossario">Glossário</a><a href="https://linkmagico.app.br/pricing.html" class="btn-cta">Ver Planos</a></div></nav></header>`;

const footerHtml = `<footer><div class="container"><p>© 2025 LinkMágico — Todos os direitos reservados.</p><p style="margin-top:8px"><a href="/">Início</a> · <a href="/clinicas">Clínicas</a> · <a href="/glossario">Glossário</a> · <a href="/docs">Docs</a> · <a href="/politica-de-privacidade">Privacidade</a></p></div></footer>`;

const relatedClinicas = `<div class="related"><h3>📋 Cluster Clínicas — Navegação</h3>
<a href="/clinicas"><i class="fas fa-hospital"></i> Landing Page — Chatbot para Clínicas</a>
<a href="/blog/chatbot-para-clinicas-e-consultorios"><i class="fas fa-newspaper"></i> Artigo — Chatbot para Clínicas e Consultórios</a>
<a href="/templates/clinicas"><i class="fas fa-message"></i> Templates de Mensagens</a>
<a href="/fluxos/clinicas"><i class="fas fa-diagram-project"></i> Fluxos de Atendimento</a>
<a href="/checklists/clinicas"><i class="fas fa-list-check"></i> Checklist de Implantação</a>
<a href="/prompts/clinicas"><i class="fas fa-brain"></i> Biblioteca de Prompts</a>
<a href="/exemplos/clinicas"><i class="fas fa-comments"></i> Exemplos de Conversa</a>
<a href="/ferramentas/calculadora-roi"><i class="fas fa-calculator"></i> Calculadora de ROI</a>
<a href="/glossario/chatbot"><i class="fas fa-book-open"></i> Glossário — Chatbot</a>
</div>`;

const ctaBox = `<div class="cta-box"><h3>Teste o LinkMágico para sua clínica</h3><p>Crie seu assistente virtual em menos de 2 minutos. Plano gratuito disponível.</p><a href="https://linkmagico.app.br/signup.html" class="btn-cta">Criar Conta Grátis →</a></div>`;

// ========== 1. TEMPLATES ==========
const templates = `${sharedHead('Templates de Mensagens para Clínicas','20 templates prontos de mensagens para chatbot de clínicas: agendamento, confirmação, lembrete, pós-consulta e mais.','templates-clinicas','templates/clinicas')}
<script type="application/ld+json">[${breadcrumb([{name:'Início',url:'/'},{name:'Templates',url:'/templates/clinicas'},{name:'Clínicas'}]).schema}]</script>
<style>${sharedCSS}</style></head><body>${header}<main><div class="container">
${breadcrumb([{name:'Início',url:'/'},{name:'Templates',url:'/templates/clinicas'},{name:'Clínicas'}]).html}
<section class="hero"><span class="tag"><i class="fas fa-message"></i> Templates</span>
<h1>Templates de Mensagens para <span>Clínicas</span></h1>
<p class="subtitle">20 mensagens prontas para configurar no chatbot da sua clínica. Copie, personalize e use.</p></section>

<h2><i class="fas fa-calendar-check"></i> Agendamento</h2>
<div class="card"><div class="card-title"><i class="fas fa-calendar-plus"></i> Boas-vindas + Agendamento <button class="copy-btn" onclick="copyMsg(this)">Copiar</button></div><div class="msg-box">Olá! 😊 Bem-vindo(a) à [Nome da Clínica]. Sou o assistente virtual e posso te ajudar a agendar sua consulta agora mesmo. Qual especialidade você precisa?</div></div>
<div class="card"><div class="card-title"><i class="fas fa-clock"></i> Horários disponíveis <button class="copy-btn" onclick="copyMsg(this)">Copiar</button></div><div class="msg-box">Temos os seguintes horários disponíveis para [especialidade]:\n\n📅 Segunda: 09h, 10h, 14h\n📅 Terça: 08h, 11h, 15h\n📅 Quarta: 09h, 13h, 16h\n\nQual horário funciona melhor para você?</div></div>
<div class="card"><div class="card-title"><i class="fas fa-check-circle"></i> Confirmação de agendamento <button class="copy-btn" onclick="copyMsg(this)">Copiar</button></div><div class="msg-box">✅ Consulta agendada com sucesso!\n\n🏥 [Nome da Clínica]\n👨‍⚕️ Dr(a). [Nome]\n📅 [Data] às [Horário]\n📍 [Endereço]\n\nVocê receberá um lembrete 24h antes. Precisa de mais alguma coisa?</div></div>

<h2><i class="fas fa-bell"></i> Confirmação e Lembretes</h2>
<div class="card"><div class="card-title"><i class="fas fa-bell"></i> Lembrete 24h antes <button class="copy-btn" onclick="copyMsg(this)">Copiar</button></div><div class="msg-box">Olá, [Nome]! 😊 Lembrando da sua consulta amanhã:\n\n👨‍⚕️ Dr(a). [Nome]\n📅 [Data] às [Horário]\n📍 [Endereço]\n\nVocê confirma? Responda:\n✅ Sim, estarei lá\n🔄 Preciso reagendar</div></div>
<div class="card"><div class="card-title"><i class="fas fa-clock"></i> Lembrete 2h antes <button class="copy-btn" onclick="copyMsg(this)">Copiar</button></div><div class="msg-box">Olá, [Nome]! Sua consulta com Dr(a). [Nome] é daqui a 2 horas, às [Horário]. Nos vemos em breve! 😊</div></div>
<div class="card"><div class="card-title"><i class="fas fa-rotate"></i> Reagendamento <button class="copy-btn" onclick="copyMsg(this)">Copiar</button></div><div class="msg-box">Sem problemas, [Nome]! Vamos reagendar. Estes são os próximos horários disponíveis para [especialidade]:\n\n📅 [Opção 1]\n📅 [Opção 2]\n📅 [Opção 3]\n\nQual prefere?</div></div>

<h2><i class="fas fa-clipboard-question"></i> Pré-atendimento</h2>
<div class="card"><div class="card-title"><i class="fas fa-notes-medical"></i> Pré-triagem <button class="copy-btn" onclick="copyMsg(this)">Copiar</button></div><div class="msg-box">Para agilizar seu atendimento, preciso de algumas informações:\n\n1️⃣ Qual o motivo da consulta?\n2️⃣ Tem alguma alergia a medicamentos?\n3️⃣ Está tomando algum medicamento atualmente?\n\nSuas respostas são confidenciais e serão compartilhadas apenas com o médico.</div></div>
<div class="card"><div class="card-title"><i class="fas fa-id-card"></i> Convênio <button class="copy-btn" onclick="copyMsg(this)">Copiar</button></div><div class="msg-box">Aceitamos os seguintes convênios:\n\n✅ Unimed\n✅ Bradesco Saúde\n✅ SulAmérica\n✅ Amil\n\nTambém atendemos particular. Qual o seu caso?</div></div>
<div class="card"><div class="card-title"><i class="fas fa-file-medical"></i> Preparo para exame <button class="copy-btn" onclick="copyMsg(this)">Copiar</button></div><div class="msg-box">Para o exame de [tipo], é necessário:\n\n⏱️ Jejum de [X] horas\n💧 Beber [X] copos de água\n📋 Trazer pedido médico\n📄 Trazer documento com foto\n\nAlguma dúvida sobre o preparo?</div></div>

<h2><i class="fas fa-heart-pulse"></i> Pós-consulta</h2>
<div class="card"><div class="card-title"><i class="fas fa-star"></i> Pós-consulta + Avaliação <button class="copy-btn" onclick="copyMsg(this)">Copiar</button></div><div class="msg-box">Olá, [Nome]! 😊 Esperamos que sua consulta com Dr(a). [Nome] tenha sido boa. Como foi sua experiência?\n\n⭐⭐⭐⭐⭐ Excelente\n⭐⭐⭐⭐ Boa\n⭐⭐⭐ Regular\n\nSua avaliação nos ajuda a melhorar!</div></div>
<div class="card"><div class="card-title"><i class="fas fa-calendar-day"></i> Retorno <button class="copy-btn" onclick="copyMsg(this)">Copiar</button></div><div class="msg-box">Olá, [Nome]! Dr(a). [Nome] indicou retorno em [X] dias. Gostaria de já agendar?\n\nPosso verificar os horários disponíveis para você agora mesmo. 😊</div></div>
<div class="card"><div class="card-title"><i class="fas fa-prescription"></i> Lembrete de medicação <button class="copy-btn" onclick="copyMsg(this)">Copiar</button></div><div class="msg-box">Olá, [Nome]! Lembrando que a medicação prescrita pelo Dr(a). [Nome] deve ser tomada por [X] dias. Se tiver dúvidas ou efeitos colaterais, entre em contato conosco. 💊</div></div>

<h2><i class="fas fa-info-circle"></i> Informações Gerais</h2>
<div class="card"><div class="card-title"><i class="fas fa-map-marker-alt"></i> Localização e horários <button class="copy-btn" onclick="copyMsg(this)">Copiar</button></div><div class="msg-box">📍 [Endereço completo]\n\n🕐 Horário de funcionamento:\nSeg a Sex: 08h às 18h\nSáb: 08h às 12h\n\n🅿️ Estacionamento gratuito\n♿ Acesso para cadeirantes\n\nComo posso te ajudar?</div></div>
<div class="card"><div class="card-title"><i class="fas fa-money-bill"></i> Valores <button class="copy-btn" onclick="copyMsg(this)">Copiar</button></div><div class="msg-box">Nossos valores para consulta particular:\n\n👨‍⚕️ Clínica Geral: R$ [valor]\n🦷 Odontologia: R$ [valor]\n👁️ Oftalmologia: R$ [valor]\n\nAceitamos cartão de crédito e PIX. Gostaria de agendar?</div></div>
<div class="card"><div class="card-title"><i class="fas fa-user-xmark"></i> Cancelamento <button class="copy-btn" onclick="copyMsg(this)">Copiar</button></div><div class="msg-box">Entendemos, [Nome]. Sua consulta foi cancelada.\n\nSe quiser reagendar no futuro, é só me enviar uma mensagem. Estaremos aqui! 😊</div></div>
<div class="card"><div class="card-title"><i class="fas fa-clock-rotate-left"></i> Fora do horário <button class="copy-btn" onclick="copyMsg(this)">Copiar</button></div><div class="msg-box">Obrigado por entrar em contato! 😊 Nosso horário de atendimento é de segunda a sexta, das 08h às 18h.\n\nMas posso te ajudar a agendar uma consulta agora mesmo! Qual especialidade você precisa?</div></div>
<div class="card"><div class="card-title"><i class="fas fa-shield-halved"></i> LGPD <button class="copy-btn" onclick="copyMsg(this)">Copiar</button></div><div class="msg-box">Seus dados são tratados com total segurança, conforme a LGPD. Utilizamos suas informações apenas para agendamento e comunicação sobre consultas. Para saber mais, acesse nossa Política de Privacidade.</div></div>

${relatedClinicas}
${ctaBox}
</div></main>${footerHtml}
<script>function copyMsg(btn){const msg=btn.closest('.card').querySelector('.msg-box').textContent;navigator.clipboard.writeText(msg);btn.textContent='✅ Copiado!';setTimeout(()=>btn.textContent='Copiar',2000)}</script>
</body></html>`;

// ========== 2. FLUXOS ==========
const fluxos = `${sharedHead('Fluxos de Atendimento para Clínicas','Diagramas visuais de fluxos de conversa para chatbot de clínicas: agendamento, confirmação, triagem e pós-consulta.','fluxos-clinicas','fluxos/clinicas')}
<script type="application/ld+json">[${breadcrumb([{name:'Início',url:'/'},{name:'Fluxos',url:'/fluxos/clinicas'},{name:'Clínicas'}]).schema}]</script>
<style>${sharedCSS}
.flow-diagram{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:24px;margin:16px 0}
.flow-row{display:flex;align-items:center;gap:12px;margin:8px 0;flex-wrap:wrap}
.flow-box{background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:10px 16px;font-size:.84rem;text-align:center;min-width:140px}
.flow-box.start{border-color:var(--accent);color:var(--accent);font-weight:700}
.flow-box.action{border-color:var(--green);color:var(--green-l)}
.flow-box.decision{border-color:var(--purple);color:var(--purple-l);border-radius:0;transform:rotate(0deg)}
.flow-box.end{border-color:var(--green);background:rgba(16,185,129,.1);color:var(--green-l);font-weight:700}
.flow-arrow-d{text-align:center;color:var(--muted);font-size:.75rem;padding:4px 0}
.flow-branch{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:8px 0}
.flow-label{font-size:.72rem;color:var(--muted);text-align:center;padding:2px 8px;background:var(--surface2);border-radius:4px;display:inline-block}
</style></head><body>${header}<main><div class="container">
${breadcrumb([{name:'Início',url:'/'},{name:'Fluxos',url:'/fluxos/clinicas'},{name:'Clínicas'}]).html}
<section class="hero"><span class="tag"><i class="fas fa-diagram-project"></i> Fluxos</span>
<h1>Fluxos de Atendimento para <span>Clínicas</span></h1>
<p class="subtitle">Diagramas visuais dos principais fluxos de conversa para automatizar o atendimento da sua clínica.</p></section>

<h2><i class="fas fa-calendar-plus"></i> Fluxo 1 — Agendamento de Consulta</h2>
<div class="flow-diagram">
<div class="flow-row" style="justify-content:center"><div class="flow-box start">📱 Paciente envia mensagem</div></div>
<div class="flow-arrow-d">↓</div>
<div class="flow-row" style="justify-content:center"><div class="flow-box action">🤖 IA identifica intenção: AGENDAR</div></div>
<div class="flow-arrow-d">↓</div>
<div class="flow-row" style="justify-content:center"><div class="flow-box action">❓ Pergunta especialidade</div></div>
<div class="flow-arrow-d">↓</div>
<div class="flow-row" style="justify-content:center"><div class="flow-box action">📋 Verifica disponibilidade</div></div>
<div class="flow-arrow-d">↓</div>
<div class="flow-row" style="justify-content:center"><div class="flow-box action">📅 Apresenta horários</div></div>
<div class="flow-arrow-d">↓</div>
<div class="flow-row" style="justify-content:center"><div class="flow-box decision">Paciente confirma?</div></div>
<div class="flow-branch">
<div><div class="flow-arrow-d"><span class="flow-label">✅ Sim</span> ↓</div><div class="flow-box end">✅ Agenda + Envia confirmação + Registra no CRM</div></div>
<div><div class="flow-arrow-d"><span class="flow-label">❌ Não</span> ↓</div><div class="flow-box action">🔄 Oferece outros horários</div></div>
</div></div>

<h2><i class="fas fa-bell"></i> Fluxo 2 — Confirmação de Consulta (24h antes)</h2>
<div class="flow-diagram">
<div class="flow-row" style="justify-content:center"><div class="flow-box start">⏰ Gatilho: 24h antes da consulta</div></div>
<div class="flow-arrow-d">↓</div>
<div class="flow-row" style="justify-content:center"><div class="flow-box action">📩 Envia lembrete pelo WhatsApp</div></div>
<div class="flow-arrow-d">↓</div>
<div class="flow-row" style="justify-content:center"><div class="flow-box decision">Paciente responde?</div></div>
<div class="flow-branch">
<div><div class="flow-arrow-d"><span class="flow-label">✅ Confirma</span> ↓</div><div class="flow-box end">✅ Marca como confirmado no CRM</div></div>
<div><div class="flow-arrow-d"><span class="flow-label">🔄 Reagenda</span> ↓</div><div class="flow-box action">📅 Oferece novos horários + Libera vaga</div></div>
</div>
<div class="flow-arrow-d">↓ (sem resposta em 4h)</div>
<div class="flow-row" style="justify-content:center"><div class="flow-box action">📩 Envia segundo lembrete</div></div>
</div>

<h2><i class="fas fa-notes-medical"></i> Fluxo 3 — Pré-triagem</h2>
<div class="flow-diagram">
<div class="flow-row" style="justify-content:center"><div class="flow-box start">📱 Paciente confirma consulta</div></div>
<div class="flow-arrow-d">↓</div>
<div class="flow-row" style="justify-content:center"><div class="flow-box action">❓ Qual o motivo da consulta?</div></div>
<div class="flow-arrow-d">↓</div>
<div class="flow-row" style="justify-content:center"><div class="flow-box action">💊 Alergias a medicamentos?</div></div>
<div class="flow-arrow-d">↓</div>
<div class="flow-row" style="justify-content:center"><div class="flow-box action">💊 Medicamentos em uso?</div></div>
<div class="flow-arrow-d">↓</div>
<div class="flow-row" style="justify-content:center"><div class="flow-box end">📋 Salva no prontuário + Envia ao médico</div></div>
</div>

<h2><i class="fas fa-heart-pulse"></i> Fluxo 4 — Pós-consulta e Retorno</h2>
<div class="flow-diagram">
<div class="flow-row" style="justify-content:center"><div class="flow-box start">⏰ Gatilho: 2h após consulta</div></div>
<div class="flow-arrow-d">↓</div>
<div class="flow-row" style="justify-content:center"><div class="flow-box action">📩 Envia pesquisa de satisfação</div></div>
<div class="flow-arrow-d">↓</div>
<div class="flow-row" style="justify-content:center"><div class="flow-box decision">Retorno necessário?</div></div>
<div class="flow-branch">
<div><div class="flow-arrow-d"><span class="flow-label">✅ Sim</span> ↓</div><div class="flow-box action">📅 Agenda retorno (30/60/90 dias)</div></div>
<div><div class="flow-arrow-d"><span class="flow-label">❌ Não</span> ↓</div><div class="flow-box end">👋 Encerra + Mantém no CRM</div></div>
</div></div>

${relatedClinicas}
${ctaBox}
</div></main>${footerHtml}</body></html>`;

// ========== 3. CHECKLIST ==========
const checklist = `${sharedHead('Checklist de Implantação de Chatbot para Clínicas','Guia passo a passo para implantar um chatbot com IA na sua clínica: 7 etapas da configuração ao monitoramento.','checklist-clinicas','checklists/clinicas')}
<script type="application/ld+json">[${breadcrumb([{name:'Início',url:'/'},{name:'Checklists',url:'/checklists/clinicas'},{name:'Clínicas'}]).schema},{"@context":"https://schema.org","@type":"HowTo","name":"Como implantar um chatbot em clínicas","step":[{"@type":"HowToStep","name":"Definir objetivos","text":"Definir o que o chatbot deve resolver: agendamento, confirmação, FAQ."},{"@type":"HowToStep","name":"Configuração inicial","text":"Criar conta, treinar IA com conteúdo da clínica."},{"@type":"HowToStep","name":"Definir fluxos","text":"Mapear fluxos de agendamento, confirmação e pós-consulta."},{"@type":"HowToStep","name":"Integrações","text":"Conectar WhatsApp, agenda e site."},{"@type":"HowToStep","name":"Testes","text":"Testar todos os fluxos antes de publicar."},{"@type":"HowToStep","name":"Publicação","text":"Ativar chatbot no site e WhatsApp."},{"@type":"HowToStep","name":"Monitoramento","text":"Acompanhar métricas e ajustar."}]}]</script>
<style>${sharedCSS}</style></head><body>${header}<main><div class="container">
${breadcrumb([{name:'Início',url:'/'},{name:'Checklists',url:'/checklists/clinicas'},{name:'Clínicas'}]).html}
<section class="hero"><span class="tag"><i class="fas fa-list-check"></i> Checklist</span>
<h1>Checklist de Implantação para <span>Clínicas</span></h1>
<p class="subtitle">7 etapas para implantar um chatbot com IA na sua clínica — do planejamento ao monitoramento.</p></section>

<div class="step"><div class="step-num">1</div><div class="step-content"><strong>Definir Objetivos</strong><p>O que o chatbot deve resolver na sua clínica?</p></div></div>
<div class="card"><div class="check-item"><i class="fas fa-square"></i><span>Agendamento automático de consultas</span></div><div class="check-item"><i class="fas fa-square"></i><span>Confirmação e lembretes de consultas</span></div><div class="check-item"><i class="fas fa-square"></i><span>Respostas sobre convênios aceitos</span></div><div class="check-item"><i class="fas fa-square"></i><span>Informações sobre valores e horários</span></div><div class="check-item"><i class="fas fa-square"></i><span>Pré-triagem de pacientes</span></div><div class="check-item"><i class="fas fa-square"></i><span>Pós-consulta e agendamento de retorno</span></div></div>

<div class="step"><div class="step-num">2</div><div class="step-content"><strong>Configuração Inicial</strong><p>Preparar a base do chatbot.</p></div></div>
<div class="card"><div class="check-item"><i class="fas fa-square"></i><span>Criar conta no LinkMágico</span></div><div class="check-item"><i class="fas fa-square"></i><span>Treinar a IA com a URL do site da clínica</span></div><div class="check-item"><i class="fas fa-square"></i><span>Adicionar informações de especialidades</span></div><div class="check-item"><i class="fas fa-square"></i><span>Configurar horários de funcionamento</span></div><div class="check-item"><i class="fas fa-square"></i><span>Adicionar lista de convênios aceitos</span></div><div class="check-item"><i class="fas fa-square"></i><span>Configurar tabela de preços (se aplicável)</span></div></div>

<div class="step"><div class="step-num">3</div><div class="step-content"><strong>Definir Fluxos</strong><p>Mapear os caminhos de conversa.</p></div></div>
<div class="card"><div class="check-item"><i class="fas fa-square"></i><span>Fluxo de agendamento (especialidade → horário → confirmação)</span></div><div class="check-item"><i class="fas fa-square"></i><span>Fluxo de confirmação (24h antes → resposta → ação)</span></div><div class="check-item"><i class="fas fa-square"></i><span>Fluxo de reagendamento (cancelamento → novos horários)</span></div><div class="check-item"><i class="fas fa-square"></i><span>Fluxo de pré-triagem (sintomas → alergias → medicamentos)</span></div><div class="check-item"><i class="fas fa-square"></i><span>Fluxo de pós-consulta (avaliação → retorno)</span></div><div class="check-item"><i class="fas fa-square"></i><span>Fluxo fora do horário (mensagem + agendamento)</span></div></div>

<div class="step"><div class="step-num">4</div><div class="step-content"><strong>Integrações</strong><p>Conectar com os sistemas da clínica.</p></div></div>
<div class="card"><div class="check-item"><i class="fas fa-square"></i><span>Conectar WhatsApp (Twilio ou Evolution API)</span></div><div class="check-item"><i class="fas fa-square"></i><span>Instalar widget no site da clínica</span></div><div class="check-item"><i class="fas fa-square"></i><span>Conectar Google Calendar (se usar)</span></div><div class="check-item"><i class="fas fa-square"></i><span>Configurar webhooks para sistema de gestão (se aplicável)</span></div></div>

<div class="step"><div class="step-num">5</div><div class="step-content"><strong>Testes</strong><p>Validar antes de publicar.</p></div></div>
<div class="card"><div class="check-item"><i class="fas fa-square"></i><span>Testar agendamento completo (início ao fim)</span></div><div class="check-item"><i class="fas fa-square"></i><span>Testar confirmação de consulta</span></div><div class="check-item"><i class="fas fa-square"></i><span>Testar reagendamento e cancelamento</span></div><div class="check-item"><i class="fas fa-square"></i><span>Testar perguntas sobre convênios e valores</span></div><div class="check-item"><i class="fas fa-square"></i><span>Testar comportamento fora do horário</span></div><div class="check-item"><i class="fas fa-square"></i><span>Testar no celular (WhatsApp + site)</span></div></div>

<div class="step"><div class="step-num">6</div><div class="step-content"><strong>Publicação</strong><p>Ir ao ar.</p></div></div>
<div class="card"><div class="check-item"><i class="fas fa-square"></i><span>Ativar chatbot no site</span></div><div class="check-item"><i class="fas fa-square"></i><span>Ativar chatbot no WhatsApp</span></div><div class="check-item"><i class="fas fa-square"></i><span>Informar equipe sobre o novo canal</span></div><div class="check-item"><i class="fas fa-square"></i><span>Divulgar para pacientes (redes sociais, email)</span></div></div>

<div class="step"><div class="step-num">7</div><div class="step-content"><strong>Monitoramento</strong><p>Acompanhar e melhorar.</p></div></div>
<div class="card"><div class="check-item"><i class="fas fa-square"></i><span>Acompanhar taxa de resolução do chatbot</span></div><div class="check-item"><i class="fas fa-square"></i><span>Verificar perguntas não respondidas</span></div><div class="check-item"><i class="fas fa-square"></i><span>Medir redução de faltas (antes vs depois)</span></div><div class="check-item"><i class="fas fa-square"></i><span>Avaliar feedback dos pacientes</span></div><div class="check-item"><i class="fas fa-square"></i><span>Ajustar respostas e fluxos conforme necessário</span></div></div>

${relatedClinicas}
${ctaBox}
</div></main>${footerHtml}</body></html>`;

// ========== 4. PROMPTS ==========
const promptCategories = [
  { cat: 'Recepção', icon: 'fa-door-open', items: ['Receba o paciente com cordialidade e pergunte como pode ajudar.','Identifique se o paciente já é cadastrado ou é primeira vez.','Informe horário de funcionamento e endereço da clínica.','Pergunte se o atendimento será por convênio ou particular.','Oriente sobre documentos necessários para a consulta.'] },
  { cat: 'Agendamento', icon: 'fa-calendar-plus', items: ['Pergunte a especialidade desejada e apresente horários disponíveis.','Confirme nome completo, telefone e email do paciente.','Ofereça opções de horário em diferentes turnos (manhã/tarde).','Após agendar, envie resumo com médico, data, horário e endereço.','Se não houver disponibilidade, ofereça lista de espera.'] },
  { cat: 'Confirmação', icon: 'fa-bell', items: ['Envie lembrete 24h antes com opção de confirmar ou reagendar.','Se não responder em 4h, envie segundo lembrete.','Ao confirmar, agradeça e lembre do preparo necessário.','Ao cancelar, ofereça novos horários imediatamente.','Registre a confirmação/cancelamento no sistema.'] },
  { cat: 'Triagem', icon: 'fa-stethoscope', items: ['Pergunte o motivo da consulta de forma acolhedora.','Questione sobre alergias a medicamentos.','Pergunte sobre medicamentos em uso.','Pergunte sobre cirurgias ou internações recentes.','Assegure que as informações são confidenciais.'] },
  { cat: 'Pós-consulta', icon: 'fa-heart-pulse', items: ['Agradeça pela visita e pergunte como foi a experiência.','Solicite avaliação de 1 a 5 estrelas.','Lembre sobre medicação prescrita, se aplicável.','Ofereça agendamento de retorno, se indicado pelo médico.','Informe canais de contato para dúvidas pós-consulta.'] },
  { cat: 'Objeções', icon: 'fa-shield-halved', items: ['Se perguntar "é seguro conversar por WhatsApp?", explique LGPD e segurança.','Se disser "prefiro ligar", ofereça o telefone mas destaque a praticidade do chat.','Se disser "não quero robô", explique que a IA é assistente, não substitui o médico.','Se perguntar "posso falar com uma pessoa?", transfira para atendimento humano.','Se questionar a qualidade, destaque que a IA é treinada pela própria clínica.'] }
];

const promptsHtml = promptCategories.map(c => {
  const items = c.items.map((p,i) => `<div class="card"><div class="card-title"><span>${c.cat} #${i+1}</span><button class="copy-btn" onclick="copyMsg(this)">Copiar</button></div><div class="msg-box">${p}</div></div>`).join('\n');
  return `<h2><i class="fas ${c.icon}"></i> ${c.cat}</h2>\n${items}`;
}).join('\n');

const prompts = `${sharedHead('Biblioteca de Prompts para Clínicas','30 prompts organizados por categoria para configurar chatbots de clínicas: recepção, agendamento, triagem, pós-consulta.','prompts-clinicas','prompts/clinicas')}
<script type="application/ld+json">[${breadcrumb([{name:'Início',url:'/'},{name:'Prompts',url:'/prompts/clinicas'},{name:'Clínicas'}]).schema}]</script>
<style>${sharedCSS}</style></head><body>${header}<main><div class="container">
${breadcrumb([{name:'Início',url:'/'},{name:'Prompts',url:'/prompts/clinicas'},{name:'Clínicas'}]).html}
<section class="hero"><span class="tag"><i class="fas fa-brain"></i> Biblioteca de Prompts</span>
<h1>Prompts para Chatbot de <span>Clínicas</span></h1>
<p class="subtitle">30 prompts organizados por categoria para configurar o chatbot da sua clínica.</p></section>
<div class="tag-list"><span class="tag-item">Recepção</span><span class="tag-item">Agendamento</span><span class="tag-item">Confirmação</span><span class="tag-item">Triagem</span><span class="tag-item">Pós-consulta</span><span class="tag-item">Objeções</span></div>
${promptsHtml}
${relatedClinicas}
${ctaBox}
</div></main>${footerHtml}
<script>function copyMsg(btn){const msg=btn.closest('.card').querySelector('.msg-box').textContent;navigator.clipboard.writeText(msg);btn.textContent='✅ Copiado!';setTimeout(()=>btn.textContent='Copiar',2000)}</script>
</body></html>`;

// ========== 5. EXEMPLOS ==========
const exemplos = `${sharedHead('Exemplos de Conversa — Chatbot para Clínicas','Exemplos simulados de conversas entre paciente e chatbot de IA: agendamento, confirmação, triagem e pós-consulta.','exemplos-clinicas','exemplos/clinicas')}
<script type="application/ld+json">[${breadcrumb([{name:'Início',url:'/'},{name:'Exemplos',url:'/exemplos/clinicas'},{name:'Clínicas'}]).schema}]</script>
<style>${sharedCSS}
.chat{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:20px;margin:16px 0}
.chat-msg{display:flex;gap:10px;margin-bottom:12px}.chat-msg:last-child{margin-bottom:0}
.chat-avatar{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.8rem;flex-shrink:0}
.chat-avatar.user{background:rgba(6,182,212,.2);color:var(--accent)}
.chat-avatar.bot{background:rgba(124,58,237,.2);color:var(--purple-l)}
.chat-bubble{background:var(--bg);border-radius:0 12px 12px 12px;padding:10px 14px;font-size:.85rem;color:var(--muted);max-width:80%;line-height:1.6}
.chat-msg.bot .chat-bubble{border-radius:12px 0 12px 12px}
.chat-label{font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px}
.chat-label.user{color:var(--accent)}.chat-label.bot{color:var(--purple-l)}
.example-note{background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.2);border-radius:8px;padding:10px 14px;font-size:.8rem;color:#f59e0b;margin:16px 0;display:flex;align-items:center;gap:8px}
</style></head><body>${header}<main><div class="container">
${breadcrumb([{name:'Início',url:'/'},{name:'Exemplos',url:'/exemplos/clinicas'},{name:'Clínicas'}]).html}
<section class="hero"><span class="tag"><i class="fas fa-comments"></i> Exemplos</span>
<h1>Exemplos de Conversa para <span>Clínicas</span></h1>
<p class="subtitle">Veja como um chatbot de IA interage com pacientes em cenários reais de atendimento clínico.</p></section>

<div class="example-note"><i class="fas fa-info-circle"></i> Os exemplos abaixo são simulações para demonstração. Nomes e dados são fictícios.</div>

<h2><i class="fas fa-calendar-plus"></i> Exemplo 1 — Agendamento de Consulta</h2>
<div class="chat">
<div class="chat-msg"><div class="chat-avatar user">👤</div><div><div class="chat-label user">Paciente</div><div class="chat-bubble">Boa tarde! Quero marcar uma consulta com dermatologista</div></div></div>
<div class="chat-msg bot"><div class="chat-avatar bot">🤖</div><div><div class="chat-label bot">Assistente</div><div class="chat-bubble">Boa tarde! 😊 Claro, posso te ajudar a agendar com nosso dermatologista, Dr. Marcos. Os próximos horários disponíveis são:<br><br>📅 Segunda 28/07 — 09h ou 14h<br>📅 Quarta 30/07 — 10h ou 15h<br>📅 Sexta 01/08 — 11h<br><br>Qual funciona melhor para você?</div></div></div>
<div class="chat-msg"><div class="chat-avatar user">👤</div><div><div class="chat-label user">Paciente</div><div class="chat-bubble">Quarta às 10h por favor</div></div></div>
<div class="chat-msg bot"><div class="chat-avatar bot">🤖</div><div><div class="chat-label bot">Assistente</div><div class="chat-bubble">Perfeito! Para confirmar o agendamento, preciso de algumas informações:<br><br>1️⃣ Seu nome completo<br>2️⃣ Atendimento por convênio ou particular?</div></div></div>
<div class="chat-msg"><div class="chat-avatar user">👤</div><div><div class="chat-label user">Paciente</div><div class="chat-bubble">Ana Silva, convênio Unimed</div></div></div>
<div class="chat-msg bot"><div class="chat-avatar bot">🤖</div><div><div class="chat-label bot">Assistente</div><div class="chat-bubble">✅ Agendado com sucesso, Ana!<br><br>🏥 Clínica Saúde Total<br>👨‍⚕️ Dr. Marcos — Dermatologia<br>📅 Quarta, 30/07 às 10h<br>📍 Rua das Flores, 123<br>🏥 Convênio: Unimed<br><br>Você receberá um lembrete 24h antes. Precisa de mais alguma coisa? 😊</div></div></div>
</div>

<h2><i class="fas fa-bell"></i> Exemplo 2 — Confirmação e Reagendamento</h2>
<div class="chat">
<div class="chat-msg bot"><div class="chat-avatar bot">🤖</div><div><div class="chat-label bot">Assistente</div><div class="chat-bubble">Olá, Ana! 😊 Lembrando da sua consulta amanhã:<br><br>👨‍⚕️ Dr. Marcos — Dermatologia<br>📅 Quarta, 30/07 às 10h<br><br>Você confirma?<br>✅ Sim, estarei lá<br>🔄 Preciso reagendar</div></div></div>
<div class="chat-msg"><div class="chat-avatar user">👤</div><div><div class="chat-label user">Paciente</div><div class="chat-bubble">Preciso reagendar, surgiu um compromisso</div></div></div>
<div class="chat-msg bot"><div class="chat-avatar bot">🤖</div><div><div class="chat-label bot">Assistente</div><div class="chat-bubble">Sem problemas, Ana! Liberei sua vaga. Os próximos horários disponíveis com Dr. Marcos são:<br><br>📅 Sexta 01/08 — 11h<br>📅 Segunda 04/08 — 09h ou 14h<br><br>Qual prefere?</div></div></div>
<div class="chat-msg"><div class="chat-avatar user">👤</div><div><div class="chat-label user">Paciente</div><div class="chat-bubble">Segunda às 9h</div></div></div>
<div class="chat-msg bot"><div class="chat-avatar bot">🤖</div><div><div class="chat-label bot">Assistente</div><div class="chat-bubble">✅ Reagendado! Sua nova consulta:<br><br>👨‍⚕️ Dr. Marcos<br>📅 Segunda, 04/08 às 09h<br><br>Enviarei novo lembrete 24h antes. 😊</div></div></div>
</div>

<h2><i class="fas fa-heart-pulse"></i> Exemplo 3 — Pós-consulta e Retorno</h2>
<div class="chat">
<div class="chat-msg bot"><div class="chat-avatar bot">🤖</div><div><div class="chat-label bot">Assistente</div><div class="chat-bubble">Olá, Ana! 😊 Esperamos que sua consulta com Dr. Marcos tenha sido boa. Como você avalia o atendimento?<br><br>⭐⭐⭐⭐⭐ Excelente<br>⭐⭐⭐⭐ Bom<br>⭐⭐⭐ Regular</div></div></div>
<div class="chat-msg"><div class="chat-avatar user">👤</div><div><div class="chat-label user">Paciente</div><div class="chat-bubble">Excelente! Dr. Marcos foi muito atencioso</div></div></div>
<div class="chat-msg bot"><div class="chat-avatar bot">🤖</div><div><div class="chat-label bot">Assistente</div><div class="chat-bubble">Que bom saber, Ana! 🎉 O Dr. Marcos indicou retorno em 30 dias. Gostaria de já agendar?</div></div></div>
<div class="chat-msg"><div class="chat-avatar user">👤</div><div><div class="chat-label user">Paciente</div><div class="chat-bubble">Sim, pode agendar</div></div></div>
<div class="chat-msg bot"><div class="chat-avatar bot">🤖</div><div><div class="chat-label bot">Assistente</div><div class="chat-bubble">Horários disponíveis para início de setembro:<br><br>📅 Segunda 01/09 — 09h ou 14h<br>📅 Quarta 03/09 — 10h<br><br>Qual prefere?</div></div></div>
</div>

${relatedClinicas}
${ctaBox}
</div></main>${footerHtml}</body></html>`;

// ========== WRITE ALL ==========
const files = [
  { path: 'public/templates/clinicas.html', content: templates },
  { path: 'public/fluxos/clinicas.html', content: fluxos },
  { path: 'public/checklists/clinicas.html', content: checklist },
  { path: 'public/prompts/clinicas.html', content: prompts },
  { path: 'public/exemplos/clinicas.html', content: exemplos }
];

files.forEach(f => {
  const filePath = path.join(__dirname, f.path);
  fs.writeFileSync(filePath, f.content, 'utf8');
  console.log(`✅ ${f.path}`);
});

console.log(`\nTotal: ${files.length} ativos do cluster Clínicas criados`);
