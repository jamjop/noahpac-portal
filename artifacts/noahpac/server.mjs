import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = join(__dirname, '..', '..');
const PORT = parseInt(process.env.PORT || '3000', 10);

const app = express();

// sw.js and manifest.json must never be cached — the browser needs to fetch
// the latest version on every load so service worker updates propagate.
app.use((req, res, next) => {
  if (req.path === '/sw.js' || req.path === '/manifest.json') {
    res.set('Cache-Control', 'no-store');
  }
  next();
});

const staticOpts = {
  extensions: ['html'],
  index: 'index.html',
};

app.use(express.static(SITE_ROOT, staticOpts));

app.use((_req, res) => {
  res.status(404).sendFile(join(SITE_ROOT, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Clinical Reference Tools serving ${SITE_ROOT} on port ${PORT}`);
});
