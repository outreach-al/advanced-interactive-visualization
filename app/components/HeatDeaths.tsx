'use client';

import { useEffect, useMemo, useState } from 'react';
import { scaleLinear } from 'd3';
import { chrome } from '../lib/climateScale';
import { useTheme } from '../lib/useTheme';

interface HeatYear {
  year: number;
  deaths: number;
  events: number;
}
interface HeatFile {
  source: string;
  total: number;
  years: HeatYear[];
}

const VBW = 900;
const VBH = 330;
// Margins match ClimateTrend so the two charts' plot areas line up when stacked.
const M = { top: 30, right: 52, bottom: 28, left: 42 };
const IW = VBW - M.left - M.right;
const IH = VBH - M.top - M.bottom;

const Y_MAX = 80000;
const Y_TICKS = [0, 20000, 40000, 60000, 80000];

// Editorial annotations for the historic spikes.
const NOTES: Record<number, string> = { 2003: 'Europe', 2010: 'Russia' };

const fmtK = (v: number) => (v >= 1000 ? `${v / 1000}k` : `${v}`);

export function HeatDeaths() {
  const [data, setData] = useState<HeatFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hover, setHover] = useState<number | null>(null); // year
  const theme = useTheme();
  const c = chrome(theme);
  // single warm hue; bar height carries the magnitude (brighter on dark)
  const bar = theme === 'dark' ? '#d76a52' : '#b0463b';

  useEffect(() => {
    let alive = true;
    fetch('/data/heat.json')
      .then((r) => {
        if (!r.ok) throw new Error(`heat.json ${r.status}`);
        return r.json();
      })
      .then((d: HeatFile) => alive && setData(d))
      .catch((e) => alive && setError(String(e)));
    return () => {
      alive = false;
    };
  }, []);

  const geom = useMemo(() => {
    if (!data) return null;
    const years = data.years;
    const band = IW / years.length;
    const barW = band - 3;
    const y = scaleLinear().domain([0, Y_MAX]).range([M.top + IH, M.top]);
    return { years, band, barW, y };
  }, [data]);

  if (error) return <p className="py-10 text-center text-[#b0463b]">Failed to load.</p>;
  if (!data || !geom) return <p className="py-10 text-center text-faint">Loading...</p>;

  const { years, band, barW, y } = geom;
  const active = hover !== null ? years.find((d) => d.year === hover) : years[years.length - 1];

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-sm text-ink/70">
          Recorded heat-wave deaths per year, {years[0].year} to {years[years.length - 1].year}.
        </p>
        {active && (
          <p className="font-mono text-sm tabular-nums text-ink/80">
            <span className="text-ink">{active.year}</span>{' '}
            <span style={{ color: bar }}>{active.deaths.toLocaleString()}</span>
            <span className="text-faint"> deaths / {active.events} events</span>
          </p>
        )}
      </div>

      <svg
        viewBox={`0 0 ${VBW} ${VBH}`}
        width="100%"
        height="auto"
        className="mt-3"
        role="img"
        aria-label={`Recorded heat-wave deaths per year from ${years[0].year} to ${years[years.length - 1].year}. Total ${data.total.toLocaleString()} deaths, with the largest counts in 2003, 2010, and the early 2020s.`}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const vbX = ((e.clientX - r.left) / r.width) * VBW;
          const i = Math.floor((vbX - M.left) / band);
          setHover(i >= 0 && i < years.length ? years[i].year : null);
        }}
        onMouseLeave={() => setHover(null)}
      >
        {/* y gridlines + labels */}
        {Y_TICKS.map((t) => (
          <g key={t}>
            <line x1={M.left} x2={M.left + IW} y1={y(t)} y2={y(t)} stroke={c.ink(0.1)} strokeWidth={1} />
            <text x={M.left - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize={11} fontFamily="var(--font-mono)" fill={c.ink(0.5)}>
              {fmtK(t)}
            </text>
          </g>
        ))}

        {/* bars */}
        {years.map((d, i) => {
          const x = M.left + i * band + 1.5;
          const h = y(0) - y(d.deaths);
          const isHover = hover === d.year;
          return (
            <rect
              key={d.year}
              x={x}
              y={y(d.deaths)}
              width={barW}
              height={h}
              rx={3}
              fill={bar}
              fillOpacity={hover === null || isHover ? 1 : 0.5}
            />
          );
        })}

        {/* annotations for the historic spikes */}
        {years.map((d, i) => {
          const note = NOTES[d.year];
          if (!note) return null;
          const x = M.left + i * band + barW / 2 + 1.5;
          return (
            <text key={`n-${d.year}`} x={x} y={y(d.deaths) - 8} textAnchor="middle" fontSize={11} fontFamily="var(--font-mono)" fill={c.ink(0.6)}>
              {note}
            </text>
          );
        })}

        {/* x axis: every fifth year plus the last */}
        {years.map((d, i) => {
          if (d.year % 5 !== 0 && i !== years.length - 1) return null;
          const x = M.left + i * band + barW / 2 + 1.5;
          return (
            <text key={`x-${d.year}`} x={x} y={VBH - 9} textAnchor="middle" fontSize={11} fontFamily="var(--font-mono)" fill={c.ink(0.5)}>
              {d.year}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
