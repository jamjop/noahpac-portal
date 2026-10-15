#!/usr/bin/env node
// Reads every facility JSON listed in antibiogram/data/manifest.json and
// checks whether the period end (Dec 31 of the period year) is more than
// STALE_THRESHOLD_DAYS ago.  Exits with code 1 if any facility is stale so
// that a GitHub Actions scheduled run fails and GitHub sends the maintainer
// an email notification.
//
// Antibiograms are annual and a facility's year-Y report is normally published
// during year Y+1, so data is expected to be up to ~12-15 months past its period
// end. The threshold is therefore 18 months: a full publication cycle was missed.
// (It was 60 days, which made this check permanently red.)
//
// A facility whose NEWEST PUBLISHED antibiogram is already older than the
// threshold (nothing newer exists upstream) can be listed in
// antibiogram/data/freshness-exceptions.json with a reason and an expiry date.
// An unexpired exception passes; once it expires the check fails again, so the
// question is re-asked instead of being silenced forever.
//
// Test hooks: NOAHPAC_ANTIBIOGRAM_DATA_DIR, NOAHPAC_FRESHNESS_NOW (YYYY-MM-DD).
'use strict';

const { readFileSync } = require('fs');
const { resolve, dirname } = require('path');

const DATA_DIR = process.env.NOAHPAC_ANTIBIOGRAM_DATA_DIR || resolve(__dirname, '..', 'antibiogram', 'data');
const STALE_THRESHOLD_DAYS = 548;

function periodEndDate(period) {
  // period is a year string like "2025" or possibly "2024-2025";
  // use the last 4-digit year found as the end year.
  const match = String(period).match(/\d{4}/g);
  if (!match) return null;
  const year = parseInt(match[match.length - 1], 10);
  return new Date(year, 11, 31); // Dec 31 of that year
}

const manifest = JSON.parse(readFileSync(resolve(DATA_DIR, 'manifest.json'), 'utf8'));
const now = process.env.NOAHPAC_FRESHNESS_NOW ? new Date(process.env.NOAHPAC_FRESHNESS_NOW + 'T00:00:00') : new Date();
let anyStale = false;

let exceptions = {};
try {
  exceptions = JSON.parse(readFileSync(resolve(DATA_DIR, 'freshness-exceptions.json'), 'utf8'));
} catch (e) {
  if (e.code !== 'ENOENT') {
    console.error(`  ERROR  freshness-exceptions.json is unreadable: ${e.message}`);
    anyStale = true;
  }
}

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
  const overdue = daysSinceEnd > STALE_THRESHOLD_DAYS;
  const exception = exceptions[id];
  const expires = exception && exception.expires ? new Date(exception.expires + 'T23:59:59') : null;
  const excused = overdue && expires && now <= expires && exception.reason;
  const label = !overdue ? '  ok ' : excused ? 'ACCEPT' : 'STALE';
  if (overdue && !excused) anyStale = true;

  console.log(`  ${label}  ${data.name} (${data.location}) — period ${data.period}, period end ${end.toISOString().slice(0, 10)}, ${daysSinceEnd} days ago`);
  if (excused) console.log(`          accepted until ${exception.expires}: ${exception.reason}`);
  else if (overdue && exception) console.log(`          exception EXPIRED or incomplete (${exception.expires || 'no expiry'}): re-verify upstream and renew or update the data`);
}

if (anyStale) {
  console.error('\n\u2716 One or more facilities have stale antibiogram data (> ' + STALE_THRESHOLD_DAYS + ' days past period end, no valid exception).');
  console.error('  Update the facility JSON files and re-run the import pipeline, or record a dated exception if nothing newer is published.');
  process.exit(1);
} else {
  console.log('\n\u2714 All facilities are within the freshness threshold.');
}
