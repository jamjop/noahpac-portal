const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5000;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.ico':  'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.txt':  'text/plain',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff':  'font/woff',
};

const STALE_THRESHOLD_DAYS = 60;
const DATA_DIR = path.join(ROOT, 'antibiogram', 'data');

function periodEndDate(period) {
  // period is a year string like "2025" or possibly "2024-2025";
  // use the last 4-digit year found as the end year.
  const match = String(period).match(/\d{4}/g);
  if (!match) return null;
  const year = parseInt(match[match.length - 1], 10);
  return new Date(year, 11, 31); // Dec 31 of that year
}

function checkAntibiogramFreshness() {
  const manifestPath = path.join(DATA_DIR, 'manifest.json');
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (e) {
    return { ok: false, error: 'Could not read manifest.json: ' + e.message, facilities: [] };
  }

  const now = new Date();
  const facilities = [];
  let anyStale = false;

  for (const id of manifest.facilities) {
    const filePath = path.join(DATA_DIR, id + '.json');
    let data;
    try {
      data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
      facilities.push({ id, error: 'Could not read file: ' + e.message, stale: true });
      anyStale = true;
      continue;
    }

    const end = periodEndDate(data.period);
    if (!end) {
      facilities.push({ id, name: data.name, period: data.period, error: 'Unrecognised period format', stale: true });
      anyStale = true;
      continue;
    }

    const daysSinceEnd = Math.floor((now - end) / (1000 * 60 * 60 * 24));
    const stale = daysSinceEnd > STALE_THRESHOLD_DAYS;
    if (stale) anyStale = true;

    facilities.push({
      id,
      name: data.name,
      location: data.location,
      period: data.period,
      periodEnd: end.toISOString().slice(0, 10),
      daysSincePeriodEnd: daysSinceEnd,
      stale,
    });
  }

  return {
    ok: !anyStale,
    checkedAt: now.toISOString(),
    staleThresholdDays: STALE_THRESHOLD_DAYS,
    facilities,
  };
}

http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];

  if (urlPath === '/antibiogram-freshness') {
    const result = checkAntibiogramFreshness();
    const status = result.ok ? 200 : 503;
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result, null, 2));
    return;
  }

  if (urlPath === '/') urlPath = '/index.html';

  // Try exact file, then /index.html inside that directory
  let filePath = path.join(ROOT, urlPath);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(ROOT, urlPath.replace(/\/?$/, '/index.html'));
  }
  if (!fs.existsSync(filePath)) {
    res.writeHead(404); res.end('Not found'); return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const ct = MIME[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': ct });
  fs.createReadStream(filePath).pipe(res);
}).listen(PORT, () => console.log(`Serving on port ${PORT}`));
