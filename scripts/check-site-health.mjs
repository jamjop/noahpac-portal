#!/usr/bin/env node

import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MODE = process.argv.includes('--remote') ? 'remote' : 'local';
const BASE_URL = process.env.NOAHPAC_BASE_URL || 'https://www.noahpac.com';
const MAX_FRESHNESS_DAYS = Number(process.env.NOAHPAC_MAX_FRESHNESS_DAYS || 120);

const ROUTES = [
  '/', '/abx/', '/allergy/', '/als/', '/antibiogram/', '/anticoag/',
  '/calculators/', '/clinical-assistant/', '/ddx/', '/documents/', '/drugref/',
  '/empiric/', '/labs/', '/lookup/', '/naloxone/', '/opioids/', '/pals/',
  '/peds/', '/reportable/', '/screener/', '/sepsis/', '/steroids/',
  '/sti-guide/', '/tccc/', '/toxicology/', '/vaccines/', '/wound/',
];

const REMOVED_V2 = [
  'abx2', 'als2', 'anticoag2', 'calculators2', 'ddx2', 'empiric2', 'labs2',
  'naloxone2', 'pals2', 'sepsis2', 'steroids2', 'tccc2', 'toxicology2', 'vaccines2',
];

const FRESHNESS_ROUTES = [
  'abx', 'allergy', 'als', 'antibiogram', 'anticoag', 'calculators', 'naloxone',
  'opioids', 'pals', 'peds', 'reportable', 'sepsis', 'steroids', 'sti-guide',
  'tccc', 'toxicology', 'vaccines', 'wound',
];

const EXTERNAL_LINKS = [
  'https://www.uptodate.com/',
  'https://www.droracle.ai/',
  'https://humanatlas.io/',
  'https://www.cdc.gov/std/treatment-guidelines/',
  'https://www.orthoinfo.org/recovery/rotator-cuff-and-shoulder-conditioning-program/',
  'https://aims.uw.edu/resource/generalized-anxiety-disorder-subscale-gad-7/',
  'https://www.aapcc.org/',
  'https://www.acmt.net/',
  'https://www.samhsa.gov/find-help/national-helpline',
  'https://www.cdc.gov/overdose-prevention/',
];

const API_CHECKS = [
  ['openFDA drug labels', 'https://api.fda.gov/drug/label.json?limit=1'],
  ['NLM Clinical Tables', 'https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search?terms=asthma&maxList=1'],
];

let failures = 0;
let warnings = 0;

function pass(message) { console.log(`PASS  ${message}`); }
function warn(message) { warnings += 1; console.warn(`WARN  ${message}`); }
function fail(message) { failures += 1; console.error(`FAIL  ${message}`); }

async function exists(path) {
  try { await access(path, constants.F_OK); return true; } catch { return false; }
}

function localPathForUrl(value) {
  const clean = value.split('#')[0].split('?')[0];
  if (!clean.startsWith('/') || clean.startsWith('//')) return null;
  if (clean === '/') return join(ROOT, 'index.html');
  return clean.endsWith('/') ? join(ROOT, clean, 'index.html') : join(ROOT, clean);
}

