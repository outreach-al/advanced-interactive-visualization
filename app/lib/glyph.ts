import { interpolateLab } from 'd3';
import type { Country } from './types';
import { HAZARD_COLORS, PETAL_ORDER } from './palette';

// ─────────────────────────────────────────────────────────────────────────────
// Petal glyph geometry.
//
// Seven petals in a FIXED angular order (PETAL_ORDER), petal 0 at the top, going
// clockwise. Two channels carried on one mark:
//   • LENGTH     ← INFORM risk score 0..10   (the model's PREDICTION)
//   • SATURATION ← log-scaled EM-DAT deaths   (the observed REALITY)
// A pale, thinly-outlined petal therefore reads as "risk predicted, no deaths
// observed"; a long, deeply saturated petal as "predicted AND realized."
// ─────────────────────────────────────────────────────────────────────────────

export interface PetalRender {
  key: string;
  angle: number; // degrees, 0 = up
  d: string; // SVG path, drawn pointing up from centre (rotate via transform)
  fill: string;
  stroke: string;
  risk: number;
  deaths: number;
}

export interface GlyphRender {
  size: number;
  cx: number;
  cy: number;
  innerR: number;
  petals: PetalRender[];
}

// Tunables expressed as fractions of `size`, so the glyph is fully scalable.
const INNER_FRAC = 0.13; // radius of the central disc petals grow from
const MAX_FRAC = 0.45; // max tip radius at risk = 10
const HALF_W_FRAC = 0.082; // half-width of a petal at its waist

const RISK_MAX = 10;

// A near-paper tint each hazard hue fades toward at zero observed deaths.
const PALE = '#efece4';

export function buildGlyph(
  country: Country,
  size: number,
  maxLogDeaths: number,
): GlyphRender {
  const cx = size / 2;
  const cy = size / 2;
  const innerR = size * INNER_FRAC;
  const maxR = size * MAX_FRAC;
  const halfW = size * HALF_W_FRAC;
  const span = maxR - innerR;

  // Index hazards by key so we honour PETAL_ORDER regardless of source order.
  const byKey = new Map(country.hazards.map((h) => [h.key, h]));

  const petals: PetalRender[] = PETAL_ORDER.map((key, i) => {
    const h = byKey.get(key);
    const risk = h?.risk ?? 0;
    const deaths = h?.deaths ?? 0;
    const logD = h?.logDeaths ?? 0;

    const L = (Math.max(0, Math.min(RISK_MAX, risk)) / RISK_MAX) * span;
    const angle = (360 / PETAL_ORDER.length) * i;

    const base = HAZARD_COLORS[key];
    const t = maxLogDeaths > 0 ? Math.min(1, logD / maxLogDeaths) : 0;
    const fill = interpolateLab(PALE, base)(t);

    // Symmetric leaf, drawn pointing up (−y) from the central disc.
    const tip = cy - (innerR + L);
    const w1 = cy - (innerR + L * 0.35);
    const w2 = cy - (innerR + L * 0.78);
    const d =
      `M ${cx},${cy - innerR} ` +
      `C ${cx + halfW},${w1} ${cx + halfW},${w2} ${cx},${tip} ` +
      `C ${cx - halfW},${w2} ${cx - halfW},${w1} ${cx},${cy - innerR} Z`;

    return { key, angle, d, fill, stroke: base, risk, deaths };
  });

  return { size, cx, cy, innerR, petals };
}

// Global max of any single hazard's logDeaths — the saturation normaliser.
// Keeps one country's heaviest petal comparable to another's across the grid.
export function maxHazardLogDeaths(countries: Country[]): number {
  let m = 0;
  for (const c of countries)
    for (const h of c.hazards) if (h.logDeaths > m) m = h.logDeaths;
  return m;
}
