import type { Country, EventsFile, HazardReg } from './types';

// Recompute residuals for a time window — the same OLS-residual math as
// scripts/build-data.mjs, but over deaths summed only within [yMin, yMax].
// INFORM risk scores are static, so only the death-derived fields change.

function olsFit(pts: { x: number; y: number }[]): { slope: number; intercept: number; n: number } {
  const n = pts.length;
  if (n === 0) return { slope: 0, intercept: 0, n: 0 };
  const mx = pts.reduce((s, d) => s + d.x, 0) / n;
  const my = pts.reduce((s, d) => s + d.y, 0) / n;
  let sxy = 0;
  let sxx = 0;
  for (const d of pts) {
    sxy += (d.x - mx) * (d.y - my);
    sxx += (d.x - mx) * (d.x - mx);
  }
  const slope = sxx > 0 ? sxy / sxx : 0;
  return { slope, intercept: my - slope * mx, n };
}

export interface RecomputeResult {
  countries: Country[];
  regression: { slope: number; intercept: number; n: number };
  hazardRegression: Record<string, HazardReg>;
}

export function recomputeForWindow(
  base: Country[],
  events: EventsFile,
  yMin: number,
  yMax: number,
): RecomputeResult {
  const petalKeys = base[0]?.hazards.map((h) => h.key) ?? [];

  // Windowed total + per-petal deaths, summed from events.
  const totalDeaths = new Map<string, number>();
  const petalDeaths = new Map<string, Map<string, number>>();
  for (const c of base) {
    const evs = events[c.iso3] ?? [];
    let total = 0;
    const pmap = new Map<string, number>();
    for (const e of evs) {
      if (e.year < yMin || e.year > yMax) continue;
      total += e.deaths;
      if (e.petalKey) pmap.set(e.petalKey, (pmap.get(e.petalKey) ?? 0) + e.deaths);
    }
    totalDeaths.set(c.iso3, total);
    petalDeaths.set(c.iso3, pmap);
  }

  // Global OLS: log10(total+1) ~ informRisk.
  const regression = olsFit(
    base
      .filter((c) => c.informRisk > 0)
      .map((c) => ({ x: c.informRisk, y: Math.log10((totalDeaths.get(c.iso3) ?? 0) + 1) })),
  );

  // Per-hazard OLS.
  const hazardRegression: Record<string, HazardReg> = {};
  for (const key of petalKeys) {
    const fit = olsFit(
      base.map((c) => ({
        x: c.hazards.find((h) => h.key === key)?.risk ?? 0,
        y: Math.log10((petalDeaths.get(c.iso3)?.get(key) ?? 0) + 1),
      })),
    );
    const hasDeaths = base.some((c) => (petalDeaths.get(c.iso3)?.get(key) ?? 0) > 0);
    hazardRegression[key] = { ...fit, hasDeaths };
  }

  const countries: Country[] = base.map((c) => {
    const total = totalDeaths.get(c.iso3) ?? 0;
    const logDeaths = Math.log10(total + 1);
    const predicted = regression.intercept + regression.slope * c.informRisk;
    const hazards = c.hazards.map((h) => {
      const deaths = petalDeaths.get(c.iso3)?.get(h.key) ?? 0;
      const logD = Math.log10(deaths + 1);
      const hr = hazardRegression[h.key];
      const predLog = hr.intercept + hr.slope * h.risk;
      return { ...h, deaths, logDeaths: logD, predictedLogDeaths: predLog, residual: logD - predLog };
    });
    return {
      ...c,
      totalDeaths: total,
      logDeaths,
      predictedLogDeaths: predicted,
      residual: logDeaths - predicted,
      hazards,
    };
  });

  countries.sort((a, b) => b.residual - a.residual);
  return { countries, regression, hazardRegression };
}
