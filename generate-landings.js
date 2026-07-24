const fs = require('fs');
const path = require('path');

const segments = [
  {
    slug: 'clinicas',
    title: 'Clínicas e Consultórios',
    headline: 'Automatize o atendimento da sua clínica com IA',
    subheadline: 'Agende consultas, confirme horários e reduza faltas — tudo pelo WhatsApp, 24 horas por dia.',
    icon: 'fa-hospital',
    color: '#06b6d4',
    problems: [
      { icon: 'fa-phone-slash', title: 'Ligações perdidas', desc: 'Pacientes ligam fora do horário e não conseguem agendar. Resultado: perda de receita.' },
      { icon: 'fa-calendar-xmark', title: 'Faltas e no-shows', desc: 'Pacientes esquecem consultas. Sem confirmação automática, a taxa de faltas chega a 30%.' },
      { icon: 'fa-clock', title: 'Recepção sobrecarregada', desc: 'A equipe gasta horas respondendo perguntas repetitivas: horários, valores, convênios.' },
      { icon: 'fa-user-slash', title: 'Leads não respondidos', desc: 'Pacientes que chegam pelo Instagram ou Google Ads ficam sem resposta nos finais de semana.' }
    ],
    solutions: [
      { icon: 'fa-robot', title: 'Agendamento automático', desc: 'O chatbot agenda consultas pelo WhatsApp 24h, verificando disponibilidade em tempo real.' },
      { icon: 'fa-bell', title: 'Confirmação e lembretes', desc: 'Mensagens automáticas 24h e 2h antes da consulta. Redução significativa de faltas.' },
      { icon: 'fa-comments', title: 'Respostas instantâneas', desc: 'IA responde sobre horários, valores, convênios aceitos e preparos para exames automaticamente.' },
      { icon: 'fa-user-check', title: 'Qualificação de pacientes', desc: 'Identifica o tipo de consulta, urgência e convênio antes mesmo do primeiro contato humano.' }
    ],
    flow: [
      { step: '1', label: 'Paciente envia mensagem', detail: 'WhatsApp, site ou Instagram' },
      { step: '2', label: 'IA identifica intenção', detail: 'Agendar, remarcar, tirar dúvida' },
      { step: '3', label: 'Chatbot resolve', detail: 'Agenda, confirma ou responde' },
      { step: '4', label: 'CRM registra', detail: 'Dados do paciente no pipeline' }
    ],
    features: ['Agendamento 24h', 'Confirmação automática', 'FAQ inteligente', 'CRM integrado', 'WhatsApp + Site', 'Relatórios'],
    exclusiveTitle: 'Funcionalidades exclusivas para clínicas',
    exclusiveItems: [
      { icon: 'fa-calendar-check', title: 'Confirmação de consultas', desc: 'Envio automático de lembrete com botão de confirmação ou reagendamento pelo WhatsApp.' },
      { icon: 'fa-clipboard-list', title: 'Pré-triagem inteligente', desc: 'O chatbot coleta sintomas e informações antes da consulta, economizando tempo do médico.' },
      { icon: 'fa-rotate', title: 'Reagendamento automático', desc: 'Paciente cancela? A IA oferece novos horários imediatamente e libera a vaga.' },
      { icon: 'fa-chart-line', title: 'Redução de no-shows', desc: 'Lembretes automáticos podem reduzir faltas — consulte nossos cases para dados reais.' }
    ],
    integrations: ['WhatsApp (Twilio/Evolution)', 'Google Calendar', 'WordPress', 'Google Ads'],
    faq: [
      { q: 'O chatbot consegue agendar consultas sozinho?', a: 'Sim. O chatbot do LinkMágico pode verificar disponibilidade e agendar consultas automaticamente pelo WhatsApp ou pelo widget no site.' },
      { q: 'Funciona com convênios?', a: 'Sim. O chatbot pode ser treinado para informar quais convênios são aceitos e direcionar pacientes particulares e de convênio para agendas diferentes.' },
      { q: 'Como funciona a confirmação de consultas?', a: 'O LinkMágico envia mensagens automáticas pelo WhatsApp antes da consulta, com opção de confirmar ou reagendar com um clique.' },
      { q: 'Preciso de equipe técnica para instalar?', a: 'Não. A instalação é feita colando um código no seu site. Para WhatsApp, basta conectar via QR Code ou API.' },
      { q: 'Quanto custa?', a: 'O LinkMágico tem planos a partir de R$0/mês (Free) até R$97/mês (Business). Não há taxas por mensagem no plano.' }
    ],
    glossaryLinks: ['chatbot', 'lead', 'crm', 'whatsapp-business-api', 'follow-up'],
    blogLinks: [
      { u: '/blog/chatbot-para-clinicas-e-consultorios', t: 'Chatbot para clínicas e consultórios' },
      { u: '/blog/como-automatizar-atendimento-whatsapp', t: 'Como automatizar atendimento pelo WhatsApp' }
    ]
  },
  {
    slug: 'imobiliarias',
    title: 'Imobiliárias',
    headline: 'Qualifique leads e agende visitas automaticamente',
    subheadline: 'Seu chatbot com IA atende interessados 24h, qualifica por perfil e agenda visitas — sem sobrecarregar corretores.',
    icon: 'fa-building',
    color: '#f59e0b',
    problems: [
      { icon: 'fa-hourglass', title: 'Leads esfriam rápido', desc: 'Quem busca imóvel espera resposta imediata. Demora de horas significa perda para o concorrente.' },
      { icon: 'fa-users', title: 'Corretores sobrecarregados', desc: 'A equipe gasta tempo com leads não qualificados — sem orçamento, sem perfil, sem urgência.' },
      { icon: 'fa-moon', title: 'Atendimento só em horário comercial', desc: 'A maioria das buscas por imóveis acontece à noite e nos finais de semana.' },
      { icon: 'fa-shuffle', title: 'Distribuição manual de leads', desc: 'Sem sistema, leads ficam concentrados em poucos corretores ou simplesmente se perdem.' }
    ],
    solutions: [
      { icon: 'fa-bolt', title: 'Resposta em segundos', desc: 'IA responde instantaneamente com informações do imóvel, fotos e localização.' },
      { icon: 'fa-filter', title: 'Qualificação automática', desc: 'Chatbot identifica orçamento, região desejada, tipo de imóvel e urgência antes de passar ao corretor.' },
      { icon: 'fa-calendar', title: 'Agendamento de visitas', desc: 'Interessados agendam visitas diretamente pelo WhatsApp, com confirmação automática.' },
      { icon: 'fa-sitemap', title: 'Distribuição inteligente', desc: 'Leads qualificados são distribuídos automaticamente entre corretores por região ou especialidade.' }
    ],
    flow: [
      { step: '1', label: 'Lead chega pelo portal', detail: 'OLX, ZAP, Instagram, Google' },
      { step: '2', label: 'IA qualifica em tempo real', detail: 'Orçamento, região, tipo, urgência' },
      { step: '3', label: 'Agenda visita ou envia imóveis', detail: 'Fotos, valores, localização' },
      { step: '4', label: 'Corretor recebe lead quente', detail: 'Com contexto completo no CRM' }
    ],
    features: ['Qualificação 24h', 'Agendamento de visitas', 'Envio de imóveis', 'Distribuição de leads', 'CRM', 'WhatsApp'],
    exclusiveTitle: 'Funcionalidades exclusivas para imobiliárias',
    exclusiveItems: [
      { icon: 'fa-house', title: 'Envio de imóveis por perfil', desc: 'O chatbot envia opções de imóveis compatíveis com o perfil do lead (orçamento, região, tipo).' },
      { icon: 'fa-users-gear', title: 'Distribuição para corretores', desc: 'Leads qualificados são distribuídos automaticamente, com todo o contexto da conversa.' },
      { icon: 'fa-map-location-dot', title: 'Filtro por localização', desc: 'IA identifica bairro, cidade ou região desejada e filtra imóveis automaticamente.' },
      { icon: 'fa-handshake', title: 'Follow-up pós-visita', desc: 'Mensagem automática após a visita perguntando interesse e oferecendo alternativas.' }
    ],
    integrations: ['WhatsApp (Twilio/Evolution)', 'Google Calendar', 'Portais (ZAP/OLX)', 'WordPress'],
    faq: [
      { q: 'O chatbot consegue enviar fotos de imóveis?', a: 'Sim. O chatbot pode enviar imagens, links e informações detalhadas dos imóveis durante a conversa pelo WhatsApp ou pelo site.' },
      { q: 'Como funciona a distribuição de leads?', a: 'Leads qualificados são registrados no CRM com todas as informações coletadas. A distribuição pode ser feita manualmente ou por regras automáticas.' },
      { q: 'Funciona com portais como OLX e ZAP?', a: 'O LinkMágico pode ser integrado via WhatsApp — quando o lead entra em contato pelo número do anúncio, o chatbot atende automaticamente.' },
      { q: 'Preciso treinar o chatbot com cada imóvel?', a: 'O treinamento é feito pela URL do seu site ou landing page. O chatbot aprende sobre todos os imóveis listados automaticamente.' },
      { q: 'Quanto custa?', a: 'Planos a partir de R$0/mês. O plano Pro (R$69/mês) é o mais indicado para imobiliárias com volume moderado de leads.' }
    ],
    glossaryLinks: ['lead', 'lead-scoring', 'pipeline', 'follow-up', 'crm'],
    blogLinks: [
      { u: '/blog/como-reduzir-abandono-de-leads', t: 'Como reduzir abandono de leads' },
      { u: '/blog/como-automatizar-atendimento-whatsapp', t: 'Como automatizar atendimento pelo WhatsApp' }
    ]
  },
  {
    slug: 'ecommerce',
    title: 'E-commerce',
    headline: 'Recupere carrinhos e venda mais com IA',
    subheadline: 'Chatbot que recupera carrinhos abandonados, responde dúvidas sobre produtos e faz pós-venda — automaticamente.',
    icon: 'fa-cart-shopping',
    color: '#10b981',
    problems: [
      { icon: 'fa-cart-arrow-down', title: 'Carrinhos abandonados', desc: 'Até 70% dos carrinhos são abandonados. Sem recuperação automática, é receita perdida.' },
      { icon: 'fa-question', title: 'Dúvidas sem resposta', desc: 'Visitantes com dúvidas sobre frete, prazo ou produto saem sem comprar se não recebem resposta imediata.' },
      { icon: 'fa-rotate-left', title: 'Pós-venda inexistente', desc: 'Sem acompanhamento pós-compra, o cliente não retorna e não recomenda.' },
      { icon: 'fa-clock', title: 'Suporte lento', desc: 'Tickets de suporte demoram horas. O cliente cancela ou abre reclamação.' }
    ],
    solutions: [
      { icon: 'fa-cart-plus', title: 'Recuperação de carrinhos', desc: 'Mensagem automática pelo WhatsApp para quem abandonou o carrinho, com link direto para finalizar.' },
      { icon: 'fa-comments', title: 'Vendedor no site', desc: 'Widget de chat responde dúvidas sobre produtos, frete, prazo e formas de pagamento em tempo real.' },
      { icon: 'fa-gift', title: 'Pós-venda automático', desc: 'Mensagem de acompanhamento, pedido de avaliação e recomendação de produtos complementares.' },
      { icon: 'fa-headset', title: 'Suporte instantâneo', desc: 'IA resolve 70-80% das dúvidas comuns: rastreio, troca, devolução, prazo.' }
    ],
    flow: [
      { step: '1', label: 'Visitante navega na loja', detail: 'Produtos, categorias, checkout' },
      { step: '2', label: 'Chatbot engaja', detail: 'Tira dúvidas, sugere produtos' },
      { step: '3', label: 'Abandono? IA recupera', detail: 'WhatsApp com link do carrinho' },
      { step: '4', label: 'Pós-venda automático', detail: 'Rastreio, avaliação, cross-sell' }
    ],
    features: ['Recuperação de carrinho', 'FAQ automático', 'Pós-venda', 'Rastreio', 'Cross-sell', 'WhatsApp'],
    exclusiveTitle: 'Funcionalidades exclusivas para e-commerce',
    exclusiveItems: [
      { icon: 'fa-cart-plus', title: 'Recuperação de carrinho abandonado', desc: 'Detecta abandono e envia mensagem personalizada pelo WhatsApp com link direto para o checkout.' },
      { icon: 'fa-truck', title: 'Rastreio automático', desc: 'Cliente pergunta "onde está meu pedido?" e o chatbot responde com status atualizado.' },
      { icon: 'fa-tags', title: 'Recomendação de produtos', desc: 'IA sugere produtos complementares baseado no histórico de compra ou navegação.' },
      { icon: 'fa-star', title: 'Coleta de avaliações', desc: 'Pós-venda automático solicita avaliação do produto e da experiência de compra.' }
    ],
    integrations: ['Shopify', 'WooCommerce', 'Stripe', 'Mercado Pago', 'WhatsApp', 'Hotmart'],
    faq: [
      { q: 'O chatbot se integra com minha loja?', a: 'Sim. O LinkMágico pode ser instalado em qualquer plataforma (Shopify, WooCommerce, Wix, Hotmart) com um simples código de embed.' },
      { q: 'Como funciona a recuperação de carrinho?', a: 'O chatbot pode enviar mensagens pelo WhatsApp para clientes que abandonaram o carrinho, com link direto para finalizar a compra.' },
      { q: 'Consegue responder sobre produtos específicos?', a: 'Sim. O chatbot é treinado com o conteúdo do seu site — ele conhece cada produto, preço, especificação e disponibilidade.' },
      { q: 'Funciona com Mercado Pago e Stripe?', a: 'Sim. O LinkMágico integra com Stripe nativamente e pode ser conectado ao Mercado Pago via webhooks.' },
      { q: 'Quanto custa por mensagem?', a: 'O LinkMágico não cobra por mensagem. Os planos são por assinatura mensal fixa, a partir de R$0/mês.' }
    ],
    glossaryLinks: ['chatbot', 'conversao', 'roi', 'webhook', 'api'],
    blogLinks: [
      { u: '/blog/como-converter-mais-leads-com-chatbot-de-ia', t: 'Como converter mais leads com chatbot de IA' },
      { u: '/blog/como-reduzir-abandono-de-leads', t: 'Como reduzir abandono de leads' }
    ]
  },
  {
    slug: 'restaurantes',
    title: 'Restaurantes',
    headline: 'Reservas, cardápio e delivery automatizados',
    subheadline: 'Seu chatbot recebe reservas, apresenta o cardápio e gerencia pedidos pelo WhatsApp — sem instalar aplicativos.',
    icon: 'fa-utensils',
    color: '#ef4444',
    problems: [
      { icon: 'fa-phone', title: 'Telefone sempre ocupado', desc: 'Clientes não conseguem ligar para reservar mesa ou fazer pedido. Desistem e vão ao concorrente.' },
      { icon: 'fa-list', title: 'Cardápio desatualizado', desc: 'Clientes pedem pelo WhatsApp e a equipe precisa enviar PDF ou fotos manualmente.' },
      { icon: 'fa-people-group', title: 'Equipe limitada', desc: 'Nos horários de pico, ninguém consegue responder WhatsApp enquanto atende presencialmente.' },
      { icon: 'fa-receipt', title: 'Pedidos por WhatsApp manuais', desc: 'Anotar pedidos manualmente gera erros, atrasos e confusão na cozinha.' }
    ],
    solutions: [
      { icon: 'fa-calendar-check', title: 'Reservas automáticas', desc: 'Cliente reserva mesa pelo WhatsApp informando data, horário e número de pessoas. Confirmação instantânea.' },
      { icon: 'fa-book-open', title: 'Cardápio interativo', desc: 'Chatbot apresenta o cardápio, destaca promoções e responde sobre ingredientes e alérgenos.' },
      { icon: 'fa-motorcycle', title: 'Pedidos para delivery', desc: 'Cliente monta o pedido pelo chat, confirma endereço e forma de pagamento automaticamente.' },
      { icon: 'fa-bell', title: 'Confirmação e acompanhamento', desc: 'Notificação automática quando o pedido está pronto ou saiu para entrega.' }
    ],
    flow: [
      { step: '1', label: 'Cliente envia mensagem', detail: 'WhatsApp ou site do restaurante' },
      { step: '2', label: 'IA identifica intenção', detail: 'Reservar, pedir, ver cardápio' },
      { step: '3', label: 'Chatbot processa', detail: 'Reserva, monta pedido ou informa' },
      { step: '4', label: 'Equipe recebe', detail: 'Pedido organizado, reserva confirmada' }
    ],
    features: ['Reservas 24h', 'Cardápio digital', 'Delivery', 'Confirmações', 'Promoções', 'WhatsApp'],
    exclusiveTitle: 'Funcionalidades exclusivas para restaurantes',
    exclusiveItems: [
      { icon: 'fa-book-open', title: 'Cardápio pelo WhatsApp', desc: 'O chatbot apresenta o cardápio organizado por categorias, com preços e fotos dos pratos.' },
      { icon: 'fa-calendar-day', title: 'Reserva de mesas', desc: 'Reserva automática com data, horário e número de pessoas. Confirmação e lembrete automáticos.' },
      { icon: 'fa-utensils', title: 'Pedidos organizados', desc: 'Clientes montam o pedido pelo chat. A equipe recebe tudo organizado, sem erros de anotação.' },
      { icon: 'fa-bullhorn', title: 'Promoções e eventos', desc: 'Envio automático de promoções do dia, happy hour e eventos especiais para clientes cadastrados.' }
    ],
    integrations: ['WhatsApp (Twilio/Evolution)', 'Google Maps', 'Instagram', 'Google Meu Negócio'],
    faq: [
      { q: 'O chatbot consegue receber pedidos completos?', a: 'Sim. O chatbot pode guiar o cliente pela montagem do pedido (prato, acompanhamento, bebida), confirmar e enviar para a cozinha.' },
      { q: 'Funciona para delivery?', a: 'Sim. O chatbot coleta endereço, forma de pagamento e monta o pedido automaticamente. A equipe recebe tudo organizado.' },
      { q: 'Preciso de um app próprio?', a: 'Não. O LinkMágico funciona pelo WhatsApp e pelo site — o cliente não precisa instalar nada.' },
      { q: 'Como atualizo o cardápio?', a: 'O chatbot aprende pelo conteúdo do seu site. Ao atualizar o cardápio no site, basta retreinar o chatbot com a mesma URL.' },
      { q: 'Quanto custa?', a: 'Planos a partir de R$0/mês. O plano Starter (R$29/mês) já atende a maioria dos restaurantes de pequeno e médio porte.' }
    ],
    glossaryLinks: ['chatbot', 'whatsapp-business-api', 'conversao', 'follow-up', 'webhook'],
    blogLinks: [
      { u: '/blog/como-automatizar-atendimento-whatsapp', t: 'Como automatizar atendimento pelo WhatsApp' },
      { u: '/blog/como-converter-mais-leads-com-chatbot-de-ia', t: 'Como converter mais leads com chatbot de IA' }
    ]
  },
  {
    slug: 'infoprodutores',
    title: 'Infoprodutores',
    headline: 'Venda seus infoprodutos no automático com IA',
    subheadline: 'Chatbot que qualifica leads, quebra objeções, recupera boletos e dá suporte aos alunos — 24 horas por dia.',
    icon: 'fa-graduation-cap',
    color: '#8b5cf6',
    problems: [
      { icon: 'fa-comments-dollar', title: 'Leads não respondem', desc: 'O lead clica no anúncio, visita a página de vendas, mas sai sem comprar. Sem follow-up, está perdido.' },
      { icon: 'fa-file-invoice-dollar', title: 'Boletos não pagos', desc: 'Até 60% dos boletos gerados não são pagos. Sem lembrete, é receita perdida.' },
      { icon: 'fa-headset', title: 'Suporte ao aluno manual', desc: 'Alunos perguntam sobre acesso, módulos, certificado. A equipe gasta horas respondendo o mesmo.' },
      { icon: 'fa-rocket', title: 'Lançamentos exigem equipe', desc: 'Período de lançamento gera centenas de perguntas simultâneas. Impossível responder manualmente.' }
    ],
    solutions: [
      { icon: 'fa-robot', title: 'Vendedor automático 24/7', desc: 'IA treinada no seu produto responde objeções, apresenta benefícios e direciona para o checkout.' },
      { icon: 'fa-money-bill-wave', title: 'Recuperação de boletos', desc: 'Mensagem automática lembrando do boleto pendente, com link direto para pagamento.' },
      { icon: 'fa-chalkboard-user', title: 'Suporte ao aluno', desc: 'Chatbot responde sobre acesso, conteúdo dos módulos, certificado e problemas técnicos.' },
      { icon: 'fa-bullhorn', title: 'Suporte a lançamentos', desc: 'IA absorve o pico de perguntas durante lançamentos, mantendo tempo de resposta instantâneo.' }
    ],
    flow: [
      { step: '1', label: 'Lead vê o anúncio', detail: 'Facebook, Instagram, YouTube' },
      { step: '2', label: 'Visita landing page', detail: 'Widget do chatbot aparece' },
      { step: '3', label: 'IA qualifica e vende', detail: 'Quebra objeções, mostra valor' },
      { step: '4', label: 'Pós-venda automático', detail: 'Acesso, suporte, upsell' }
    ],
    features: ['Vendas 24/7', 'Recuperação de boletos', 'Suporte ao aluno', 'Lançamentos', 'WhatsApp', 'CRM'],
    exclusiveTitle: 'Funcionalidades exclusivas para infoprodutores',
    exclusiveItems: [
      { icon: 'fa-money-bill-transfer', title: 'Recuperação de boletos/PIX', desc: 'Lembrete automático por WhatsApp com link de pagamento para boletos pendentes.' },
      { icon: 'fa-hand-holding-dollar', title: 'Quebra de objeções', desc: 'IA treinada para responder "tá caro", "funciona mesmo?", "tem garantia?" com argumentos persuasivos.' },
      { icon: 'fa-layer-group', title: 'Funil de lançamento', desc: 'Chatbot gerencia o funil completo: captação → aquecimento → abertura de carrinho → fechamento.' },
      { icon: 'fa-arrow-up-right-dots', title: 'Upsell automático', desc: 'Após a compra, o chatbot oferece produtos complementares (mentoria, comunidade, módulo avançado).' }
    ],
    integrations: ['Hotmart', 'Stripe', 'WhatsApp (Twilio/Evolution)', 'WordPress', 'Elementor'],
    faq: [
      { q: 'Funciona com Hotmart?', a: 'Sim. O LinkMágico pode ser integrado com Hotmart via webhooks para rastrear compras, boletos pendentes e status de aluno.' },
      { q: 'O chatbot consegue vender meu curso?', a: 'Sim. O chatbot é treinado com o conteúdo da sua página de vendas e responde objeções, apresenta benefícios e direciona para o checkout.' },
      { q: 'Como recupera boletos?', a: 'O chatbot envia lembretes automáticos pelo WhatsApp para leads que geraram boleto mas não pagaram, com link direto para pagamento.' },
      { q: 'Funciona durante lançamentos?', a: 'Sim. O chatbot absorve o pico de perguntas, respondendo centenas de leads simultaneamente sem queda de qualidade.' },
      { q: 'Quanto custa?', a: 'Planos a partir de R$0/mês. Para infoprodutores com lançamentos, recomendamos o plano Pro (R$69/mês) ou Business (R$97/mês).' }
    ],
    glossaryLinks: ['chatbot', 'lead', 'funil-de-vendas', 'conversao', 'roi'],
    blogLinks: [
      { u: '/blog/como-converter-mais-leads-com-chatbot-de-ia', t: 'Como converter mais leads com chatbot de IA' },
      { u: '/blog/como-reduzir-abandono-de-leads', t: 'Como reduzir abandono de leads' }
    ]
  }
];

