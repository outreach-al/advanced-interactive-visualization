'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Country, Selection } from '../lib/types';
import { useCountries, useEvents } from '../lib/useData';
import { useResizableSidebar } from '../lib/useResizable';
import { regionColor } from '../lib/palette';
import { Grid } from './Grid';
import { Scatter } from './Scatter';
import { Timeline } from './Timeline';
import { RegionResiduals, HazardLegend, HazardFilter } from './Legends';
import { FingerprintDetail, CompareBar } from './Compare';
import { HAZARD_LABELS, HAZARD_COLORS } from '../lib/palette';
import { About } from './About';
import { Tooltip, type TooltipData } from './Tooltip';

function countryTip(c: Country, activeHazard: string | null): React.ReactNode {
  const sign = c.residual >= 0 ? '+' : '';
  const hz = activeHazard ? c.hazards.find((h) => h.key === activeHazard) : null;
  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-[11px] text-faint">{c.iso3}</span>
        <span className="font-semibold">{c.country}</span>
      </div>
      <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink/70">
        <span className="inline-block h-2 w-2 rounded-full" style={{ background: regionColor(c.region) }} />
        {c.region}
      </div>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[11px]">
        <dt className="text-faint">INFORM risk</dt>
        <dd className="text-right font-mono">{c.informRisk.toFixed(1)}</dd>
        <dt className="text-faint">Total deaths</dt>
        <dd className="text-right font-mono">{c.totalDeaths.toLocaleString()}</dd>
        <dt className="text-faint">Events</dt>
        <dd className="text-right font-mono">{c.totalEvents.toLocaleString()}</dd>
        <dt className="text-faint">Residual</dt>
        <dd className="text-right font-mono font-semibold" style={{ color: c.residual >= 0 ? '#b0463b' : '#5566b5' }}>
          {sign}
          {c.residual.toFixed(2)}
        </dd>
      </dl>
      {hz && (
        <div className="mt-2 border-t border-rule pt-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: HAZARD_COLORS[hz.key] }}>
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: HAZARD_COLORS[hz.key] }} />
            {HAZARD_LABELS[hz.key]}
          </div>
          <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[11px]">
            <dt className="text-faint">Risk</dt>
            <dd className="text-right font-mono">{hz.risk.toFixed(1)}</dd>
            <dt className="text-faint">Deaths</dt>
            <dd className="text-right font-mono">{hz.deaths.toLocaleString()}</dd>
            <dt className="text-faint">Residual</dt>
            <dd className="text-right font-mono font-semibold" style={{ color: hz.residual >= 0 ? '#b0463b' : '#5566b5' }}>
              {hz.residual >= 0 ? '+' : ''}
              {hz.residual.toFixed(2)}
            </dd>
          </dl>
        </div>
      )}
      {!hz && (
        <p className="mt-1.5 text-[11px] text-ink/60">
          {c.residual >= 0 ? 'Worse than the model predicted.' : 'Better than the model predicted.'}
        </p>
      )}
    </div>
  );
}

