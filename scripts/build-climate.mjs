/**
 * build-climate.mjs — Climate Spiral preprocessing.
 *
 * Reads NASA GISTEMP v4 global land-ocean temperature anomalies and emits the
 * one JSON file the client reads:
 *
 *   data/gistemp_global.csv  ──►  public/data/climate.json
 *
 * The source table gives monthly and annual anomalies in degrees Celsius,
 * relative to the 1951-1980 average. Missing cells (future/incomplete months)
 * are written as the string "***"; we carry those through as null.
 *
 * Run by `npm run data`, and automatically by `predev` / `prebuild`.
 * Dependency-free on purpose: it runs cleanly before `npm install`.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const p = (...s) => resolve(ROOT, ...s);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// GISTEMP writes ".19", "-.19", "1.04" and "***" (missing). parseFloat handles
// the leading-dot forms; "***"/"" become null.
const cell = (v) => {
  const s = (v ?? '').trim();
  if (!s || s === '***') return null;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
};

const lines = readFileSync(p('data/gistemp_global.csv'), 'utf8').split(/\r?\n/);
// line 0 is the title banner ("Land-Ocean: Global Means"); line 1 is the header.
const header = lines[1].split(',');
const idx = Object.fromEntries(header.map((h, i) => [h.trim(), i]));

const years = [];
let globalMin = Infinity;
let globalMax = -Infinity;

for (let i = 2; i < lines.length; i++) {
  const row = lines[i].split(',');
  if (row.length < 13) continue; // blank or short trailing line
  const year = parseInt(row[idx.Year], 10);
  if (!Number.isFinite(year)) continue;

  const monthly = MONTHS.map((m) => cell(row[idx[m]]));
  const annual = cell(row[idx['J-D']]); // Jan-Dec mean; null until a year completes

  for (const v of monthly) {
    if (v === null) continue;
    if (v < globalMin) globalMin = v;
    if (v > globalMax) globalMax = v;
  }
  years.push({ year, monthly, annual });
}

// Latest fully-reported annual figure, for headline copy on the page.
const withAnnual = years.filter((y) => y.annual !== null);
const latest = withAnnual[withAnnual.length - 1];

const out = {
  source: 'NASA GISTEMP v4 (GLB.Ts+dSST)',
  baseline: '1951-1980',
  unit: 'C',
  months: MONTHS,
  range: { min: globalMin, max: globalMax },
  latestAnnual: latest ? { year: latest.year, anomaly: latest.annual } : null,
  years,
};

mkdirSync(p('public/data'), { recursive: true });
writeFileSync(p('public/data/climate.json'), JSON.stringify(out));

console.log('Climate Spiral — data build');
console.log(`  years:            ${years[0].year}-${years[years.length - 1].year}  (${years.length} rows)`);
console.log(`  monthly range:    ${globalMin.toFixed(2)} to +${globalMax.toFixed(2)} C`);
console.log(`  latest annual:    ${latest.year}  +${latest.annual.toFixed(2)} C`);
console.log('  wrote public/data/climate.json');