function gen(s) {
  const faqSchema = s.faq.map((f,i)=>`{"@type":"Question","name":"${f.q.replace(/"/g,'\\"')}","acceptedAnswer":{"@type":"Answer","text":"${f.a.replace(/"/g,'\\"')}"}}`).join(',');
  const problemsHtml = s.problems.map(p=>`<div class="problem-card"><div class="problem-icon"><i class="fas ${p.icon}"></i></div><h3>${p.title}</h3><p>${p.desc}</p></div>`).join('\n');
  const solutionsHtml = s.solutions.map(p=>`<div class="solution-card"><div class="solution-icon"><i class="fas ${p.icon}"></i></div><h3>${p.title}</h3><p>${p.desc}</p></div>`).join('\n');
  const flowHtml = s.flow.map(f=>`<div class="flow-step"><div class="flow-num">${f.step}</div><div><strong>${f.label}</strong><span>${f.detail}</span></div></div>`).join('<div class="flow-arrow"><i class="fas fa-arrow-right"></i></div>');
  const featuresHtml = s.features.map(f=>`<span class="feat-tag"><i class="fas fa-check"></i> ${f}</span>`).join('\n');
  const exclusiveHtml = s.exclusiveItems.map(e=>`<div class="exc-card"><div class="exc-icon" style="color:${s.color}"><i class="fas ${e.icon}"></i></div><h3>${e.title}</h3><p>${e.desc}</p></div>`).join('\n');
  const integrationsHtml = s.integrations.map(i=>`<span class="int-tag">${i}</span>`).join('\n');
  const faqHtml = s.faq.map(f=>`<div class="faq-item"><button class="faq-q" onclick="this.parentElement.classList.toggle('open')"><span>${f.q}</span><i class="fas fa-chevron-down"></i></button><div class="faq-a"><p>${f.a}</p></div></div>`).join('\n');
  const glossaryHtml = s.glossaryLinks.map(g=>`<a href="/glossario/${g}"><i class="fas fa-book-open"></i> ${g.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</a>`).join('\n');
  const blogHtml = s.blogLinks.map(b=>`<a href="${b.u}"><i class="fas fa-newspaper"></i> ${b.t}</a>`).join('\n');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Chatbot com IA para ${s.title} — LinkMágico</title>
<meta name="description" content="${s.subheadline}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="https://site.linkmagico.app.br/${s.slug}">
<meta property="og:type" content="website">
<meta property="og:title" content="Chatbot com IA para ${s.title} — LinkMágico">
<meta property="og:description" content="${s.subheadline}">
<meta property="og:url" content="https://site.linkmagico.app.br/${s.slug}">
<meta property="og:image" content="https://site.linkmagico.app.br/og-linkmagico.png">
<meta property="og:locale" content="pt_BR">
<meta property="og:site_name" content="LinkMágico">
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%237c3aed'><path d='M13 2L3 14h7l-2 8 10-12h-7l2-8z'/></svg>">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
<script type="application/ld+json">
[{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Início","item":"https://site.linkmagico.app.br/"},{"@type":"ListItem","position":2,"name":"${s.title}"}]},{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[${faqSchema}]}]
</script>
<style>
*{margin:0;padding:0;box-sizing:border-box}:root{--bg:#06060e;--surface:#0e0e1a;--surface2:#151525;--border:#1e1e35;--purple:#7c3aed;--purple-l:#a78bfa;--green:#10b981;--green-l:#34d399;--text:#f0eeff;--muted:#7a7896;--accent:${s.color}}body{font-family:'Inter',system-ui,sans-serif;color:var(--text);background:var(--bg);line-height:1.7}a{color:var(--purple-l);text-decoration:none}a:hover{text-decoration:underline}.container{max-width:900px;margin:0 auto;padding:0 24px}
header{position:fixed;top:0;left:0;right:0;z-index:100;padding:14px 0;background:rgba(6,6,14,.92);backdrop-filter:blur(16px);border-bottom:1px solid var(--border)}.nav{display:flex;align-items:center;justify-content:space-between;max-width:1140px;margin:0 auto;padding:0 24px}.nav__logo{font-size:1.25rem;font-weight:800;font-family:'Space Grotesk',sans-serif;color:var(--text)}.logo-hl{background:linear-gradient(135deg,var(--purple),var(--green));-webkit-background-clip:text;-webkit-text-fill-color:transparent}.nav__links{display:flex;gap:20px;align-items:center}.nav__links a{color:var(--muted);font-size:.9rem}.nav__links a:hover{color:var(--text);text-decoration:none}.btn-cta{background:linear-gradient(135deg,var(--purple),#5b21b6);color:#fff!important;padding:8px 20px;border-radius:8px;font-weight:600;font-size:.85rem}
.breadcrumb{padding:90px 0 0;font-size:.83rem;color:var(--muted)}.breadcrumb a{color:var(--muted)}

/* Hero */
.hero{padding:32px 0 40px;text-align:center}.hero-icon{font-size:2.5rem;color:var(--accent);margin-bottom:16px}
.hero h1{font-family:'Space Grotesk',sans-serif;font-size:clamp(1.5rem,4vw,2.4rem);font-weight:800;line-height:1.2;margin-bottom:12px}.hero h1 span{color:var(--accent)}
.hero p{color:var(--muted);font-size:1.05rem;max-width:600px;margin:0 auto 20px}
.hero-cta{display:inline-block;background:linear-gradient(135deg,var(--purple),var(--accent));color:#fff;padding:14px 32px;border-radius:12px;font-weight:700;font-size:1rem;text-decoration:none;transition:transform .2s,box-shadow .3s}.hero-cta:hover{transform:translateY(-2px);box-shadow:0 8px 30px rgba(124,58,237,.3);text-decoration:none;color:#fff}

/* Section */
.section{padding:48px 0}.section-title{font-family:'Space Grotesk',sans-serif;font-size:1.4rem;font-weight:800;text-align:center;margin-bottom:28px}.section-title span{color:var(--accent)}

/* Problem/Solution Grid */
.grid-4{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}@media(max-width:600px){.grid-4{grid-template-columns:1fr}}
.problem-card,.solution-card{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:20px;transition:border-color .3s}.problem-card:hover,.solution-card:hover{border-color:var(--accent)}
.problem-icon{color:#ef4444;font-size:1.3rem;margin-bottom:10px}.solution-icon{color:var(--accent);font-size:1.3rem;margin-bottom:10px}
.problem-card h3,.solution-card h3{font-size:.95rem;font-weight:700;margin-bottom:6px}.problem-card p,.solution-card p{font-size:.85rem;color:var(--muted)}

/* Flow */
.flow{display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;margin:20px 0}
.flow-step{display:flex;align-items:center;gap:10px;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:14px 18px}
.flow-num{width:32px;height:32px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.85rem;flex-shrink:0}
.flow-step strong{font-size:.85rem;display:block}.flow-step span{font-size:.75rem;color:var(--muted)}
.flow-arrow{color:var(--muted);font-size:.8rem}@media(max-width:700px){.flow{flex-direction:column}.flow-arrow{transform:rotate(90deg)}}

/* Features */
.feat-grid{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin:16px 0}
.feat-tag{background:rgba(124,58,237,.1);border:1px solid rgba(124,58,237,.2);color:var(--purple-l);padding:8px 16px;border-radius:20px;font-size:.83rem;font-weight:600}.feat-tag i{color:var(--green-l);margin-right:4px}

/* Exclusive */
.exc-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}@media(max-width:600px){.exc-grid{grid-template-columns:1fr}}
.exc-card{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:20px;transition:border-color .3s}.exc-card:hover{border-color:var(--accent)}
.exc-icon{font-size:1.5rem;margin-bottom:10px}.exc-card h3{font-size:.92rem;font-weight:700;margin-bottom:6px}.exc-card p{font-size:.84rem;color:var(--muted)}

/* Integrations */
.int-grid{display:flex;flex-wrap:wrap;gap:10px;justify-content:center}
.int-tag{background:var(--surface);border:1px solid var(--border);padding:10px 18px;border-radius:10px;font-size:.85rem;font-weight:600}

/* FAQ */
.faq-list{display:flex;flex-direction:column;gap:10px}
.faq-item{background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden}
.faq-q{width:100%;padding:16px 20px;background:none;border:none;color:var(--text);font-size:.9rem;font-weight:600;cursor:pointer;display:flex;justify-content:space-between;align-items:center;font-family:'Inter',sans-serif;text-align:left}.faq-q i{color:var(--muted);transition:transform .3s;font-size:.75rem}
.faq-a{display:none;padding:0 20px 16px;border-top:1px solid var(--border)}.faq-a p{color:var(--muted);font-size:.87rem;margin-top:10px}
.faq-item.open .faq-q i{transform:rotate(180deg)}.faq-item.open .faq-a{display:block}

/* Related */
.related-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px}@media(max-width:600px){.related-grid{grid-template-columns:1fr}}
.related-box{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:16px}
.related-box h4{font-size:.85rem;font-weight:700;margin-bottom:10px}
.related-box a{display:block;font-size:.82rem;padding:5px 0;color:var(--purple-l);border-bottom:1px solid var(--border)}.related-box a:last-child{border-bottom:none}
.related-box a:hover{color:var(--green-l);text-decoration:none}.related-box a i{margin-right:6px;font-size:.7rem}

/* CTA final */
.cta-final{background:linear-gradient(135deg,rgba(124,58,237,.1),rgba(16,185,129,.1));border:1px solid rgba(124,58,237,.2);border-radius:16px;padding:36px;text-align:center;margin-top:48px}
.cta-final h2{font-family:'Space Grotesk',sans-serif;font-size:1.3rem;margin-bottom:8px}.cta-final p{color:var(--muted);font-size:.92rem;margin-bottom:18px;max-width:500px;margin-left:auto;margin-right:auto}
.cta-final .hero-cta{font-size:.95rem;padding:12px 28px}

footer{margin-top:60px;padding:40px 0;border-top:1px solid var(--border);text-align:center;color:var(--muted);font-size:.85rem}
@media(max-width:480px){.container{padding:0 16px}.nav__links a:not(.btn-cta){display:none}}
</style>
</head>
<body>
<header><nav class="nav" aria-label="Navegação principal"><a href="/" class="nav__logo">⚡ <span class="logo-hl">LinkMágico</span></a><div class="nav__links"><a href="/">Home</a><a href="/blog/">Blog</a><a href="/glossario">Glossário</a><a href="https://linkmagico.app.br/pricing.html" class="btn-cta">Ver Planos</a></div></nav></header>
<main>
<div class="container">
<nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Início</a> › <strong>Chatbot para ${s.title}</strong></nav>

<section class="hero">
<div class="hero-icon"><i class="fas ${s.icon}"></i></div>
<h1>Chatbot com IA para <span>${s.title}</span></h1>
<p>${s.subheadline}</p>
<a href="https://linkmagico.app.br/signup.html" class="hero-cta">Testar Grátis →</a>
</section>

<section class="section">
<h2 class="section-title">Problemas que <span>${s.title.toLowerCase()}</span> enfrentam</h2>
<div class="grid-4">${problemsHtml}</div>
</section>

<section class="section">
<h2 class="section-title">Como o <span>LinkMágico</span> resolve</h2>
<div class="grid-4">${solutionsHtml}</div>
</section>

<section class="section">
<h2 class="section-title">Como <span>funciona</span></h2>
<div class="flow">${flowHtml}</div>
</section>

<section class="section">
<h2 class="section-title">Recursos <span>inclusos</span></h2>
<div class="feat-grid">${featuresHtml}</div>
</section>

<section class="section">
<h2 class="section-title">${s.exclusiveTitle.replace(s.title.toLowerCase(),`<span>${s.title.toLowerCase()}</span>`)}</h2>
<div class="exc-grid">${exclusiveHtml}</div>
</section>

<section class="section">
<h2 class="section-title"><span>Integrações</span> compatíveis</h2>
<div class="int-grid">${integrationsHtml}</div>
</section>

<section class="section">
<h2 class="section-title">Perguntas <span>frequentes</span></h2>
<div class="faq-list">${faqHtml}</div>
</section>

<section class="section">
<h2 class="section-title">Conteúdos <span>relacionados</span></h2>
<div class="related-grid">
<div class="related-box"><h4>📚 Glossário</h4>${glossaryHtml}</div>
<div class="related-box"><h4>📖 Blog</h4>${blogHtml}</div>
<div class="related-box"><h4>🔧 Ferramentas</h4><a href="/ferramentas/calculadora-roi"><i class="fas fa-calculator"></i> Calculadora de ROI</a><a href="/docs"><i class="fas fa-book"></i> Documentação</a><a href="https://linkmagico.app.br/pricing.html"><i class="fas fa-tag"></i> Ver Planos</a></div>
</div>
</section>

<div class="cta-final">
<h2>Pronto para automatizar?</h2>
<p>Crie seu vendedor automático com IA para ${s.title.toLowerCase()} em menos de 2 minutos. Sem cartão de crédito.</p>
<a href="https://linkmagico.app.br/signup.html" class="hero-cta">Criar Conta Grátis →</a>
</div>
</div>
</main>
<footer><div class="container"><p>© 2025 LinkMágico — Todos os direitos reservados.</p><p style="margin-top:8px"><a href="/">Início</a> · <a href="/blog/">Blog</a> · <a href="/glossario">Glossário</a> · <a href="/docs">Docs</a> · <a href="/politica-de-privacidade">Privacidade</a></p></div></footer>
</body>
</html>`;
}

let count = 0;
for (const s of segments) {
  const filePath = path.join(__dirname, 'public', s.slug + '.html');
  fs.writeFileSync(filePath, gen(s), 'utf8');
  count++;
  console.log(`✅ ${s.slug}.html`);
}
console.log(`\nTotal: ${count} landing pages criadas`);
