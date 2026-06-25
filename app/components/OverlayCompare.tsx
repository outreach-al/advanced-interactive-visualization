'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { Country } from '../lib/types';
import { buildGlyph } from '../lib/glyph';
import { PETAL_ORDER, HAZARD_LABELS, HAZARD_COLORS } from '../lib/palette';

// Distinct per-country colours for the overlay (pins capped at 8).
export const OVERLAY_PALETTE = ['#4e79a7', '#f28e2b', '#59a14f', '#e15759', '#b07aa1', '#76b7b2', '#9c7c38', '#ff9da7'];

export const overlayColor = (countries: Country[], iso: string) =>
  OVERLAY_PALETTE[Math.max(0, countries.findIndex((c) => c.iso3 === iso)) % OVERLAY_PALETTE.length];

// One country's petals in a single colour (length = risk), for overlaying.
// Drawn centred in a `box`×`box` square offset by (ox, oy) within a larger svg.
function OverlayPetals({
  country,
  color,
  box,
  ox,
  oy,
  opacity,
  strokeW,
}: {
  country: Country;
  color: string;
  box: number;
  ox: number;
  oy: number;
  opacity: number;
  strokeW: number;
}) {
  const g = buildGlyph(country, box, 1); // maxLogDeaths irrelevant; we recolor
  return (
    <g transform={`translate(${ox},${oy})`}>
      {g.petals.map((p) => (
        <path
          key={p.key}
          d={p.d}
          transform={`rotate(${p.angle},${g.cx},${g.cy})`}
          fill={color}
          fillOpacity={opacity}
          stroke={color}
          strokeOpacity={Math.min(1, opacity + 0.4)}
          strokeWidth={strokeW}
          strokeLinejoin="round"
        />
      ))}
    </g>
  );
}

// All pinned fingerprints overlaid, colored by country (petal length = risk).
// Since colour encodes country here (not hazard), each petal angle is labelled
// with its hazard name on a short leader line. Highlighted country on top.
export function OverlayGlyph({ countries, highlightIso }: { countries: Country[]; highlightIso: string | null }) {
  if (countries.length === 0) return null;
  const GS = 232; // inner glyph box
  const W = 540;
  const H = 380;
  const ox = (W - GS) / 2;
  const oy = (H - GS) / 2;
  const cx = W / 2;
  const cy = H / 2;
  const maxR = GS * 0.45;

  const anyHi = countries.some((c) => c.iso3 === highlightIso);
  const ordered = [...countries].sort((a, b) => (a.iso3 === highlightIso ? 1 : 0) - (b.iso3 === highlightIso ? 1 : 0));
  const polar = (deg: number, r: number): [number, number] => [
    cx + r * Math.sin((deg * Math.PI) / 180),
    cy - r * Math.cos((deg * Math.PI) / 180),
  ];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[540px]" role="img" aria-label="All pinned fingerprints overlaid">
      {ordered.map((c) => {
        const hi = c.iso3 === highlightIso;
        const op = !anyHi ? 0.28 : hi ? 0.45 : 0.12;
        return (
          <OverlayPetals
            key={c.iso3}
            country={c}
            color={overlayColor(countries, c.iso3)}
            box={GS}
            ox={ox}
            oy={oy}
            opacity={op}
            strokeW={hi ? 1.8 : 1}
          />
        );
      })}
      <circle cx={cx} cy={cy} r={GS * 0.12} fill="#f7f5f0" />

      {/* hazard labels on leader lines (colour = country, so name the angles) */}
      {PETAL_ORDER.map((key, i) => {
        const deg = i * (360 / PETAL_ORDER.length);
        const [x1, y1] = polar(deg, maxR + 4);
        const [x2, y2] = polar(deg, maxR + 16);
        const [tx, ty] = polar(deg, maxR + 20);
        const s = Math.sin((deg * Math.PI) / 180);
        const anchor = s > 0.25 ? 'start' : s < -0.25 ? 'end' : 'middle';
        return (
          <g key={key}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#c9c4ba" strokeWidth={1} />
            <text x={tx} y={ty} textAnchor={anchor} dominantBaseline="middle" fontSize={11} fill="#14161b">
              {HAZARD_LABELS[key]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// Full-size overlay comparison: a large overlaid glyph + a per-hazard table
// across all pinned countries (toggle risk / deaths).
export function OverlayModal({ countries, onClose }: { countries: Country[]; onClose: () => void }) {
  const [hi, setHi] = useState<string | null>(null);
  const [metric, setMetric] = useState<'risk' | 'deaths'>('risk');
  const val = (c: Country, key: string) => {
    const h = c.hazards.find((x) => x.key === key);
    return metric === 'risk' ? h?.risk ?? 0 : h?.deaths ?? 0;
  };

  // Portal to <body> so the fixed backdrop centers on the viewport rather than
  // being trapped inside the bottom tray's backdrop-filter containing block.
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-ink/30 p-4 backdrop-blur-sm sm:items-center sm:p-10"
      onClick={onClose}
    >
      <div
        className="flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-rule bg-paper shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-rule px-6 pb-4 pt-5">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Overlay comparison</h2>
            <p className="mt-1 text-xs text-faint">
              Petal length = predicted risk · {countries.length} pinned countries
            </p>
          </div>
          <button type="button" onClick={onClose} className="shrink-0 rounded-full border border-rule px-3 py-1 text-xs">
            Close
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          <div className="flex justify-center">
            <OverlayGlyph countries={countries} highlightIso={hi} />
          </div>

          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {countries.map((c) => (
              <span
                key={c.iso3}
                onMouseEnter={() => setHi(c.iso3)}
                onMouseLeave={() => setHi(null)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs ${hi === c.iso3 ? 'border-ink/50 bg-black/[0.04]' : 'border-rule'}`}
              >
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: overlayColor(countries, c.iso3) }} />
                {c.country}
              </span>
            ))}
          </div>

          {/* per-hazard comparison */}
          <div className="mt-5 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Per hazard</h3>
            <div className="flex rounded-full border border-rule p-0.5 text-[11px]">
              {(['risk', 'deaths'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMetric(m)}
                  className={`rounded-full px-2.5 py-0.5 capitalize ${metric === m ? 'bg-ink text-paper' : 'text-ink/70'}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-faint">
                  <th className="pb-1 text-left font-medium">hazard</th>
                  {countries.map((c) => (
                    <th key={c.iso3} className="pb-1 pl-3 text-right font-mono font-medium" style={{ color: overlayColor(countries, c.iso3) }}>
                      {c.iso3}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="font-mono">
                {PETAL_ORDER.map((key) => {
                  const max = Math.max(...countries.map((c) => val(c, key)));
                  return (
                    <tr key={key}>
                      <td className="py-0.5 pr-2 font-sans">
                        <span className="inline-flex items-center gap-1">
                          <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: HAZARD_COLORS[key] }} />
                          {HAZARD_LABELS[key]}
                        </span>
                      </td>
                      {countries.map((c) => {
                        const v = val(c, key);
                        return (
                          <td
                            key={c.iso3}
                            className="py-0.5 pl-3 text-right tabular-nums"
                            style={{ fontWeight: v > 0 && v === max ? 700 : 400, color: v > 0 && v === max ? '#14161b' : '#8a8780' }}
                          >
                            {metric === 'risk' ? v.toFixed(1) : Math.round(v).toLocaleString()}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
