// Shapes emitted by scripts/build-data.mjs and consumed by the views.

export interface Hazard {
  key: string; // petal key, e.g. "flood_river"
  label: string;
  risk: number; // INFORM risk score 0..10  → petal length
  deaths: number; // summed EM-DAT deaths     → petal saturation (raw)
  logDeaths: number; // log10(deaths + 1)
  predictedLogDeaths: number; // per-hazard OLS prediction
  residual: number; // per-hazard model error (actual − predicted)
}

export interface HazardReg {
  slope: number;
  intercept: number;
  n: number;
  hasDeaths: boolean; // false → no observed deaths, not meaningful to sort by
}

export interface Country {
  iso3: string;
  country: string;
  region: string;
  informRisk: number;
  hazardExposure: number;
  vulnerability: number;
  lackOfCoping: number;
  totalEvents: number;
  totalDeaths: number;
  totalAffected: number;
  totalDamagesMusd: number;
  logDeaths: number;
  predictedLogDeaths: number;
  residual: number; // log10(deaths+1) − predicted  → the sort key
  hazards: Hazard[];
}

export interface CountriesFile {
  generatedFrom: { summary: string; events: string };
  regression: { slope: number; intercept: number; n: number };
  hazardRegression: Record<string, HazardReg>;
  petals: { key: string; label: string }[];
  countries: Country[];
}

export interface DisasterEvent {
  year: number;
  hazard_type: string;
  petalKey: string | null;
  deaths: number;
  affected: number;
  damages_musd: number;
}

export type EventsFile = Record<string, DisasterEvent[]>;

// Selection state shared across all three views (Step 6 linking).
export interface Selection {
  hovered: string | null; // iso3 under the cursor (transient)
  selected: string | null; // iso3 clicked open in the timeline (persists)
  brushed: Set<string> | null; // iso3 set from a scatter brush, or null
}
