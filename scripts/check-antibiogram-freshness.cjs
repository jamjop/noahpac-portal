#!/usr/bin/env node
// Reads every facility JSON listed in antibiogram/data/manifest.json and
// checks whether the period end (Dec 31 of the period year) is more than
// STALE_THRESHOLD_DAYS ago.  Exits with code 1 if any facility is stale so
// that a GitHub Actions scheduled run fails and GitHub sends the maintainer
// an email notification.
'use strict';

const { readFileSync } = require('fs');
const { resolve, dirname } = require('path');

const DATA_DIR = resolve(__dirname, '..', 'antibiogram', 'data');
const STALE_THRESHOLD_DAYS = 60;

function periodEndDate(period) {
  // period is a year string like "2025" or possibly "2024-2025";
  // use the last 4-digit year found as the end year.
  const match = String(period).match(/\d{4}/g);
  if (!match) return null;
  const year = parseInt(match[match.length - 1], 10);
  return new Date(year, 11, 31); // Dec 31 of that year
}

const manifest = JSON.parse(readFileSync(resolve(DATA_DIR, 'manifest.json'), 'utf8'));
const now = new Date();
let anyStale = false;

console.log(`Antibiogram freshness check — ${now.toISOString()}`);
console.log(`Stale threshold: > ${STALE_THRESHOLD_DAYS} days past period end (Dec 31 of period year)\n`);

for (const id of manifest.facilities) {
  const filePath = resolve(DATA_DIR, `${id}.json`);
  let data;
  try {
    data = JSON.parse(readFileSync(filePath, 'utf8'));
  } catch (e) {
    console.error(`  ERROR  ${id}: could not read file — ${e.message}`);
    anyStale = true;
    continue;
  }

  const end = periodEndDate(data.period);
  if (!end) {
    console.error(`  ERROR  ${id} (${data.name}): unrecognised period format "${data.period}"`);
    anyStale = true;
    continue;
  }

  const daysSinceEnd = Math.floor((now - end) / (1000 * 60 * 60 * 24));
  const label = daysSinceEnd > STALE_THRESHOLD_DAYS ? 'STALE' : '  ok ';
  if (daysSinceEnd > STALE_THRESHOLD_DAYS) anyStale = true;

  console.log(`  ${label}  ${data.name} (${data.location}) — period ${data.period}, period end ${end.toISOString().slice(0, 10)}, ${daysSinceEnd} days ago`);
}

if (anyStale) {
  console.error('\n\u2716 One or more facilities have stale antibiogram data (> ' + STALE_THRESHOLD_DAYS + ' days past period end).');
  console.error('  Update the facility JSON files and re-run the import pipeline.');
  process.exit(1);
} else {
  console.log('\n\u2714 All facilities are within the freshness threshold.');
}
