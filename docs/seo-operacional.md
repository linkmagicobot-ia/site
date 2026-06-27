# SEO Operacional — Arquitetura Completa

> LinkMágico — site.linkmagico.app.br  
> Última atualização: Junho 2026

---

## Visão Geral

O LinkMágico possui **73 páginas HTML** organizadas em um ecossistema de conteúdo vertical, com 5 clusters de segmento, glossário técnico, blog, ferramentas e documentação.

```
73 páginas | 72 no sitemap | 5 clusters | 17 termos | 6 artigos | 470+ links internos
```

---

## Arquitetura de Geração

```
cluster-config/*.json     ← Fonte de conteúdo
        ↓
generate-cluster.js       ← Gerador universal
        ↓
public/[tipo]/[slug].html ← Páginas geradas
        ↓
seo/audit.js              ← Auditoria (29 critérios)
        ↓
Deploy (Render.com)
```

### Criar novo cluster

```bash
# 1. Criar configuração
cp cluster-config/clinicas.json cluster-config/novo-segmento.json
# Editar com conteúdo específico

# 2. Gerar
node generate-cluster.js novo-segmento

# 3. Auditar
npm run seo:audit

# 4. Deploy
git add . && git commit -m "feat: cluster novo-segmento" && git push
```

---

## Definition of Done (29 critérios)

| # | Categoria | Critério |
|---|---|---|
| 1 | Conteúdo | Landing page com seção de recursos |
| 2 | Conteúdo | Artigo de blog vinculado |
| 3 | Conteúdo | Templates de mensagens (16-20) |
| 4 | Conteúdo | Diagramas de fluxo (4) |
| 5 | Conteúdo | Checklist de implantação (7 etapas) |
| 6 | Conteúdo | Biblioteca de prompts (30) |
| 7 | Conteúdo | Exemplos de conversa (3) |
| 8 | Conteúdo | 60-70% conteúdo exclusivo |
| 9 | SEO | Title tag única |
| 10 | SEO | Meta description única |
| 11 | SEO | Canonical URL |
| 12 | SEO | Open Graph completo |
| 13 | SEO | BreadcrumbList JSON-LD |
| 14 | SEO | Schema adicional |
| 15 | SEO | H1 único |
| 16 | Nav | Bloco de navegação do cluster |
| 17 | Nav | Links bidirecionais |
| 18 | Nav | Link para glossário |
| 19 | Nav | Link para calculadora ROI |
| 20 | Nav | Link para blog/docs |
| 21 | Qualidade | Conteúdo específico do segmento |
| 22 | Qualidade | Sem métricas inventadas |
| 23 | Qualidade | Simulações identificadas |
| 24 | Qualidade | 0 links quebrados |
| 25 | Técnico | URLs no sitemap |
| 26 | Técnico | Rotas no server.js |
| 27 | Técnico | Responsivo |
| 28 | Técnico | CTA consistente |
| 29 | Técnico | Footer padrão |

---

## Módulos SEO

### Estrutura de diretórios

```
seo/
├── validate-production.js    ← Validação de produção
├── indexnow.js               ← Protocolo IndexNow
├── audit.js                  ← Auditoria automatizada
├── index-report.js           ← Relatório de indexação
├── scheduler.js              ← Orquestrador diário/semanal/mensal
├── alerts.js                 ← Sistema de alertas
├── history.js                ← Snapshots históricos
├── reports.js                ← Geração de relatórios
├── search-console/
│   └── index.js              ← Google Search Console API
└── bing/
    └── index.js              ← Bing Webmaster API

docs/
├── search-console.md         ← Guia de configuração
├── bing-webmaster.md         ← Guia de configuração
└── seo-operacional.md        ← Este documento

data/seo/                     ← Snapshots históricos
├── YYYY-MM-DD/
│   └── snapshot.json
└── alerts/
    └── alerts-YYYY-MM-DD.json

reports/                      ← Relatórios gerados
├── seo-audit.json
├── seo-audit.md
├── index-report.json
├── index-report.md
├── production-validation.json
├── production-validation.md
├── daily-YYYY-MM-DD.md
├── weekly-YYYY-MM-DD.md
└── monthly-YYYY-MM-DD.md

public/admin/
└── seo.html                  ← Dashboard SEO (interno)
```

