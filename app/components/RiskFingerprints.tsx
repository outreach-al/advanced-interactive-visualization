'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { Country, Selection } from '../lib/types';
import { useCountries, useEvents } from '../lib/useData';
import { useResizableSidebar } from '../lib/useResizable';
import { parseUrlState, buildUrlSearch } from '../lib/urlState';
import { regionColor } from '../lib/palette';
import { Grid } from './Grid';
import { Scatter } from './Scatter';
import { Timeline } from './Timeline';
import { RegionResiduals, HazardLegend, HazardFilter } from './Legends';
import { FingerprintDetail, CompareBar } from './Compare';
import { ProjectAbout } from './ProjectAbout';
import { Streamgraph, StreamLegend } from './Streamgraph';
import { recomputeForWindow } from '../lib/recompute';
import { maxHazardLogDeaths } from '../lib/glyph';
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
  const { file, loading, error } = useCountries();
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
  const [yearRange, setYearRange] = useState<[number, number] | null>(null);
  const [hiddenStreams, setHiddenStreams] = useState<Set<string>>(new Set());
  const [tip, setTip] = useState<TooltipData | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const restoredRef = useRef(false);
  const sidebar = useResizableSidebar();

  const MAX_PINS = 8;

  // The active dataset: all-time by default, or residuals recomputed for the
  // brushed year window. Everything downstream reads from this.
  const activeData = useMemo(() => {
    if (!file) return null;
    if (yearRange && events) return recomputeForWindow(file.countries, events, yearRange[0], yearRange[1]);
    return { countries: file.countries, regression: file.regression, hazardRegression: file.hazardRegression };
  }, [file, events, yearRange]);

  const activeMaxLog = useMemo(() => (activeData ? maxHazardLogDeaths(activeData.countries) : 0), [activeData]);

  const byIso = useMemo(() => {
    const m = new Map<string, Country>();
    activeData?.countries.forEach((c) => m.set(c.iso3, c));
    return m;
  }, [activeData]);

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

  // Search by country name or ISO3. The matching set is derived from the query
  // (below), so onSearch just updates the text — this also makes a restored
  // ?q= from the URL resolve once data has loaded.
  const onSearch = useCallback((q: string) => setQuery(q), []);

  useEffect(() => {
    const norm = query.trim().toLowerCase();
    if (!norm || !file) {
      setSelection((s) => (s.search ? { ...s, search: null } : s));
      return;
    }
    const hits = new Set<string>();
    for (const c of file.countries) {
      if (c.country.toLowerCase().includes(norm) || c.iso3.toLowerCase().includes(norm)) hits.add(c.iso3);
    }
    setSelection((s) => ({ ...s, search: hits }));
  }, [query, file]);

  // Pins are a curated comparison set — deliberately NOT wiped by Esc/Clear
  // (which reset transient filters); they have their own "Clear pins".
  const onTogglePin = useCallback((iso: string) => {
    setPinned((p) => (p.includes(iso) ? p.filter((x) => x !== iso) : p.length >= MAX_PINS ? p : [...p, iso]));
  }, []);
  const onClearPins = useCallback(() => setPinned([]), []);

  const onToggleStream = useCallback((key: string) => {
    setHiddenStreams((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setSelection({ hovered: null, selected: null, brushed: null, regions: new Set(), search: null });
    setActiveHazard(null);
    setTimelineHazards(new Set());
    setQuery('');
    setYearRange(null);
    setHiddenStreams(new Set());
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

  // Restore view state from the URL once data is loaded (validated against it).
  useEffect(() => {
    if (!file || restoredRef.current) return;
    restoredRef.current = true;
    const us = parseUrlState(window.location.search);
    const petalKeys = new Set(file.petals.map((p) => p.key));
    const validRegions = new Set(file.countries.map((c) => c.region));
    if (us.hazard && petalKeys.has(us.hazard)) setActiveHazard(us.hazard);
    const regions = new Set(us.regions.filter((r) => validRegions.has(r)));
    const sel = us.sel && byIso.has(us.sel) ? us.sel : null;
    setSelection((s) => ({ ...s, selected: sel, regions }));
    if (us.q) setQuery(us.q);
    const pins = us.pins.filter((i) => byIso.has(i)).slice(0, MAX_PINS);
    if (pins.length) setPinned(pins);
    const thaz = us.thaz.filter((k) => petalKeys.has(k) || k === 'other');
    if (thaz.length) setTimelineHazards(new Set(thaz));
    if (us.years) {
      const a = Math.max(1995, Math.min(2025, us.years[0]));
      const b = Math.max(1995, Math.min(2025, us.years[1]));
      if (!(a <= 1995 && b >= 2025)) setYearRange([Math.min(a, b), Math.max(a, b)]);
    }
  }, [file, byIso]);

  // Mirror view state back into the URL (replaceState — no history spam).
  useEffect(() => {
    if (!restoredRef.current) return;
    const search = buildUrlSearch({
      hazard: activeHazard,
      sel: selection.selected,
      regions: [...selection.regions],
      q: query,
      pins: pinned,
      thaz: [...timelineHazards],
      years: yearRange,
    });
    window.history.replaceState(null, '', window.location.pathname + search);
  }, [activeHazard, selection.selected, selection.regions, query, pinned, timelineHazards, yearRange]);

  const selectedCountry = selection.selected ? byIso.get(selection.selected) ?? null : null;
  const pinnedCountries = pinned.map((iso) => byIso.get(iso)).filter((c): c is Country => !!c);
  const hasFocus =
    !!selection.selected ||
    !!selection.brushed ||
    !!activeHazard ||
    selection.regions.size > 0 ||
    timelineHazards.size > 0 ||
    !!selection.search ||
    !!yearRange;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-rule border-t-ink" />
          <p className="mt-4 font-mono text-xs uppercase tracking-[0.2em] text-faint">Loading fingerprints...</p>
        </div>
      </div>
    );
  }
  if (error || !file || !activeData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-[#b0463b]">Failed to load data: {error ?? 'unknown error'}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col lg:h-screen">
      {/* header */}
      <header className="flex flex-col gap-2 border-b border-rule px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-4 sm:px-6">
        <div className="min-w-0">
          <h1 className="whitespace-nowrap text-lg font-semibold tracking-tight">
            Risk Fingerprints
            <span className="ml-3 hidden font-normal text-faint sm:inline">where the INFORM index misses</span>
          </h1>
        </div>
        {/* On mobile: a left-aligned row of buttons with the search full-width
            below. On desktop: search pinned rightmost so the dynamic controls
            (match count, Clear) push the other buttons, never the box. */}
        <div className="flex flex-wrap items-center gap-2 sm:flex-1 sm:justify-end">
          <Link
            href="/conflict"
            className="inline-flex h-9 items-center rounded-full px-2 text-xs text-faint transition-colors hover:text-ink"
          >
            Conflict ↗
          </Link>
          <ProjectAbout />
          <About />
          {hasFocus && (
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex h-9 items-center rounded-full border border-rule px-3 text-xs font-medium text-ink/80 transition-colors hover:bg-black/[0.04]"
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
          <div className="relative w-full sm:w-auto">
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
              placeholder="Search a country..."
              aria-label="Search countries"
              className="h-9 w-full rounded-full border border-ink/20 bg-white pl-9 pr-12 text-sm shadow-sm outline-none transition-colors placeholder:text-faint focus:border-ink/50 focus:ring-2 focus:ring-ink/10 sm:w-64"
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

      {/* body: grid (left) + draggable divider + sidebar (right).
          On mobile the sidebar (charts) is shown first, the grid second. */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <section className="order-2 min-h-0 flex-1 border-b border-rule lg:order-none lg:border-b-0">
          <Grid
            countries={activeData.countries}
            maxLogDeaths={activeMaxLog}
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
          className="fp-scroll order-1 w-full shrink-0 border-b border-rule px-5 py-4 lg:order-none lg:border-b-0 lg:overflow-y-auto"
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
              dot = country · size = {activeHazard ? `${HAZARD_LABELS[activeHazard].toLowerCase()} deaths` : 'events'} ·
              dashed = OLS expectation · shaded = ±1σ / 2σ · stick = residual
            </p>
            <div className="mt-2">
              <Scatter
                countries={activeData.countries}
                regression={activeData.regression}
                hazardRegression={activeData.hazardRegression}
                activeHazard={activeHazard}
                selection={selection}
                onHover={onHover}
                onSelect={onSelect}
                onBrush={onBrush}
              />
            </div>
            <div className="mt-2">
              <RegionResiduals
                countries={activeData.countries}
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
                maxLogDeaths={activeMaxLog}
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

      {/* temporal panel: hazard streamgraph + brushable year window (focus+context) */}
      {events && (
        <div className="shrink-0 border-t border-rule bg-paper/95 px-5 py-2 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xs font-semibold tracking-tight">
              Deaths by hazard, 1995-2025
              <span className="ml-2 font-normal text-faint">
                {yearRange
                  ? `· residuals recomputed for ${yearRange[0]}-${yearRange[1]}`
                  : '· brush a range to focus the model error on an era'}
              </span>
            </h2>
            <div className="flex items-center gap-3">
              <StreamLegend hidden={hiddenStreams} onToggle={onToggleStream} />
              {yearRange && (
                <button
                  type="button"
                  onClick={() => setYearRange(null)}
                  className="shrink-0 text-[11px] text-faint hover:text-ink"
                >
                  Reset years
                </button>
              )}
            </div>
          </div>
          <Streamgraph
            events={events}
            yearRange={yearRange}
            activeHazard={activeHazard}
            hidden={hiddenStreams}
            onBrush={setYearRange}
          />
        </div>
      )}

      {/* pin-to-compare tray (docked, only when pins exist) */}
      <CompareBar
        countries={pinnedCountries}
        maxLogDeaths={activeMaxLog}
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
