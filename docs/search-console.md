# Google Search Console — Guia de Configuração

> LinkMágico — site.linkmagico.app.br  
> Última atualização: Junho 2026

---

## 1. Adicionar Propriedade

### Opção A: Domain Property (Recomendado)

1. Acesse [Google Search Console](https://search.google.com/search-console)
2. Clique em **Adicionar Propriedade**
3. Selecione **Propriedade de domínio**
4. Digite: `linkmagico.app.br`
5. Validar via DNS (próxima seção)

**Vantagens:** cobre www, sem www, http, https e todos os subdomínios.

### Opção B: URL Prefix (Alternativa)

1. Selecione **Prefixo de URL**
2. Digite: `https://site.linkmagico.app.br`
3. Validar por qualquer método disponível

---

## 2. Métodos de Validação

### DNS TXT Record (para Domain Property)

1. No Google Search Console, copie o registro TXT fornecido
2. Acesse o painel DNS do seu domínio (Render / registrador)
3. Adicione um registro TXT na raiz (`@`):
   ```
   Tipo: TXT
   Nome: @
   Valor: google-site-verification=XXXXXXXXXXXXXXXX
   TTL: 3600
   ```
4. Aguarde propagação (até 72h, geralmente 15-30min)
5. Clique em **Verificar** no Search Console

### Upload de Arquivo HTML

1. Baixe o arquivo HTML fornecido
2. Coloque em `public/googleXXXXXXXXXXXX.html`
3. Certifique que está acessível: `https://site.linkmagico.app.br/googleXXXXXXXXXXXX.html`
4. Clique em **Verificar**

### Meta Tag

1. Copie a meta tag fornecida
2. Adicione ao `<head>` do `public/index.html`:
   ```html
   <meta name="google-site-verification" content="XXXXXXXXXXXXXXXX">
   ```
3. Faça deploy e clique em **Verificar**

---

## 3. Envio do Sitemap

1. No menu lateral, clique em **Sitemaps**
2. Digite a URL do sitemap:
   ```
   https://site.linkmagico.app.br/sitemap.xml
   ```
3. Clique em **Enviar**
4. Aguarde processamento (pode levar até 48h)
5. Verifique o status: deve mostrar **Sucesso** com 72 URLs

---

## 4. Solicitar Indexação Manual

Para páginas novas ou atualizadas:

1. Acesse **Inspeção de URL** (barra superior)
2. Cole a URL completa: `https://site.linkmagico.app.br/clinicas`
3. Clique em **Testar URL ativa**
4. Se tudo OK, clique em **Solicitar indexação**

**Limite:** ~10-12 solicitações por dia.

---

## 5. Interpretação dos Relatórios

### Desempenho

| Métrica | O que é | Meta |
|---|---|---|
| Impressões | Vezes que seu site apareceu nos resultados | Crescimento constante |
| Cliques | Vezes que clicaram no seu resultado | Crescimento constante |
| CTR | Cliques ÷ Impressões × 100 | > 3% |
| Posição média | Posição nos resultados (1 = topo) | < 20 |

**Filtros úteis:**
- Por página: identifica landing pages com melhor performance
- Por consulta: descobre termos que trazem tráfego
- Por país: confirma tráfego do Brasil
- Por dispositivo: mobile vs desktop

### Cobertura

| Status | Significado | Ação |
|---|---|---|
| Válida | Página indexada com sucesso | ✅ Nenhuma |
| Válida com avisos | Indexada mas com problemas menores | ⚠️ Investigar |
| Excluída | Não indexada intencionalmente (noindex, canonical, etc.) | Verificar se intencional |
| Erro | Problema que impede indexação | ❌ Corrigir urgente |

### Core Web Vitals

| Métrica | Bom | Precisa melhorar | Ruim |
|---|---|---|---|
| LCP (Largest Contentful Paint) | ≤ 2.5s | 2.5s - 4.0s | > 4.0s |
| FID (First Input Delay) | ≤ 100ms | 100ms - 300ms | > 300ms |
| CLS (Cumulative Layout Shift) | ≤ 0.1 | 0.1 - 0.25 | > 0.25 |

### Links

- **Links externos:** Sites que apontam para o LinkMágico
- **Links internos:** Distribuição de links entre páginas do site
- **Páginas mais vinculadas:** Suas páginas mais linkadas externamente

---

## 6. Checklist de Configuração

- [ ] Criar conta Google (se necessário)
- [ ] Adicionar propriedade no Search Console
- [ ] Validar propriedade (DNS TXT ou HTML)
- [ ] Enviar sitemap: `https://site.linkmagico.app.br/sitemap.xml`
- [ ] Verificar processamento do sitemap (72 URLs)
- [ ] Solicitar indexação das páginas principais
- [ ] Configurar notificações por email
- [ ] Verificar Core Web Vitals após indexação
- [ ] Monitorar cobertura semanalmente
- [ ] Adicionar Service Account para API (opcional):
  - [ ] Criar projeto no Google Cloud Console
  - [ ] Ativar Search Console API
  - [ ] Criar Service Account
  - [ ] Baixar chave JSON
  - [ ] Adicionar email como usuário no Search Console
  - [ ] Configurar `GOOGLE_APPLICATION_CREDENTIALS`

---

## 7. Troubleshooting

| Problema | Solução |
|---|---|
| Verificação DNS não funciona | Verificar propagação: `nslookup -type=TXT linkmagico.app.br` |
| Sitemap retorna erro | Acessar URL diretamente, verificar XML válido |
| Página não indexada | Verificar canonical, noindex, robots.txt |
| Impressões zero | Normal nos primeiros dias/semanas |
| Posição muito alta (>50) | Otimizar conteúdo, obter backlinks |
| Core Web Vitals ruim | Otimizar imagens, reduzir JS/CSS |
