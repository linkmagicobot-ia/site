const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== SEGURANÇA =====
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            scriptSrcAttr: ["'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://linkmagico.app.br"],
            mediaSrc: ["'self'", "https://*.google.com", "https://*.googleapis.com", "https://*.googleusercontent.com"],
            frameSrc: ["'self'", "https://www.youtube.com", "https://youtube.com", "https://www.youtube-nocookie.com", "https://drive.google.com", "https://*.google.com", "https://*.googleapis.com", "https://*.googleusercontent.com"]
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// ===== PERFORMANCE =====
app.use(compression());

// ===== CACHE ESTÁTICO =====
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '7d',
    etag: true,
    lastModified: true,
    redirect: false
}));

// ===== ROTAS =====
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ===== HEALTH CHECK =====
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ===== ROTAS LIMPAS — Onboarding (sem .html) =====
app.get('/BEMVINDO', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'BEMVINDO.html'));
});
app.get('/treinamento', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'treinamento.html'));
});

// ===== PÁGINAS SEO — Rotas limpas =====
app.get('/faq', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'faq.html'));
});
app.get('/como-funciona', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'como-funciona.html'));
});
app.get('/recursos', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'recursos.html'));
});
app.get('/integracoes', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'integracoes.html'));
});
app.get('/seguranca', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'seguranca.html'));
});
app.get('/changelog', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'changelog.html'));
});
app.get('/status', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'status.html'));
});
app.get('/roadmap', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'roadmap.html'));
});
app.get('/sobre', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'sobre.html'));
});
app.get('/docs', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'docs.html'));
});

// ===== PÁGINAS INSTITUCIONAIS =====
app.get('/politica-de-privacidade', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'politica-de-privacidade.html'));
});
app.get('/termos-de-uso', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'termos-de-uso.html'));
});
app.get('/lgpd', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'lgpd.html'));
});
app.get('/cookies', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'cookies.html'));
});

// ===== KNOWLEDGE HUB =====
app.get('/glossario', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'glossario.html'));
});
app.get('/glossario/:termo', (req, res) => {
    const termo = req.params.termo.replace(/[^a-z0-9-]/gi, '');
    const filePath = path.join(__dirname, 'public', 'glossario', termo + '.html');
    res.sendFile(filePath, (err) => {
        if (err) res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
    });
});

// ===== FERRAMENTAS =====
app.get('/ferramentas/calculadora-roi', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'ferramentas', 'calculadora-roi.html'));
});

// ===== LANDING PAGES POR SEGMENTO =====
const segmentos = ['clinicas', 'imobiliarias', 'ecommerce', 'restaurantes', 'infoprodutores'];
segmentos.forEach(seg => {
    app.get('/' + seg, (req, res) => {
        res.sendFile(path.join(__dirname, 'public', seg + '.html'));
    });
});

// ===== CLUSTER ASSETS (templates, fluxos, checklists, prompts, exemplos) =====
const clusterTypes = ['templates', 'fluxos', 'checklists', 'prompts', 'exemplos', 'integracoes'];
clusterTypes.forEach(type => {
    app.get('/' + type + '/:segmento', (req, res) => {
        const seg = req.params.segmento.replace(/[^a-z0-9-]/gi, '');
        const filePath = path.join(__dirname, 'public', type, seg + '.html');
        res.sendFile(filePath, (err) => {
            if (err) res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
        });
    });
});

// ===== BLOG — Rotas limpas sem .html =====
app.get('/blog', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'blog', 'index.html'));
});
app.get('/blog/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'blog', 'index.html'));
});
app.get('/blog/:slug', (req, res, next) => {
    const file = path.join(__dirname, 'public', 'blog', req.params.slug + '.html');
    res.sendFile(file, (err) => {
        if (err) next();
    });
});

// ===== SEO ADMIN (novas rotas — não impactam nenhuma rota existente) =====
app.get('/admin/seo', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin', 'seo.html'));
});

// IndexNow key verification (servido automaticamente pelo static se existir em public/)

// ===== SEO API ROUTES (SEOProvider v1) =====
app.use('/api/seo', require('./routes/seo'));
app.use('/api/seo/growth', require('./routes/seo-growth'));
app.use('/api/seo/gos', require('./routes/gos'));

// ===== FALLBACK 404 =====
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'), (err) => {
        if (err) {
            res.status(404).json({ error: 'Página não encontrada', status: 404 });
        }
    });
});

// ===== START =====
app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════╗
║  ⚡ LinkMágico Site — Online            ║
║  📍 http://localhost:${PORT}               ║
║  🔒 Helmet + HSTS + Compression         ║
╚══════════════════════════════════════════╝
    `);
});
