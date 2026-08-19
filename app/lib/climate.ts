'use client';

import { useEffect, useState } from 'react';

// Shape of public/data/climate.json (see scripts/build-climate.mjs).
export interface ClimateYear {
  year: number;
  monthly: (number | null)[]; // 12 entries, Jan..Dec; null = not yet reported
  annual: number | null; // Jan-Dec mean; null until the year completes
}

export interface ClimateFile {
  source: string;
  baseline: string; // e.g. "1951-1980"
  unit: string; // "C"
  months: string[];
  range: { min: number; max: number };
  latestAnnual: { year: number; anomaly: number } | null;
  years: ClimateYear[];
}

interface ClimateState {
  data: ClimateFile | null;
  loading: boolean;
  error: string | null;
}

// Fetches public/data/climate.json once. Static file → cached by the browser.
export function useClimate(): ClimateState {
  const [state, setState] = useState<ClimateState>({ data: null, loading: true, error: null });

  useEffect(() => {
    let alive = true;
    fetch('/data/climate.json')
      .then((r) => {
        if (!r.ok) throw new Error(`climate.json ${r.status}`);
        return r.json();
      })
      .then((data: ClimateFile) => alive && setState({ data, loading: false, error: null }))
      .catch((e) => alive && setState({ data: null, loading: false, error: String(e) }));
    return () => {
      alive = false;
    };
  }, []);

  return state;
}

// Mean of the reported months — used for the readout on an incomplete year.
export function reportedMean(y: ClimateYear): number | null {
  const vals = y.monthly.filter((v): v is number => v !== null);
  if (!vals.length) return null;
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}
