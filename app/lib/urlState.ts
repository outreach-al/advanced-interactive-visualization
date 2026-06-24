// Serialize the shareable parts of the view into URL query params, so a given
// state (focused hazard, selected country, region filter, search, pins, timeline
// hazard filter) can be deep-linked — e.g. ?hazard=earthquake&region=Asia.
// Transient state (hover, brush) is deliberately NOT encoded.

export interface UrlState {
  hazard: string | null;
  sel: string | null;
  regions: string[];
  q: string;
  pins: string[];
  thaz: string[];
  years: [number, number] | null;
}

export function parseUrlState(search: string): UrlState {
  const p = new URLSearchParams(search);
  const list = (k: string) => (p.get(k) ? p.get(k)!.split(',').filter(Boolean) : []);
  let years: [number, number] | null = null;
  const yv = p.get('years');
  if (yv) {
    const [a, b] = yv.split('-').map(Number);
    if (Number.isFinite(a) && Number.isFinite(b)) years = [a, b];
  }
  return {
    hazard: p.get('hazard') || null,
    sel: p.get('sel') || null,
    regions: list('region'),
    q: p.get('q') || '',
    pins: list('pins'),
    thaz: list('thaz'),
    years,
  };
}

export function buildUrlSearch(s: UrlState): string {
  const p = new URLSearchParams();
  if (s.hazard) p.set('hazard', s.hazard);
  if (s.sel) p.set('sel', s.sel);
  if (s.regions.length) p.set('region', s.regions.join(','));
  if (s.q.trim()) p.set('q', s.q.trim());
  if (s.pins.length) p.set('pins', s.pins.join(','));
  if (s.thaz.length) p.set('thaz', s.thaz.join(','));
  if (s.years) p.set('years', `${s.years[0]}-${s.years[1]}`);
  const str = p.toString();
  return str ? `?${str}` : '';
}