export function RiskFingerprints() {
  const { file, maxLogDeaths, loading, error } = useCountries();
  const events = useEvents();

  const [selection, setSelection] = useState<Selection>({
    hovered: null,
    selected: null,
    brushed: null,
    regions: new Set(),
    search: null,
  });
  const [activeHazard, setActiveHazard] = useState<string | null>(null);
  const [timelineHazards, setTimelineHazards] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [pinned, setPinned] = useState<string[]>([]);
  const [tip, setTip] = useState<TooltipData | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const sidebar = useResizableSidebar();

  const MAX_PINS = 8;

  const byIso = useMemo(() => {
    const m = new Map<string, Country>();
    file?.countries.forEach((c) => m.set(c.iso3, c));
    return m;
  }, [file]);

  // hover drives cross-view highlight AND the country tooltip
  const onHover = useCallback(
    (iso: string | null, anchor?: { x: number; y: number }) => {
      setSelection((s) => (s.hovered === iso ? s : { ...s, hovered: iso }));
      if (iso && anchor) {
        const c = byIso.get(iso);
        if (c) setTip({ x: anchor.x, y: anchor.y, node: countryTip(c, activeHazard) });
      } else {
        setTip(null);
      }
    },
    [byIso, activeHazard],
  );

  const onSelect = useCallback((iso: string) => {
    setSelection((s) => ({ ...s, selected: s.selected === iso ? null : iso }));
  }, []);

  const onBrush = useCallback((isos: Set<string> | null) => {
    setSelection((s) => ({ ...s, brushed: isos }));
  }, []);

  // Focusing a hazard clears an existing brush (positions change underneath it).
  const onToggleHazard = useCallback((key: string) => {
    setActiveHazard((prev) => (prev === key ? null : key));
    setSelection((s) => ({ ...s, brushed: null }));
  }, []);

  // Toggle a region in/out of the isolate set (scatter legend → scatter + grid).
  const onToggleRegion = useCallback((region: string) => {
    setSelection((s) => {
      const regions = new Set(s.regions);
      if (regions.has(region)) regions.delete(region);
      else regions.add(region);
      return { ...s, regions };
    });
  }, []);

  // Toggle a hazard in/out of the timeline event filter (timeline legend).
  const onToggleTimelineHazard = useCallback((key: string) => {
    setTimelineHazards((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  // Search by country name or ISO3 → a set of matching iso3 folded into dimming.
  const onSearch = useCallback(
    (q: string) => {
      setQuery(q);
      const norm = q.trim().toLowerCase();
      if (!norm) {
        setSelection((s) => ({ ...s, search: null }));
        return;
      }
      const hits = new Set<string>();
      for (const c of file?.countries ?? []) {
        if (c.country.toLowerCase().includes(norm) || c.iso3.toLowerCase().includes(norm)) hits.add(c.iso3);
      }
      setSelection((s) => ({ ...s, search: hits }));
    },
    [file],
  );

  // Pins are a curated comparison set — deliberately NOT wiped by Esc/Clear
  // (which reset transient filters); they have their own "Clear pins".
  const onTogglePin = useCallback((iso: string) => {
    setPinned((p) => (p.includes(iso) ? p.filter((x) => x !== iso) : p.length >= MAX_PINS ? p : [...p, iso]));
  }, []);
  const onClearPins = useCallback(() => setPinned([]), []);

  const clearAll = useCallback(() => {
    setSelection({ hovered: null, selected: null, brushed: null, regions: new Set(), search: null });
    setActiveHazard(null);
    setTimelineHazards(new Set());
    setQuery('');
    setTip(null);
  }, []);

  // Esc clears selection + brush; "/" jumps to the search box.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearAll();
        searchRef.current?.blur();
      } else if (e.key === '/') {
        const el = document.activeElement;
        const typing = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
        if (!typing) {
          e.preventDefault();
          searchRef.current?.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [clearAll]);

  // Scroll the first (top-most by current sort) search match into view.
  const search = selection.search;
  useEffect(() => {
    if (!search || search.size === 0) return;
    const raf = requestAnimationFrame(() => {
      const cells = document.querySelectorAll<HTMLElement>('[data-iso]');
      for (const el of Array.from(cells)) {
        if (el.dataset.iso && search.has(el.dataset.iso)) {
          el.scrollIntoView({ block: 'center', behavior: 'smooth' });
          break;
        }
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [search]);

  // Bring the selected country's glyph into view (e.g. when picked in the scatter).
  const selectedIso = selection.selected;
  useEffect(() => {
    if (!selectedIso) return;
    const raf = requestAnimationFrame(() => {
      document
        .querySelector<HTMLElement>(`[data-iso="${selectedIso}"]`)
        ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
    return () => cancelAnimationFrame(raf);
  }, [selectedIso]);

  const selectedCountry = selection.selected ? byIso.get(selection.selected) ?? null : null;
  const pinnedCountries = pinned.map((iso) => byIso.get(iso)).filter((c): c is Country => !!c);
  const hasFocus =
    !!selection.selected ||
    !!selection.brushed ||
    !!activeHazard ||
    selection.regions.size > 0 ||
    timelineHazards.size > 0 ||
    !!selection.search;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-rule border-t-ink" />
          <p className="mt-4 font-mono text-xs uppercase tracking-[0.2em] text-faint">Loading fingerprints…</p>
        </div>
      </div>
    );
  }
  if (error || !file) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-[#b0463b]">Failed to load data: {error ?? 'unknown error'}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col lg:h-screen">
      {/* header */}
      <header className="flex items-center justify-between gap-4 border-b border-rule px-6 py-3">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight">
            Risk Fingerprints
            <span className="ml-3 hidden font-normal text-faint sm:inline">where the INFORM index misses</span>
          </h1>
        </div>
        {/* Search is pinned rightmost so the dynamic controls (match count, Clear)
            push the other buttons, never the box you're typing in. */}
        <div className="flex shrink-0 items-center gap-2">
          <About />
          {hasFocus && (
            <button
              type="button"
              onClick={clearAll}
              className="rounded-full border border-rule px-3 py-1 text-xs font-medium text-ink/80 transition-colors hover:bg-black/[0.04]"
            >
              Clear ✕
            </button>
          )}
          {query && (
            <span className="hidden font-mono text-[11px] text-faint sm:inline">
              {selection.search?.size ?? 0} match{(selection.search?.size ?? 0) === 1 ? '' : 'es'}
            </span>
          )}
          {/* country search */}
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/50"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.5" y2="16.5" />
            </svg>
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search a country…"
              aria-label="Search countries"
              className="w-64 rounded-full border border-ink/20 bg-white py-1.5 pl-9 pr-12 text-sm shadow-sm outline-none transition-colors placeholder:text-faint focus:border-ink/50 focus:ring-2 focus:ring-ink/10"
            />
            {query ? (
              <button
                type="button"
                onClick={() => {
                  onSearch('');
                  searchRef.current?.focus();
                }}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-ink"
              >
                ✕
              </button>
            ) : (
              <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-rule bg-paper px-1.5 py-0.5 font-mono text-[10px] text-faint">
                /
              </kbd>
            )}
          </div>
        </div>
      </header>

      {/* body: grid (left) + draggable divider + sidebar (right) */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <section className="min-h-0 flex-1 border-b border-rule lg:border-b-0">
          <Grid
            countries={file.countries}
            maxLogDeaths={maxLogDeaths}
            selection={selection}
            activeHazard={activeHazard}
            onHover={onHover}
            onSelect={onSelect}
          />
        </section>

        {/* resize handle (desktop only) — drag to resize, double-click to reset */}
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize panels"
          onPointerDown={sidebar.onHandlePointerDown}
          onDoubleClick={sidebar.onHandleDoubleClick}
          title="Drag to resize · double-click to reset"
          className={`group relative hidden w-px shrink-0 cursor-col-resize bg-rule lg:block ${
            sidebar.dragging ? 'bg-ink/50' : ''
          }`}
        >
          {/* wider invisible hit-area + a grip that shows on hover/drag */}
          <span className="absolute inset-y-0 -left-2 -right-2 z-20" />
          <span
            className={`absolute top-1/2 left-1/2 z-20 h-9 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors ${
              sidebar.dragging ? 'bg-ink/70' : 'bg-rule group-hover:bg-ink/40'
            }`}
          />
        </div>

        <aside
          style={sidebar.isDesktop ? { width: sidebar.width } : undefined}
          className="fp-scroll w-full shrink-0 px-5 py-4 lg:overflow-y-auto"
        >
          {/* hazard focus filter (T1) */}
          <div className="pb-4">
            <h2 className="text-sm font-semibold tracking-tight">Focus a hazard</h2>
            <p className="mt-0.5 mb-2 text-[11px] text-faint">
              re-sorts the grid and the scatter by that hazard&apos;s own model error
            </p>
            <HazardFilter
              activeHazard={activeHazard}
              hazardRegression={file.hazardRegression}
              onToggle={onToggleHazard}
            />
          </div>

          {/* scatter */}
          <div className="border-t border-rule pt-4">
            <h2 className="text-sm font-semibold tracking-tight">
              {activeHazard ? (
                <>
                  Predicted vs. observed · <span style={{ color: '#14161b' }}>{HAZARD_LABELS[activeHazard]}</span>
                </>
              ) : (
                'Predicted vs. observed'
              )}
            </h2>
            <p className="mt-0.5 text-[11px] text-faint">
              one dot per country · size = {activeHazard ? `${HAZARD_LABELS[activeHazard].toLowerCase()} deaths` : 'events'} ·
              dashed line = expected (OLS) · sticks = residual
            </p>
            <div className="mt-2">
              <Scatter
                countries={file.countries}
                regression={file.regression}
                hazardRegression={file.hazardRegression}
                activeHazard={activeHazard}
                selection={selection}
                onHover={onHover}
                onSelect={onSelect}
                onBrush={onBrush}
              />
            </div>
            <div className="mt-2">
              <RegionResiduals
                countries={file.countries}
                active={selection.regions}
                onToggle={onToggleRegion}
              />
            </div>
          </div>

          {/* selected fingerprint (enlarged + labeled) */}
          {selectedCountry && (
            <div className="mt-7 border-t border-rule pt-5">
              <h2 className="text-sm font-semibold tracking-tight">
                <span className="font-mono">{selectedCountry.iso3}</span>{' '}
                <span className="font-normal text-ink/70">{selectedCountry.country}</span>
                <span className="ml-2 font-normal text-faint">· {selectedCountry.region}</span>
              </h2>
              <p className="mt-0.5 mb-3 text-[11px] text-faint">
                fingerprint · petal length = predicted risk · saturation = observed deaths
              </p>
              <FingerprintDetail
                country={selectedCountry}
                maxLogDeaths={maxLogDeaths}
                activeHazard={activeHazard}
                isPinned={pinned.includes(selectedCountry.iso3)}
                canPin={pinned.length < MAX_PINS}
                onTogglePin={onTogglePin}
              />
            </div>
          )}

          {/* timeline */}
          <div className="mt-7 border-t border-rule pt-5">
            <h2 className="text-sm font-semibold tracking-tight">
              {selectedCountry ? (
                <>
                  Events · <span className="font-mono">{selectedCountry.iso3}</span>{' '}
                  <span className="font-normal text-ink/70">{selectedCountry.country}</span>
                </>
              ) : (
                'Disaster events'
              )}
            </h2>
            <p className="mt-0.5 text-[11px] text-faint">
              each circle is one EM-DAT event · colored by hazard
            </p>
            <div className="mt-2">
              <Timeline
                country={selectedCountry}
                events={selectedCountry ? events?.[selectedCountry.iso3] ?? (events ? [] : null) : null}
                activeHazards={timelineHazards}
                setTip={setTip}
              />
            </div>
            {selectedCountry && (
              <div className="mt-1">
                <HazardLegend active={timelineHazards} onToggle={onToggleTimelineHazard} />
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* pin-to-compare tray (docked, only when pins exist) */}
      <CompareBar
        countries={pinnedCountries}
        maxLogDeaths={maxLogDeaths}
        activeHazard={activeHazard}
        selectedIso={selection.selected}
        onSelect={onSelect}
        onUnpin={onTogglePin}
        onClear={onClearPins}
      />

      <Tooltip data={tip} />
    </div>
  );
}
