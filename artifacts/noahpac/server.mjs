import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = join(__dirname, '..', '..');
const PORT = parseInt(process.env.PORT || '3000', 10);

const app = express();

const staticOpts = {
  extensions: ['html'],
  index: 'index.html',
  ...(process.env.NODE_ENV !== 'production' && {
    setHeaders: (res) => {
      res.set('Cache-Control', 'no-store');
    },
  }),
};

app.use(express.static(SITE_ROOT, staticOpts));

app.use((_req, res) => {
  res.status(404).sendFile(join(SITE_ROOT, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Clinical Reference Tools serving ${SITE_ROOT} on port ${PORT}`);
});
