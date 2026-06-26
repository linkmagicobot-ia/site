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
    lastModified: true
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

// ===== BLOG — Rotas limpas sem .html =====
app.get('/blog', (req, res) => {
    res.redirect(301, '/blog/');
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
