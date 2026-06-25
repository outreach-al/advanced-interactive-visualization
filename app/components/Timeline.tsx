'use client';

import { useEffect, useMemo, useState } from 'react';
import { scaleLinear, max as d3max } from 'd3';
import type { Country, DisasterEvent } from '../lib/types';
import { hazardColor, HAZARD_LABELS } from '../lib/palette';
import type { TooltipData } from './Tooltip';
import { EventDetail } from './EventDetail';

const W = 430;
const H = 232;
const M = { top: 12, right: 16, bottom: 30, left: 44 };
const IW = W - M.left - M.right;
const IH = H - M.top - M.bottom;

const YEAR_MIN = 1995;
const YEAR_MAX = 2025;

interface TimelineProps {
  country: Country | null;
  events: DisasterEvent[] | null; // null = events file still loading
  activeHazards: Set<string>; // empty = show all; else only these hazard types
  setTip: (t: TooltipData | null) => void;
}

export function Timeline({ country, events, activeHazards, setTip }: TimelineProps) {
  const [openEvent, setOpenEvent] = useState<DisasterEvent | null>(null);
  // Reset the open event when the selected country changes.
  useEffect(() => setOpenEvent(null), [country?.iso3]);

  const { x, y, yTicks } = useMemo(() => {
    const x = scaleLinear().domain([YEAR_MIN, YEAR_MAX]).range([0, IW]);
    const ymax = Math.ceil(d3max(events ?? [], (e) => Math.log10(e.deaths + 1)) ?? 4) || 4;
    const y = scaleLinear().domain([0, ymax]).range([IH, 0]);
    return { x, y, yTicks: y.ticks(4) };
  }, [events]);

  if (!country) {
    return (
      <div className="flex h-[232px] flex-col items-center justify-center rounded-lg border border-dashed border-rule text-center">
        <p className="text-sm font-medium text-ink/70">No country selected</p>
        <p className="mt-1 max-w-[240px] text-xs text-faint">
          Click any glyph in the grid (or a dot in the scatter) to see the actual
          disaster events behind its losses.
        </p>
      </div>
    );
  }

  const xTicks = [1995, 2000, 2005, 2010, 2015, 2020, 2025];

  return (
    <>
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${country.country} events over time`}>
      <g transform={`translate(${M.left},${M.top})`}>
        {yTicks.map((t) => (
          <g key={`y${t}`} transform={`translate(0,${y(t)})`}>
            <line x1={0} x2={IW} stroke="#e7e3da" />
            <text x={-8} y={3} textAnchor="end" fontSize={10} fill="#8a8780" fontFamily="var(--font-mono)">
              {t}
            </text>
          </g>
        ))}
        {xTicks.map((t) => (
          <g key={`x${t}`} transform={`translate(${x(t)},${IH})`}>
            <line y1={0} y2={4} stroke="#c9c4ba" />
            <text y={16} textAnchor="middle" fontSize={10} fill="#8a8780" fontFamily="var(--font-mono)">
              {t}
            </text>
          </g>
        ))}

        {(events ?? []).map((e, i) => {
          const cx = x(Math.max(YEAR_MIN, Math.min(YEAR_MAX, e.year)));
          const cy = y(Math.log10(e.deaths + 1));
          const dim = activeHazards.size > 0 && !activeHazards.has(e.petalKey ?? 'other');
          const isOpen = openEvent === e;
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={isOpen ? 5.5 : 4}
              fill={hazardColor(e.petalKey)}
              fillOpacity={dim ? 0.06 : 0.72}
              stroke={isOpen ? '#14161b' : 'white'}
              strokeWidth={isOpen ? 1.5 : 0.5}
              className="cursor-pointer transition-[fill-opacity] duration-200"
              style={{ pointerEvents: dim ? 'none' : 'all' }}
              onClick={() => setOpenEvent(e)}
              onMouseEnter={(ev) => {
                const rect = (ev.target as SVGElement).getBoundingClientRect();
                setTip({
                  x: rect.right,
                  y: rect.top,
                  node: (
                    <div>
                      <div className="font-mono text-[11px] text-faint">{e.year}</div>
                      <div className="font-semibold">
                        {e.name ? e.name : HAZARD_LABELS[e.petalKey ?? 'other'] ?? e.hazard_type}
                      </div>
                      <div className="mt-0.5 text-ink/70">
                        {e.deaths.toLocaleString()} deaths
                        {e.affected > 0 && <> · {e.affected.toLocaleString()} affected</>}
                      </div>
                      {e.location && <div className="mt-0.5 max-w-[220px] text-[11px] text-faint">{e.location}</div>}
                      <div className="mt-0.5 text-[11px] text-faint">click for detail</div>
                    </div>
                  ),
                });
              }}
              onMouseLeave={() => setTip(null)}
            />
          );
        })}

        <text transform={`translate(-32,${IH / 2}) rotate(-90)`} textAnchor="middle" fontSize={11} fill="#14161b">
          deaths (log₁₀) →
        </text>
      </g>
    </svg>
    {openEvent && country && (
      <EventDetail event={openEvent} country={country.country} onClose={() => setOpenEvent(null)} />
    )}
    </>
  );
}
