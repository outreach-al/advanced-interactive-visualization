import { scaleLinear } from 'd3';

export type Theme = 'light' | 'dark';

// Diverging temperature ramp: cold (blue) -> neutral at the 1951-1980 baseline
// (0) -> warm (deep red). The neutral midpoint sits close to the page surface
// so near-baseline years recede into the background; that is why it changes by
// theme. Endpoints are nudged brighter on dark so they hold up on a dark ground.
export const RAMP_DOMAIN = [-0.8, -0.3, 0, 0.5, 1.0, 1.5];

const RAMP_LIGHT = ['#2f3a9e', '#6f86d6', '#dcd8ce', '#eaa15a', '#cf5a3c', '#8f1a24'];
const RAMP_DARK = ['#7f90f2', '#5f74d8', '#3c3f47', '#e0954a', '#e06342', '#e8443b'];

export const rampRange = (theme: Theme) => (theme === 'dark' ? RAMP_DARK : RAMP_LIGHT);

export const makeTempColor = (theme: Theme) =>
  scaleLinear<string>().domain(RAMP_DOMAIN).range(rampRange(theme)).clamp(true);

// Fraction (0..1) of a value along the ramp domain, for gradient stop offsets.
export const rampFrac = (v: number) =>
  (v - RAMP_DOMAIN[0]) / (RAMP_DOMAIN[RAMP_DOMAIN.length - 1] - RAMP_DOMAIN[0]);

export const fmtAnomaly = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}`;

// Theme-aware chrome: ink for axes/labels/gridlines, and the surface color used
// to punch gaps and halos between marks (so they read as the page, not white).
export function chrome(theme: Theme) {
  const ink = theme === 'dark' ? '236, 232, 224' : '24, 26, 32';
  return {
    ink: (a = 1) => `rgba(${ink}, ${a})`,
    surface: theme === 'dark' ? 'rgb(21, 23, 27)' : 'rgb(247, 245, 240)',
  };
}
