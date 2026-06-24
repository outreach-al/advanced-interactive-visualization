// Two deliberately separate categorical palettes — regions and hazards never
// share a hue, so the scatter's color and the timeline's color never collide.

// Regions (5, +Other fallback). Muted, earthy, accessible — sits on warm paper.
export const REGION_COLORS: Record<string, string> = {
  Africa: '#d08a2c',
  Americas: '#2e7d8a',
  Asia: '#b0463b',
  Europe: '#5566b5',
  Oceania: '#6f8f3c',
  Other: '#9a958c',
};

export const REGION_ORDER = ['Africa', 'Americas', 'Asia', 'Europe', 'Oceania'];

// Hazards — keyed to the petal angular order. Used by petal hue AND the timeline.
export const HAZARD_COLORS: Record<string, string> = {
  flood_river: '#3a7ca5',
  flood_coastal: '#6bb1c4',
  earthquake: '#8a5a2b',
  tropical_cyclone: '#6a5b9a',
  drought: '#c69749',
  tsunami: '#2f7f7a',
  epidemic: '#a04f6e',
  other: '#9a958c', // unmapped EM-DAT types in the timeline
};

export const HAZARD_LABELS: Record<string, string> = {
  flood_river: 'River flood',
  flood_coastal: 'Coastal flood',
  earthquake: 'Earthquake',
  tropical_cyclone: 'Tropical cyclone',
  drought: 'Drought',
  tsunami: 'Tsunami',
  epidemic: 'Epidemic',
  other: 'Other',
};

// Fixed petal order (also the timeline legend order). Index = angular slot.
export const PETAL_ORDER = [
  'flood_river',
  'flood_coastal',
  'earthquake',
  'tropical_cyclone',
  'drought',
  'tsunami',
  'epidemic',
];

export const regionColor = (region: string) =>
  REGION_COLORS[region] ?? REGION_COLORS.Other;

export const hazardColor = (key: string | null) =>
  HAZARD_COLORS[key ?? 'other'] ?? HAZARD_COLORS.other;
