import type { Theme } from './useTheme';

// Concrete SVG colors per theme for the Risk Fingerprints views. SVG presentation
// attributes (fill/stroke) do not resolve CSS variables, so we hand back literal
// colors chosen to match the --ink / --paper / --faint / --rule tokens.
export interface SvgColors {
  ink: string; // primary text and marks
  inkA: (a: number) => string; // ink at an alpha (shaded bands, faint strokes)
  faint: string; // muted axis labels
  grid: string; // axis baselines / gridlines
  rule: string; // tick marks, thin dividers
  surface: string; // page ground: halos, glyph discs, dot outlines
  pale: string; // glyph base at zero observed deaths
}

const LIGHT: SvgColors = {
  ink: '#14161b',
  inkA: (a) => `rgba(20, 22, 27, ${a})`,
  faint: '#8a8780',
  grid: '#e7e3da',
  rule: '#c9c4ba',
  surface: '#f7f5f0',
  pale: '#efece4',
};

const DARK: SvgColors = {
  ink: '#ece8e0',
  inkA: (a) => `rgba(236, 232, 224, ${a})`,
  faint: '#8f8a81',
  grid: 'rgba(236, 232, 224, 0.13)',
  rule: 'rgba(236, 232, 224, 0.24)',
  surface: '#15171b',
  pale: '#20232b',
};

export const svgColors = (theme: Theme): SvgColors => (theme === 'dark' ? DARK : LIGHT);
