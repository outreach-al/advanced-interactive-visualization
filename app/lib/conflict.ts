import { interpolateLab } from 'd3';

export interface ConflictCountry {
  iso3: string;
  country: string;
  region: string;
  scores: Record<string, number>;
  latest: number;
  delta: number;
}

export interface ConflictFile {
  years: number[];
  countries: ConflictCountry[];
}

// Sequential paper → deep-red ramp for the 0–10 conflict probability score.
const ramp = (t: number) => interpolateLab('#efe8da', '#6d1410')(Math.max(0, Math.min(1, t)));
export const conflictColor = (score: number) => ramp(score / 10);
export const NO_DATA = '#e7e3da';
