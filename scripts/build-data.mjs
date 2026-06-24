/**
 * build-data.mjs — Risk Fingerprints preprocessing.
 *
 * Reads the two A2 source CSVs and emits the two JSON files the client reads:
 *
 *   data/joined_summary.csv  +  data/emdat_events.csv
 *        │
 *        ├──► public/data/countries.json  (one object per country)
 *        └──► public/data/events.json     (events grouped by iso3)
 *
 * Run by `npm run data`, and automatically by `predev` / `prebuild`.
 * Dependency-free on purpose: it runs cleanly before `npm install`.
 *
 * Key derived quantities:
 *  - per-hazard deaths, summed from EM-DAT events into the 7 INFORM petals
 *  - signed residual = log10(total_deaths+1) − OLS prediction from inform_risk
 *    (the sort key that IS the visualization)
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const p = (...s) => resolve(ROOT, ...s);

// ─────────────────────────────────────────────────────────────────────────────
// Minimal RFC-4180 CSV parser (handles quoted fields with embedded commas).
// ─────────────────────────────────────────────────────────────────────────────
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (c === '\r') {
      // swallow; \n handles the row break
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  const header = rows.shift();
  return rows
    .filter((r) => r.length === header.length && r.some((v) => v !== ''))
    .map((r) => Object.fromEntries(header.map((h, idx) => [h, r[idx]])));
}

const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

// ─────────────────────────────────────────────────────────────────────────────
// Petal definitions — fixed angular order. The SAME hazard sits at the SAME
// angle across every glyph, which is what makes fingerprints comparable.
//   length  ← INFORM risk score column (0..10)
//   sat     ← log-scaled summed EM-DAT deaths from the mapped hazard types
// ─────────────────────────────────────────────────────────────────────────────
// EM-DAT hazard_type values feeding each petal's deaths channel. "Coastal flood"
// and "Tsunami" are split out of their parent Disaster Type in the preprocessing
// (see scripts/regen note / preprocess.py), so those petals now carry real deaths.
const PETALS = [
  { key: 'flood_river', label: 'River flood', riskCol: 'risk_flood_river', emdat: ['Flood', 'Glacial lake outburst flood'] },
  { key: 'flood_coastal', label: 'Coastal flood', riskCol: 'risk_flood_coastal', emdat: ['Coastal flood'] },
  { key: 'earthquake', label: 'Earthquake', riskCol: 'risk_earthquake', emdat: ['Earthquake'] },
  { key: 'tropical_cyclone', label: 'Tropical cyclone', riskCol: 'risk_tropical_cyclone', emdat: ['Storm'] },
  { key: 'drought', label: 'Drought', riskCol: 'risk_drought', emdat: ['Drought'] },
  { key: 'tsunami', label: 'Tsunami', riskCol: 'risk_tsunami', emdat: ['Tsunami'] },
  { key: 'epidemic', label: 'Epidemic', riskCol: 'risk_epidemic', emdat: ['Epidemic'] },
];

// EM-DAT hazard_type → petal key (for events: assign a petal, or null = "Other").
const HAZARD_TO_PETAL = {};
for (const petal of PETALS) {
  for (const h of petal.emdat) HAZARD_TO_PETAL[h] = petal.key;
}

// 3 INFORM countries with zero EM-DAT events (so no name/region from events).
const FALLBACK_META = {
  BHR: { country: 'Bahrain', region: 'Asia' },
  BRN: { country: 'Brunei Darussalam', region: 'Asia' },
  NRU: { country: 'Nauru', region: 'Oceania' },
};

// ─────────────────────────────────────────────────────────────────────────────
// Load sources
// ─────────────────────────────────────────────────────────────────────────────
const summary = parseCSV(readFileSync(p('data/joined_summary.csv'), 'utf8'));
const events = parseCSV(readFileSync(p('data/emdat_events.csv'), 'utf8'));

// iso3 → {country, region} lookup from events
const meta = {};
for (const e of events) {
  if (!meta[e.iso3] && e.country) meta[e.iso3] = { country: e.country, region: e.region };
}

// iso3 → per-petal summed deaths from events
const hazardDeaths = {};
for (const e of events) {
  const petal = HAZARD_TO_PETAL[e.hazard_type];
  if (!petal) continue;
  (hazardDeaths[e.iso3] ||= {});
  hazardDeaths[e.iso3][petal] = (hazardDeaths[e.iso3][petal] || 0) + num(e.deaths);
}

// ─────────────────────────────────────────────────────────────────────────────
// OLS helper:  y ~ x  →  { slope, intercept }.  Same residual logic everywhere:
// residual = actual − (intercept + slope·x). Used once globally (total deaths vs
// inform_risk) and once per hazard (hazard deaths vs that hazard's risk score).
// ─────────────────────────────────────────────────────────────────────────────
function olsFit(pts) {
  const n = pts.length;
  if (n === 0) return { slope: 0, intercept: 0, n: 0 };
  const mx = pts.reduce((s, d) => s + d.x, 0) / n;
  const my = pts.reduce((s, d) => s + d.y, 0) / n;
  let sxy = 0,
    sxx = 0;
  for (const d of pts) {
    sxy += (d.x - mx) * (d.y - my);
    sxx += (d.x - mx) * (d.x - mx);
  }
  const slope = sxx > 0 ? sxy / sxx : 0; // flat fit when x has no variance
  return { slope, intercept: my - slope * mx, n };
}

// Global: log10(total_deaths+1) ~ inform_risk
const { slope, intercept, n } = olsFit(
  summary
    .map((r) => ({ x: num(r.inform_risk), y: Math.log10(num(r.total_deaths) + 1) }))
    .filter((d) => Number.isFinite(d.x) && d.x > 0),
);

// Per-hazard: log10(hazard_deaths+1) ~ hazard_risk, one fit per petal. Coastal
// flood and tsunami have no observed deaths here, so their fit is flat (all
// residuals ≈ 0) — honest, and the UI marks them as non-sortable.
const hazardReg = {};
for (const petal of PETALS) {
  hazardReg[petal.key] = olsFit(
    summary.map((r) => ({
      x: num(r[petal.riskCol]),
      y: Math.log10((hazardDeaths[r.iso3]?.[petal.key] || 0) + 1),
    })),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Build countries.json
// ─────────────────────────────────────────────────────────────────────────────
const countries = summary.map((r) => {
  const iso3 = r.iso3;
  const m = meta[iso3] || FALLBACK_META[iso3] || { country: iso3, region: 'Other' };
  const informRisk = num(r.inform_risk);
  const totalDeaths = num(r.total_deaths);
  const logDeaths = Math.log10(totalDeaths + 1);
  const predicted = intercept + slope * informRisk;
  const residual = logDeaths - predicted;

  const hazards = PETALS.map((petal) => {
    const deaths = hazardDeaths[iso3]?.[petal.key] || 0;
    const risk = num(r[petal.riskCol]);
    const logD = Math.log10(deaths + 1);
    const reg = hazardReg[petal.key];
    const predLogDeaths = reg.intercept + reg.slope * risk;
    return {
      key: petal.key,
      label: petal.label,
      risk, // petal length source (0..10)
      deaths, // petal saturation source (raw)
      logDeaths: logD,
      predictedLogDeaths: predLogDeaths,
      residual: logD - predLogDeaths, // per-hazard model error (T1)
    };
  });

  return {
    iso3,
    country: m.country,
    region: m.region,
    informRisk,
    hazardExposure: num(r.hazard_exposure),
    vulnerability: num(r.vulnerability),
    lackOfCoping: num(r.lack_of_coping_capacity),
    totalEvents: num(r.total_events),
    totalDeaths,
    totalAffected: num(r.total_affected),
    totalDamagesMusd: num(r.total_damages_musd),
    logDeaths,
    predictedLogDeaths: predicted,
    residual,
    hazards,
  };
});

// Sort by signed residual, descending: worse-than-predicted at the top.
countries.sort((a, b) => b.residual - a.residual);

// ─────────────────────────────────────────────────────────────────────────────
// Build events.json — grouped by iso3, sorted by year. Every event carries a
// petalKey (null = "Other") so the timeline can color consistently with petals.
// ─────────────────────────────────────────────────────────────────────────────
const eventsByIso = {};
for (const e of events) {
  if (!e.iso3) continue;
  (eventsByIso[e.iso3] ||= []).push({
    year: num(e.year),
    hazard_type: e.hazard_type,
    petalKey: HAZARD_TO_PETAL[e.hazard_type] || null,
    deaths: num(e.deaths),
    affected: num(e.affected),
    damages_musd: num(e.damages_musd),
  });
}
for (const iso3 of Object.keys(eventsByIso)) {
  eventsByIso[iso3].sort((a, b) => a.year - b.year);
}

// ─────────────────────────────────────────────────────────────────────────────
// Emit + report
// ─────────────────────────────────────────────────────────────────────────────
const out = {
  generatedFrom: { summary: 'data/joined_summary.csv', events: 'data/emdat_events.csv' },
  regression: { slope, intercept, n },
  // Per-hazard regression + whether the hazard has any observed deaths (i.e. is
  // meaningful to sort/scatter by — false for coastal flood & tsunami here).
  hazardRegression: Object.fromEntries(
    PETALS.map((petal) => {
      const hasDeaths = countries.some((c) => (c.hazards.find((h) => h.key === petal.key)?.deaths ?? 0) > 0);
      return [petal.key, { ...hazardReg[petal.key], hasDeaths }];
    }),
  ),
  petals: PETALS.map(({ key, label }) => ({ key, label })),
  countries,
};

mkdirSync(p('public/data'), { recursive: true });
writeFileSync(p('public/data/countries.json'), JSON.stringify(out));
writeFileSync(p('public/data/events.json'), JSON.stringify(eventsByIso));

console.log('Risk Fingerprints — data build');
console.log(`  countries:        ${countries.length}`);
console.log(`  events:           ${events.length}  (${Object.keys(eventsByIso).length} countries)`);
console.log(`  OLS:              log10(deaths+1) = ${intercept.toFixed(3)} + ${slope.toFixed(3)}·inform_risk   (n=${n})`);
console.log(`  most under-pred:  ${countries[0].iso3} (${countries[0].country})  residual +${countries[0].residual.toFixed(2)}`);
console.log(`  most over-pred:   ${countries[countries.length - 1].iso3} (${countries[countries.length - 1].country})  residual ${countries[countries.length - 1].residual.toFixed(2)}`);
console.log('  wrote public/data/countries.json + public/data/events.json');
