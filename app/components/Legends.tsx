'use client';

import type { HazardReg } from '../lib/types';
import { REGION_ORDER, REGION_COLORS, PETAL_ORDER, HAZARD_COLORS, HAZARD_LABELS } from '../lib/palette';

export function RegionLegend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
      {REGION_ORDER.map((r) => (
        <span key={r} className="flex items-center gap-1.5 text-xs">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: REGION_COLORS[r] }} />
          {r}
        </span>
      ))}
    </div>
  );
}

export function HazardLegend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
      {[...PETAL_ORDER, 'other'].map((k) => (
        <span key={k} className="flex items-center gap-1.5 text-xs">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: HAZARD_COLORS[k] }} />
          {HAZARD_LABELS[k]}
        </span>
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
