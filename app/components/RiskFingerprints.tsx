'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Country, Selection } from '../lib/types';
import { useCountries, useEvents } from '../lib/useData';
import { regionColor } from '../lib/palette';
import { Grid } from './Grid';
import { Scatter } from './Scatter';
import { Timeline } from './Timeline';
import { RegionLegend, HazardLegend, HazardFilter } from './Legends';
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

  const [selection, setSelection] = useState<Selection>({ hovered: null, selected: null, brushed: null });
  const [activeHazard, setActiveHazard] = useState<string | null>(null);
  const [tip, setTip] = useState<TooltipData | null>(null);

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

  const clearAll = useCallback(() => {
    setSelection({ hovered: null, selected: null, brushed: null });
    setActiveHazard(null);
    setTip(null);
  }, []);

  // Esc clears selection + brush
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') clearAll();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [clearAll]);

  const selectedCountry = selection.selected ? byIso.get(selection.selected) ?? null : null;
  const hasFocus = !!selection.selected || !!selection.brushed || !!activeHazard;

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
        <div className="flex shrink-0 items-center gap-2">
          {hasFocus && (
            <button
              type="button"
              onClick={clearAll}
              className="rounded-full border border-rule px-3 py-1 text-xs font-medium text-ink/80 transition-colors hover:bg-black/[0.04]"
            >
              Clear ✕
            </button>
          )}
          <About />
        </div>
      </header>

      {/* body: grid (left) + sidebar (right) */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <section className="min-h-0 flex-1 border-b border-rule lg:border-b-0 lg:border-r">
          <Grid
            countries={file.countries}
            maxLogDeaths={maxLogDeaths}
            selection={selection}
            activeHazard={activeHazard}
            onHover={onHover}
            onSelect={onSelect}
          />
        </section>

        <aside className="fp-scroll w-full shrink-0 px-5 py-4 lg:w-[470px] lg:overflow-y-auto">
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
            <div className="mt-1">
              <RegionLegend />
            </div>
          </div>

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
                setTip={setTip}
              />
            </div>
            {selectedCountry && (
              <div className="mt-1">
                <HazardLegend />
              </div>
            )}
          </div>
        </aside>
      </div>

      <Tooltip data={tip} />
    </div>
  );
}
