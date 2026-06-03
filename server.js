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
            mediaSrc: ["'self'"],
            frameSrc: ["'self'", "https://www.youtube.com", "https://youtube.com", "https://www.youtube-nocookie.com", "https://drive.google.com"]
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" }
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

// ===== FALLBACK 404 → HOME =====
app.use((req, res) => {
    res.status(302).redirect('/');
});

// ===== START =====
app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════╗
║  ⚡ LinkMágico Site — Online            ║
║  📍 http://localhost:${PORT}               ║
║  🔒 Helmet + Compression ativados       ║
╚══════════════════════════════════════════╝
    `);
});
