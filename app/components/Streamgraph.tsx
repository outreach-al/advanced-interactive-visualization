'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  scaleLinear,
  stack,
  stackOffsetWiggle,
  stackOrderInsideOut,
  area as d3area,
  curveBasis,
  brushX,
  select,
  min as d3min,
  max as d3max,
} from 'd3';
import type { EventsFile } from '../lib/types';
import { PETAL_ORDER, HAZARD_COLORS, HAZARD_LABELS, hazardColor } from '../lib/palette';

const KEYS = [...PETAL_ORDER, 'other'];
const YEAR_MIN = 1995;
const YEAR_MAX = 2025;
const H = 132;
const M = { top: 8, right: 12, bottom: 20, left: 12 };
const IH = H - M.top - M.bottom;

interface StreamgraphProps {
  events: EventsFile;
  yearRange: [number, number] | null;
  activeHazard: string | null;
  onBrush: (range: [number, number] | null) => void;
}

export function Streamgraph({ events, yearRange, activeHazard, onBrush }: StreamgraphProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const brushRef = useRef<SVGGElement>(null);
  const programmaticRef = useRef(false); // true while we move the brush in code
  const [width, setWidth] = useState(900);
  const iw = Math.max(200, width - M.left - M.right);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Deaths by hazard per year, summed across all countries.
  const yearly = useMemo(() => {
    const byYear = new Map<number, Record<string, number>>();
    for (let y = YEAR_MIN; y <= YEAR_MAX; y++) {
      const o: Record<string, number> = { year: y };
      for (const k of KEYS) o[k] = 0;
      byYear.set(y, o);
    }
    for (const iso in events) {
      for (const e of events[iso]) {
        if (e.year < YEAR_MIN || e.year > YEAR_MAX) continue;
        const o = byYear.get(e.year)!;
        o[e.petalKey ?? 'other'] += e.deaths;
      }
    }
    return [...byYear.values()].sort((a, b) => a.year - b.year);
  }, [events]);

  const { x, paths } = useMemo(() => {
    const series = stack<Record<string, number>>()
      .keys(KEYS)
      .offset(stackOffsetWiggle)
      .order(stackOrderInsideOut)(yearly);

    const lo = d3min(series, (s) => d3min(s, (d) => d[0])) ?? 0;
    const hi = d3max(series, (s) => d3max(s, (d) => d[1])) ?? 1;

    const x = scaleLinear().domain([YEAR_MIN, YEAR_MAX]).range([0, iw]);
    const y = scaleLinear().domain([lo, hi]).range([IH, 0]);
    const gen = d3area<(typeof series)[0][0]>()
      .x((d) => x(d.data.year))
      .y0((d) => y(d[0]))
      .y1((d) => y(d[1]))
      .curve(curveBasis);

    const paths = series.map((s) => ({ key: s.key as string, d: gen(s) ?? '' }));
    return { x, paths };
  }, [yearly, iw]);

  // brushX → year window. Snaps to whole years; full-range clears the window.
  useEffect(() => {
    const g = select(brushRef.current);
    const brush = brushX<unknown>()
      .extent([
        [0, 0],
        [iw, IH],
      ])
      .on('end', (ev) => {
        if (programmaticRef.current) return; // ignore our own brush.move()
        if (!ev.selection) {
          onBrush(null);
          return;
        }
        const [x0, x1] = ev.selection as [number, number];
        const a = Math.max(YEAR_MIN, Math.round(x.invert(x0)));
        const b = Math.min(YEAR_MAX, Math.round(x.invert(x1)));
        onBrush(a <= YEAR_MIN && b >= YEAR_MAX ? null : [a, Math.max(a, b)]);
      });
    g.call(brush as never);
    // reflect external yearRange into the brush handles (without firing 'end')
    programmaticRef.current = true;
    if (yearRange) g.call(brush.move as never, [x(yearRange[0]), x(yearRange[1])]);
    else g.call(brush.move as never, null);
    programmaticRef.current = false;
    return () => {
      g.on('.brush', null);
      g.selectAll('*').remove();
    };
  }, [iw, x, yearRange, onBrush]);

  const xTicks = [1995, 2000, 2005, 2010, 2015, 2020, 2025];

  return (
    <div ref={wrapRef} className="w-full">
      <svg width={width} height={H} role="img" aria-label="Disaster deaths by hazard over time">
        <g transform={`translate(${M.left},${M.top})`}>
          {paths.map((p) => (
            <path
              key={p.key}
              d={p.d}
              fill={hazardColor(p.key)}
              fillOpacity={activeHazard && p.key !== activeHazard ? 0.12 : 0.85}
              className="transition-opacity duration-300"
            />
          ))}
          <g ref={brushRef} />
          {xTicks.map((t) => (
            <text
              key={t}
              x={x(t)}
              y={IH + 14}
              textAnchor="middle"
              fontSize={10}
              fontFamily="var(--font-mono)"
              fill="#8a8780"
            >
              {t}
            </text>
          ))}
        </g>
      </svg>
    </div>
  );
}

// Compact hazard key for the streamgraph, sharing the petal palette.
export function StreamLegend() {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1">
      {KEYS.map((k) => (
        <span key={k} className="flex items-center gap-1 text-[10px] text-faint">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: HAZARD_COLORS[k] }} />
          {HAZARD_LABELS[k]}
        </span>
      ))}
    </div>
  );
}
