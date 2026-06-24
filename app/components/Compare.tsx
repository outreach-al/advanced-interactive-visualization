'use client';

import type { Country } from '../lib/types';
import { Glyph } from './Glyph';
import { HAZARD_COLORS, HAZARD_LABELS } from '../lib/palette';

const POS = '#b0463b';
const NEG = '#5566b5';

// Enlarged, fully-labeled fingerprint for the selected country: the glyph plus
// a per-petal readout of predicted risk vs. observed deaths vs. residual.
export function FingerprintDetail({
  country,
  maxLogDeaths,
  activeHazard,
  isPinned,
  canPin,
  onTogglePin,
}: {
  country: Country;
  maxLogDeaths: number;
  activeHazard: string | null;
  isPinned: boolean;
  canPin: boolean;
  onTogglePin: (iso: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-start gap-4">
      <div className="shrink-0">
        <Glyph country={country} size={184} maxLogDeaths={maxLogDeaths} activeHazard={activeHazard} showLabel={false} />
      </div>

      <div className="min-w-[220px] flex-1">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-faint">
              <th className="pb-1 text-left font-medium">hazard</th>
              <th className="pb-1 text-right font-medium">risk</th>
              <th className="pb-1 text-right font-medium">deaths</th>
              <th className="pb-1 text-right font-medium">resid</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {country.hazards.map((h) => {
              const isActive = activeHazard === h.key;
              return (
                <tr
                  key={h.key}
                  className={isActive ? 'bg-black/[0.04]' : ''}
                  style={{ opacity: activeHazard && !isActive ? 0.45 : 1 }}
                >
                  <td className="py-0.5 pr-2">
                    <span className="flex items-center gap-1.5 font-sans">
                      <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: HAZARD_COLORS[h.key] }} />
                      {HAZARD_LABELS[h.key]}
                    </span>
                  </td>
                  <td className="py-0.5 text-right tabular-nums">{h.risk.toFixed(1)}</td>
                  <td className="py-0.5 text-right tabular-nums">{Math.round(h.deaths).toLocaleString()}</td>
                  <td
                    className="py-0.5 text-right font-semibold tabular-nums"
                    style={{ color: h.residual >= 0 ? POS : NEG }}
                  >
                    {h.residual >= 0 ? '+' : ''}
                    {h.residual.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <button
          type="button"
          onClick={() => onTogglePin(country.iso3)}
          disabled={!isPinned && !canPin}
          className={[
            'mt-3 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
            isPinned
              ? 'border-ink bg-ink text-paper'
              : canPin
                ? 'border-rule hover:bg-black/[0.04]'
                : 'cursor-not-allowed border-rule/60 text-faint/60',
          ].join(' ')}
          title={isPinned ? 'Remove from compare' : canPin ? 'Pin to compare' : 'Compare tray is full'}
        >
          {isPinned ? 'Pinned' : 'Pin to compare'}
        </button>
      </div>
    </div>
  );
}

// Bottom-docked tray of pinned fingerprints, side by side for T2 comparison.
export function CompareBar({
  countries,
  maxLogDeaths,
  activeHazard,
  selectedIso,
  onSelect,
  onUnpin,
  onClear,
}: {
  countries: Country[];
  maxLogDeaths: number;
  activeHazard: string | null;
  selectedIso: string | null;
  onSelect: (iso: string) => void;
  onUnpin: (iso: string) => void;
  onClear: () => void;
}) {
  if (countries.length === 0) return null;
  return (
    <div className="shrink-0 border-t border-rule bg-paper/95 px-5 py-3 backdrop-blur-sm">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-tight">
          Compare <span className="font-mono text-faint">({countries.length})</span>
        </h2>
        <button type="button" onClick={onClear} className="text-[11px] text-faint hover:text-ink">
          Clear pins
        </button>
      </div>
      <div className="fp-scroll flex gap-3 overflow-x-auto pb-1">
        {countries.map((c) => (
          <div
            key={c.iso3}
            className={`relative flex shrink-0 flex-col items-center rounded-lg border p-2 ${
              selectedIso === c.iso3 ? 'border-ink/50 bg-black/[0.03]' : 'border-rule'
            }`}
          >
            <button
              type="button"
              onClick={() => onUnpin(c.iso3)}
              aria-label={`Unpin ${c.country}`}
              className="absolute right-1 top-1 z-10 flex h-4 w-4 items-center justify-center rounded-full text-[10px] text-faint hover:bg-black/10 hover:text-ink"
            >
              ✕
            </button>
            <button type="button" onClick={() => onSelect(c.iso3)} title={`Select ${c.country}`} className="flex flex-col items-center">
              <Glyph country={c} size={92} maxLogDeaths={maxLogDeaths} activeHazard={activeHazard} />
              <span className="mt-0.5 max-w-[100px] truncate text-[11px] font-medium">{c.country}</span>
              <span className="font-mono text-[10px]" style={{ color: c.residual >= 0 ? POS : NEG }}>
                {c.residual >= 0 ? '+' : ''}
                {c.residual.toFixed(2)}
              </span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
