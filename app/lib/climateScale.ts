import { scaleLinear } from 'd3';

// Shared diverging temperature ramp: cold (blue) → neutral gray at the
// 1951-1980 baseline (0) → warm (deep red). Two hues, neutral midpoint.
// Used by every chart on the climate page so they read as one system.
export const RAMP_DOMAIN = [-0.8, -0.3, 0, 0.5, 1.0, 1.5];
export const RAMP_RANGE = ['#2f3a9e', '#6f86d6', '#dcd8ce', '#eaa15a', '#cf5a3c', '#8f1a24'];

export const tempColor = scaleLinear<string>().domain(RAMP_DOMAIN).range(RAMP_RANGE).clamp(true);

// Fraction (0..1) of a value along the ramp domain — handy for gradient stops.
export const rampFrac = (v: number) =>
  (v - RAMP_DOMAIN[0]) / (RAMP_DOMAIN[RAMP_DOMAIN.length - 1] - RAMP_DOMAIN[0]);

export const fmtAnomaly = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}`;
