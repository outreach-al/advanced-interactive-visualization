'use client';

import { useMemo } from 'react';
import type { Country, HazardReg } from '../lib/types';
import { REGION_ORDER, REGION_COLORS, PETAL_ORDER, HAZARD_COLORS, HAZARD_LABELS } from '../lib/palette';

const POS = '#b0463b'; // under-predicted (worse than model)
const NEG = '#5566b5'; // over-predicted (better than model)

// Shared look for a clickable legend chip. `active` true = this category is
// isolated; when some are active, the rest read as muted/struck-back.
function legendChipClass(active: boolean, anyActive: boolean) {
  return [
    'flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs transition-all',
    'hover:bg-black/[0.04]',
    anyActive && !active ? 'opacity-40' : 'opacity-100',
    active ? 'ring-1 ring-ink/40' : '',
  ].join(' ');
}

// Region legend AS a diverging-bar chart: each region's MEDIAN signed residual,
// so you can read which regions the model systematically under/over-predicts.
// Each row doubles as the region filter (click to isolate across scatter + grid).
export function RegionResiduals({
  countries,
  active,
  onToggle,
}: {
  countries: Country[];
  active: Set<string>;
  onToggle: (region: string) => void;
}) {
  const { rows, D } = useMemo(() => {
    const by: Record<string, number[]> = {};
    for (const c of countries) (by[c.region] ||= []).push(c.residual);
    const median = (a: number[]) => {
      const s = [...a].sort((x, y) => x - y);
      const m = Math.floor(s.length / 2);
      return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
    };
    const rows = REGION_ORDER.filter((r) => by[r]?.length).map((r) => ({
      region: r,
      median: median(by[r]),
      n: by[r].length,
    }));
    const D = Math.max(0.6, ...rows.map((d) => Math.abs(d.median))) * 1.15;
    return { rows, D };
  }, [countries]);

  const any = active.size > 0;
  const HALF = 46; // half the bar track width, in viewBox units

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[10px] text-faint">
        <span>← over-predicted</span>
        <span className="font-mono">median residual</span>
        <span>under-predicted →</span>
      </div>
      <div className="flex flex-col gap-0.5">
        {rows.map(({ region, median, n }) => {
          const isActive = active.has(region);
          const w = (median / D) * HALF;
          return (
            <button
              key={region}
              type="button"
              onClick={() => onToggle(region)}
              aria-pressed={isActive}
              title={`${region}: median residual ${median >= 0 ? '+' : ''}${median.toFixed(2)} (n=${n}) · click to isolate`}
              className={[
                'flex items-center gap-2 rounded-md px-1.5 py-0.5 text-left transition-all hover:bg-black/[0.04]',
                any && !isActive ? 'opacity-40' : 'opacity-100',
                isActive ? 'ring-1 ring-ink/40' : '',
              ].join(' ')}
            >
              <span className="flex w-[68px] shrink-0 items-center gap-1.5 text-xs">
                <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: REGION_COLORS[region] }} />
                {region}
              </span>
              <svg viewBox="0 0 100 14" className="h-3.5 flex-1" preserveAspectRatio="none">
                <line x1={50} y1={0} x2={50} y2={14} stroke="#c9c4ba" strokeWidth={0.6} />
                <rect
                  x={median >= 0 ? 50 : 50 + w}
                  y={3}
                  width={Math.abs(w)}
                  height={8}
                  rx={1}
                  fill={REGION_COLORS[region]}
                />
              </svg>
              <span
                className="w-10 shrink-0 text-right font-mono text-[11px] font-semibold"
                style={{ color: median >= 0 ? POS : NEG }}
              >
                {median >= 0 ? '+' : ''}
                {median.toFixed(2)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Clickable hazard legend → filters the timeline's events by hazard type.
export function HazardLegend({
  active,
  onToggle,
}: {
  active: Set<string>;
  onToggle: (key: string) => void;
}) {
  const any = active.size > 0;
  return (
    <div className="flex flex-wrap gap-1">
      {[...PETAL_ORDER, 'other'].map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => onToggle(k)}
          aria-pressed={active.has(k)}
          title={`Show only ${HAZARD_LABELS[k]} events`}
          className={legendChipClass(active.has(k), any)}
        >
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: HAZARD_COLORS[k] }} />
          {HAZARD_LABELS[k]}
        </button>
      ))}
    </div>
  );
}

// Clickable hazard chips — focuses one hazard across the grid + scatter (T1),
// and doubles as the timeline's color key. Hazards with no observed deaths
// (coastal flood, tsunami here) are shown but disabled.
export function HazardFilter({
  activeHazard,
  hazardRegression,
  onToggle,
}: {
  activeHazard: string | null;
  hazardRegression: Record<string, HazardReg>;
  onToggle: (key: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {PETAL_ORDER.map((k) => {
        const enabled = hazardRegression[k]?.hasDeaths ?? true;
        const active = activeHazard === k;
        return (
          <button
            key={k}
            type="button"
            disabled={!enabled}
            onClick={() => onToggle(k)}
            title={enabled ? `Focus ${HAZARD_LABELS[k]}` : 'No observed deaths in EM-DAT for this hazard'}
            className={[
              'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors',
              active
                ? 'border-ink bg-ink text-paper'
                : enabled
                  ? 'border-rule hover:bg-black/[0.04]'
                  : 'cursor-not-allowed border-rule/60 text-faint/60',
            ].join(' ')}
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: HAZARD_COLORS[k], opacity: enabled ? 1 : 0.4 }}
            />
            {HAZARD_LABELS[k]}
          </button>
        );
      })}
    </div>
  );
}
