# Bing Webmaster Tools — Guia de Configuração

> LinkMágico — site.linkmagico.app.br  
> Última atualização: Junho 2026

---

## 1. Cadastro

1. Acesse [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. Faça login com conta Microsoft, Google ou Facebook
3. Clique em **Adicionar um site**

---

## 2. Importar do Google Search Console (Recomendado)

Se já configurou o Google Search Console:

1. Clique em **Importar do Google Search Console**
2. Autorize com sua conta Google
3. Selecione o site `site.linkmagico.app.br`
4. Clique em **Importar**
5. O Bing importa verificação, sitemap e configurações automaticamente

**Vantagem:** Configuração em 1 clique.

---

## 3. Verificação Manual

Caso prefira verificação manual:

### DNS CNAME

1. Copie o registro CNAME fornecido pelo Bing
2. Adicione no DNS:
   ```
   Tipo: CNAME
   Nome: [código fornecido]
   Valor: verify.bing.com
   TTL: 3600
   ```

### Meta Tag

1. Adicione ao `<head>` do `public/index.html`:
   ```html
   <meta name="msvalidate.01" content="XXXXXXXXXXXXXXXX">
   ```

### Arquivo XML

1. Baixe o arquivo XML fornecido
2. Coloque em `public/BingSiteAuth.xml`

---

## 4. Envio do Sitemap

1. Menu lateral → **Sitemaps**
2. Adicione:
   ```
   https://site.linkmagico.app.br/sitemap.xml
   ```
3. Clique em **Enviar**
4. Aguarde processamento

---

## 5. IndexNow

O Bing é o principal patrocinador do protocolo IndexNow. Com ele, páginas novas ou atualizadas são notificadas instantaneamente.

### Configuração no LinkMágico

O módulo `seo/indexnow.js` já está pronto. Para ativar:

```bash
# 1. Gerar chave
node seo/indexnow.js generate-key

# 2. Configurar variável de ambiente (Render.com)
INDEXNOW_KEY=<chave gerada>

# 3. Fazer deploy (o arquivo da chave será acessível em /chave.txt)

# 4. Enviar todas as URLs
node seo/indexnow.js all

# 5. Enviar URL individual (após publicar novo conteúdo)
node seo/indexnow.js submit https://site.linkmagico.app.br/novo-artigo
```

### Como funciona

```
Você publica → IndexNow notifica → Bing indexa em minutos (vs dias/semanas)
```

### Motores suportados

| Motor | Suporte IndexNow |
|---|---|
| Bing | ✅ Sim |
| Yandex | ✅ Sim |
| Naver | ✅ Sim |
| Seznam | ✅ Sim |
| Google | ❌ Não (usa próprio crawl) |

---

## 6. Ferramentas Disponíveis

### SEO Reports

Relatórios automáticos com recomendações de SEO para cada página. Verifica:
- Title tags
- Meta descriptions
- Headers (H1, H2)
- Imagens sem alt
- Links quebrados

### Site Scan

Varredura completa do site identificando problemas técnicos:
- Erros 404
- Redirects em cadeia
- Páginas lentas
- Conteúdo duplicado

### URL Inspection

Verifica o status de indexação de URLs específicas:
- Última vez que o Bingbot acessou
- Status de indexação
- Erros encontrados

### Backlinks

Mostra quais sites externos linkam para o LinkMágico:
- Total de backlinks
- Domínios referentes
- Páginas mais linkadas
- Texto âncora

---

## 7. Checklist

- [ ] Criar conta no Bing Webmaster Tools
- [ ] Importar do Google Search Console (ou verificar manualmente)
- [ ] Enviar sitemap: `https://site.linkmagico.app.br/sitemap.xml`
- [ ] Verificar processamento do sitemap
- [ ] Configurar IndexNow:
  - [ ] Gerar chave: `node seo/indexnow.js generate-key`
  - [ ] Configurar `INDEXNOW_KEY` no ambiente
  - [ ] Fazer deploy
  - [ ] Enviar URLs: `node seo/indexnow.js all`
- [ ] Executar Site Scan
- [ ] Revisar SEO Reports
- [ ] Verificar backlinks
- [ ] Configurar API Key (opcional):
  - [ ] Settings → API Access → Generate Key
  - [ ] Configurar `BING_WEBMASTER_API_KEY`

---

## 8. API Integration

O módulo `seo/bing/index.js` está preparado para integração com a API:

```bash
# Configurar chave
export BING_WEBMASTER_API_KEY=sua_chave

# Verificar status
node seo/bing/index.js
```

Funções disponíveis quando configurado:
- `fetchPerformance()` — Desempenho de busca
- `fetchIndexedPages()` — Páginas indexadas
- `fetchKeywords()` — Palavras-chave
- `fetchClicks()` — Cliques por página
- `fetchBacklinks()` — Backlinks