async function checkLocal() {
  const pages = ROUTES.map((route) => route === '/' ? join(ROOT, 'index.html') : join(ROOT, route, 'index.html'));
  for (const page of pages) {
    if (await exists(page)) pass(`page exists: ${page.slice(ROOT.length + 1)}`);
    else fail(`missing production page: ${page.slice(ROOT.length + 1)}`);
  }

  for (const directory of REMOVED_V2) {
    if (await exists(join(ROOT, directory))) fail(`removed V2 directory returned: ${directory}/`);
  }

  const checked = new Set();
  for (const page of pages) {
    if (!(await exists(page))) continue;
    const html = await readFile(page, 'utf8');
    for (const match of html.matchAll(/(?:href|src)=["']([^"']+)["']/g)) {
      const value = match[1];
      if (/^(?:https?:|mailto:|tel:|data:|javascript:|#)/.test(value)) continue;
      const candidate = localPathForUrl(value);
      if (!candidate || checked.has(candidate)) continue;
      checked.add(candidate);
      if (!(await exists(candidate))) fail(`broken internal reference in ${page.slice(ROOT.length + 1)}: ${value}`);
    }
  }
  if (failures === 0) pass(`${checked.size} unique internal references resolve`);
}

async function request(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: { 'user-agent': 'noahpac-site-health/1.0', ...(options.headers || {}) },
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function checkRemote() {
  for (const route of ROUTES) {
    try {
      const response = await request(`${BASE_URL}${route}`, { redirect: 'manual' });
      const expected = route === '/clinical-assistant/' ? response.status >= 300 && response.status < 400 : response.status === 200;
      if (expected) pass(`${route} returned ${response.status}`);
      else fail(`${route} returned unexpected status ${response.status}`);
      await response.body?.cancel();
    } catch (error) {
      fail(`${route} request failed: ${error.message}`);
    }
  }

  try {
    const response = await request(`${BASE_URL}/`, { redirect: 'manual' });
    const required = [
      'strict-transport-security', 'content-security-policy', 'x-content-type-options',
      'referrer-policy', 'permissions-policy',
    ];
    for (const header of required) {
      if (response.headers.has(header)) pass(`security header present: ${header}`);
      else fail(`missing security header: ${header}`);
    }
    const csp = response.headers.get('content-security-policy') || '';
    if (csp.includes("object-src 'none'")) pass("CSP includes object-src 'none'");
    else fail("CSP is missing object-src 'none'");
    for (const directive of ["base-uri 'self'", "form-action 'self'"]) {
      if (csp.includes(directive)) pass(`CSP includes ${directive}`);
      else warn(`CSP is missing recommended directive ${directive}`);
    }
    await response.body?.cancel();
  } catch (error) {
    fail(`security-header check failed: ${error.message}`);
  }

  for (const [name, url] of API_CHECKS) {
    try {
      const response = await request(url);
      if (response.ok) pass(`${name} API returned ${response.status}`);
      else fail(`${name} API returned ${response.status}`);
      await response.body?.cancel();
    } catch (error) {
      fail(`${name} API failed: ${error.message}`);
    }
  }

  for (const url of EXTERNAL_LINKS) {
    try {
      let response = await request(url, { method: 'HEAD', redirect: 'follow' });
      if (response.status === 405) response = await request(url, { method: 'GET', redirect: 'follow' });
      if (response.status === 404 || response.status === 410 || response.status >= 500) fail(`external link returned ${response.status}: ${url}`);
      else pass(`external link reachable (${response.status}): ${url}`);
      await response.body?.cancel();
    } catch (error) {
      warn(`external link could not be verified this run: ${url} (${error.message})`);
    }
  }

  const today = new Date();
  for (const route of FRESHNESS_ROUTES) {
    try {
      const response = await request(`${BASE_URL}/${route}/last_checked.json`);
      if (!response.ok) { warn(`${route} has no public freshness metadata (${response.status})`); continue; }
      const data = await response.json();
      const checked = new Date(`${data.date}T00:00:00Z`);
      const age = Math.floor((today - checked) / 86_400_000);
      if (!Number.isFinite(age)) fail(`${route} has an invalid freshness date`);
      else if (age > MAX_FRESHNESS_DAYS) fail(`${route} review is ${age} days old (limit ${MAX_FRESHNESS_DAYS})`);
      else pass(`${route} review age is ${age} days`);
      if (data.status === 'error') warn(`${route} last update check reported an error`);
    } catch (error) {
      fail(`${route} freshness check failed: ${error.message}`);
    }
  }
}

console.log(`Noah PA-C site health (${MODE})`);
if (MODE === 'remote') await checkRemote();
else await checkLocal();
console.log(`\nSummary: ${failures} failure(s), ${warnings} warning(s)`);
process.exitCode = failures === 0 ? 0 : 1;