---

## Comandos npm

| Comando | Descrição | Quando usar |
|---|---|---|
| `npm run seo:audit` | Auditoria completa | Antes de deploy |
| `npm run seo:index-report` | Relatório de indexação | Verificar cobertura |
| `npm run seo:indexnow` | Enviar URLs ao IndexNow | Após publicações |
| `npm run seo:daily` | Snapshot + alertas + relatório | Diariamente (cron) |
| `npm run seo:weekly` | Relatório semanal | Semanalmente (cron) |
| `npm run seo:monthly` | Relatório mensal | Mensalmente (cron) |
| `npm run seo:alerts` | Verificar alertas | Sob demanda |

### Configuração de cron (Render.com)

```bash
# Cron Job diário (06:00 UTC)
0 6 * * * cd /app && node seo/scheduler.js daily

# Cron Job semanal (segunda-feira 07:00 UTC)
0 7 * * 1 cd /app && node seo/scheduler.js weekly

# Cron Job mensal (dia 1, 08:00 UTC)
0 8 1 * * cd /app && node seo/scheduler.js monthly
```

---

## Integrações

### Google Search Console API

**Status:** Preparado para credenciais

```bash
# 1. Instalar googleapis
npm install googleapis

# 2. Criar Service Account no Google Cloud
# 3. Baixar chave JSON
# 4. Adicionar email do SA como usuário no Search Console

# 5. Configurar
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json

# 6. Testar
node seo/search-console/index.js
```

Funções disponíveis:
- `fetchPerformance(startDate, endDate, dimensions)`
- `fetchPages()` / `fetchQueries()` / `fetchCountries()` / `fetchDevices()`
- `fetchCTR()` / `fetchPositions()`

### Bing Webmaster API

**Status:** Preparado para API key

```bash
# 1. Obter chave: Bing Webmaster > Settings > API Access
# 2. Configurar
export BING_WEBMASTER_API_KEY=sua_chave

# 3. Testar
node seo/bing/index.js
```

### IndexNow

**Status:** Preparado para ativação

```bash
# 1. Gerar chave
node seo/indexnow.js generate-key

# 2. Configurar
export INDEXNOW_KEY=chave_gerada
export INDEXNOW_HOST=site.linkmagico.app.br

# 3. Deploy (arquivo de verificação em public/)
# 4. Enviar URLs
node seo/indexnow.js all
```

---

## Dashboard SEO

Acessível em `/admin/seo` (noindex, nofollow — não indexado).

Funcionalidades:
- Visão geral de métricas (páginas, sitemap, links, clusters)
- Desempenho por cluster
- Cobertura de indexação
- Lista completa de páginas
- Status de auditoria
- Configuração IndexNow
- Validação de produção
- Status de integrações (SC, Bing, IndexNow)
- Comandos disponíveis
- Sistema de alertas
- Histórico de snapshots

---

## Sistema de Alertas

Condições monitoradas:

| Condição | Limiar | Severidade |
|---|---|---|
| Queda de impressões | > 20% | 🔴 Alta |
| Queda de CTR | > 15% | 🔴 Alta |
| Queda de posição | > 3 posições | 🟡 Média |
| Página removida do índice | Qualquer | 🔴 Alta |
| Erros na auditoria | Qualquer | 🟡 Média |
| Links quebrados | Qualquer | 🔴 Alta |

---

## Ações Manuais Necessárias

Após o deploy desta infraestrutura, duas ações manuais são necessárias:

### 1. Google Search Console

1. Adicionar e verificar a propriedade do domínio
2. Enviar o sitemap
3. (Opcional) Criar Service Account para API

### 2. Bing Webmaster Tools

1. Adicionar o site (ou importar do Search Console)
2. Verificar a propriedade
3. Enviar o sitemap
4. Ativar IndexNow

Após essas etapas, o sistema coletará e exibirá métricas reais automaticamente.
