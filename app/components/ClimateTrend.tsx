'use client';

import { useMemo, useState } from 'react';
import { scaleLinear, area as d3area, line as d3line, curveMonotoneX } from 'd3';
import { useClimate } from '../lib/climate';
import { tempColor, fmtAnomaly } from '../lib/climateScale';

const VBW = 900;
const VBH = 340;
const M = { top: 22, right: 52, bottom: 30, left: 42 };
const IW = VBW - M.left - M.right;
const IH = VBH - M.top - M.bottom;

const Y_DOMAIN: [number, number] = [-0.5, 1.5];
const Y_TICKS = [-0.5, 0, 0.5, 1.0, 1.5];
const X_TICKS = [1880, 1900, 1920, 1940, 1960, 1980, 2000, 2020];

export function ClimateTrend() {
  const { data, loading, error } = useClimate();
  const [hoverYear, setHoverYear] = useState<number | null>(null);

  // Only fully-reported years get a point on the annual line.
  const series = useMemo(
    () => (data ? data.years.filter((y) => y.annual !== null).map((y) => ({ year: y.year, v: y.annual as number })) : []),
    [data],
  );

  const geom = useMemo(() => {
    if (!series.length) return null;
    const x = scaleLinear().domain([series[0].year, series[series.length - 1].year]).range([M.left, M.left + IW]);
    const y = scaleLinear().domain(Y_DOMAIN).range([M.top + IH, M.top]);
    const area = d3area<{ year: number; v: number }>()
      .x((d) => x(d.year))
      .y0(y(0))
      .y1((d) => y(d.v))
      .curve(curveMonotoneX);
    const line = d3line<{ year: number; v: number }>()
      .x((d) => x(d.year))
      .y((d) => y(d.v))
      .curve(curveMonotoneX);
    return { x, y, areaD: area(series) ?? '', lineD: line(series) ?? '' };
  }, [series]);

  if (loading) return <p className="py-10 text-center text-faint">Loading...</p>;
  if (error || !data || !geom) return <p className="py-10 text-center text-[#b0463b]">Failed to load.</p>;

  const { x, y } = geom;
  const last = series[series.length - 1];
  const hovered = hoverYear !== null ? series.find((d) => d.year === hoverYear) : undefined;
  const focus = hovered ?? last;

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-sm text-ink/70">Annual global anomaly, {series[0].year} to {last.year}.</p>
        <p className="font-mono text-sm tabular-nums text-ink/80">
          <span className="text-ink">{focus.year}</span>{' '}
          <span style={{ color: tempColor(focus.v) }}>{fmtAnomaly(focus.v)} C</span>
        </p>
      </div>

      <svg
        viewBox={`0 0 ${VBW} ${VBH}`}
        width="100%"
        height="auto"
        className="mt-3"
        role="img"
        aria-label={`Global annual temperature anomaly from ${series[0].year} to ${last.year}, ending at ${fmtAnomaly(last.v)} degrees Celsius.`}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const vbX = ((e.clientX - r.left) / r.width) * VBW;
          const yr = Math.round(x.invert(vbX));
          const clamped = Math.max(series[0].year, Math.min(last.year, yr));
          setHoverYear(clamped);
        }}
        onMouseLeave={() => setHoverYear(null)}
      >
        <defs>
          <linearGradient id="trend-grad" gradientUnits="userSpaceOnUse" x1={0} y1={y(1.5)} x2={0} y2={y(-0.8)}>
            <stop offset="0%" stopColor="#8f1a24" />
            <stop offset={`${((1.5 - 1.0) / 2.3) * 100}%`} stopColor="#cf5a3c" />
            <stop offset={`${((1.5 - 0.5) / 2.3) * 100}%`} stopColor="#eaa15a" />
            <stop offset={`${((1.5 - 0.0) / 2.3) * 100}%`} stopColor="#dcd8ce" />
            <stop offset={`${((1.5 + 0.3) / 2.3) * 100}%`} stopColor="#6f86d6" />
            <stop offset="100%" stopColor="#2f3a9e" />
          </linearGradient>
        </defs>

        {/* y gridlines + labels */}
        {Y_TICKS.map((t) => (
          <g key={t}>
            <line
              x1={M.left}
              x2={M.left + IW}
              y1={y(t)}
              y2={y(t)}
              stroke={t === 0 ? 'rgba(24,26,32,0.35)' : 'rgba(24,26,32,0.10)'}
              strokeWidth={t === 0 ? 1.25 : 1}
              strokeDasharray={t === 1.0 || t === 1.5 ? '3 4' : 'none'}
            />
            <text x={M.left - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize={11} fontFamily="var(--font-mono)" fill="rgba(24,26,32,0.5)">
              {fmtAnomaly(t)}
            </text>
          </g>
        ))}
        {/* Paris threshold labels at the right */}
        {[1.0, 1.5].map((t) => (
          <text key={t} x={M.left + IW + 6} y={y(t)} dy="0.32em" fontSize={10} fontFamily="var(--font-mono)" fill="rgba(24,26,32,0.45)">
            {`+${t.toFixed(1)}`}
          </text>
        ))}

        {/* area + line */}
        <path d={geom.areaD} fill="url(#trend-grad)" fillOpacity={0.9} />
        <path d={geom.lineD} fill="none" stroke="rgba(24,26,32,0.7)" strokeWidth={1.5} strokeLinejoin="round" />

        {/* x axis */}
        {X_TICKS.map((t) => (
          <text key={t} x={x(t)} y={VBH - 10} textAnchor="middle" fontSize={11} fontFamily="var(--font-mono)" fill="rgba(24,26,32,0.5)">
            {t}
          </text>
        ))}

        {/* hover crosshair */}
        {hovered && (
          <g>
            <line x1={x(hovered.year)} x2={x(hovered.year)} y1={M.top} y2={M.top + IH} stroke="rgba(24,26,32,0.35)" strokeWidth={1} />
            <circle cx={x(hovered.year)} cy={y(hovered.v)} r={4} fill={tempColor(hovered.v)} stroke="rgb(247,245,240)" strokeWidth={1.5} />
          </g>
        )}
      </svg>
    </div>
  );
}
