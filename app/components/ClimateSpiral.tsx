'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { scaleLinear, lineRadial, curveCardinalClosed, curveCardinal } from 'd3';
import { useClimate, reportedMean, type ClimateYear } from '../lib/climate';
import { RAMP_DOMAIN, RAMP_RANGE, tempColor, fmtAnomaly as fmt } from '../lib/climateScale';

// ── Geometry ────────────────────────────────────────────────────────────────
const SIZE = 640; // svg viewBox (square)
const CX = SIZE / 2;
const CY = SIZE / 2;
const INNER_R = 66; // radius of the empty hub that holds the readout
const OUTER_R = 250; // radius mapped to the warmest month on record
const LABEL_R = OUTER_R + 26;

// Reference rings: the baseline and the two Paris-agreement thresholds.
const RINGS = [
  { value: 0, label: '0 (1951-1980 average)' },
  { value: 1.0, label: '+1.0' },
  { value: 1.5, label: '+1.5' },
];

export function ClimateSpiral() {
  const { data, loading, error } = useClimate();

  const minYear = data?.years[0].year ?? 1880;
  const maxYear = data ? data.years[data.years.length - 1].year : 2026;

  const [focusYear, setFocusYear] = useState(maxYear);
  const [playing, setPlaying] = useState(false);

  // Snap the focus to the latest fully-reported year once data arrives.
  const settledRef = useRef(false);
  useEffect(() => {
    if (data && !settledRef.current) {
      settledRef.current = true;
      setFocusYear(data.latestAnnual?.year ?? data.years[data.years.length - 1].year);
    }
  }, [data]);

  // Radius scale: coldest month → hub edge, warmest month → outer edge.
  const rScale = useMemo(() => {
    const lo = data ? Math.min(data.range.min, 0) : -0.8;
    const hi = data ? data.range.max : 1.5;
    return scaleLinear().domain([lo, hi]).range([INNER_R, OUTER_R]).clamp(true);
  }, [data]);

  // One radial path per year (closed loop when all 12 months are present).
  const yearPaths = useMemo(() => {
    if (!data) return [];
    const closed = lineRadial<{ a: number; r: number }>()
      .angle((d) => d.a)
      .radius((d) => d.r)
      .curve(curveCardinalClosed);
    const open = lineRadial<{ a: number; r: number }>()
      .angle((d) => d.a)
      .radius((d) => d.r)
      .curve(curveCardinal);

    return data.years.map((y) => {
      const pts = y.monthly
        .map((v, i) => (v === null ? null : { a: (i / 12) * 2 * Math.PI, r: rScale(v) }))
        .filter((p): p is { a: number; r: number } => p !== null);
      const complete = y.monthly.every((v) => v !== null);
      const value = y.annual ?? reportedMean(y) ?? 0;
      return {
        year: y.year,
        d: (complete ? closed : open)(pts) ?? '',
        color: tempColor(value),
      };
    });
  }, [data, rScale]);

  // Animate the focus year forward, roughly one decade per second.
  useEffect(() => {
    if (!playing || !data) return;
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = now - last;
      last = now;
      setFocusYear((prev) => {
        const next = prev + dt * 0.012; // years per ms
        if (next >= maxYear) {
          setPlaying(false);
          return maxYear;
        }
        return next;
      });
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing, data, maxYear]);

  if (loading) return <p className="py-20 text-center text-faint">Loading temperature record...</p>;
  if (error || !data) return <p className="py-20 text-center text-[#b0463b]">Failed to load: {error}</p>;

  const shownYear = Math.round(focusYear);
  const focus: ClimateYear | undefined = data.years.find((y) => y.year === shownYear);
  const focusValue = focus ? focus.annual ?? reportedMean(focus) : null;
  const focusPartial = !!focus && focus.annual === null;

  // Month label anchors (Jan at top, clockwise). d3.lineRadial uses the same
  // convention: angle 0 = 12 o'clock, x = r·sin, y = -r·cos.
  const monthAt = (i: number, r: number) => {
    const a = (i / 12) * 2 * Math.PI;
    return { x: CX + r * Math.sin(a), y: CY - r * Math.cos(a) };
  };

  return (
    <div>
      <div className="mx-auto max-w-[560px]">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          width="100%"
          height="auto"
          role="img"
          aria-label={`Global monthly temperature anomaly spiral, ${minYear} to ${maxYear}. Latest annual anomaly ${
            data.latestAnnual ? fmt(data.latestAnnual.anomaly) : 'n/a'
          } degrees Celsius above the ${data.baseline} average.`}
        >
          {/* reference rings */}
          {RINGS.map((ring) => (
            <g key={ring.value}>
              <circle
                cx={CX}
                cy={CY}
                r={rScale(ring.value)}
                fill="none"
                stroke={ring.value === 0 ? 'rgba(24,26,32,0.35)' : 'rgba(24,26,32,0.16)'}
                strokeWidth={ring.value === 0 ? 1.25 : 1}
                strokeDasharray={ring.value === 0 ? 'none' : '2 4'}
              />
              <text
                x={CX + 3}
                y={CY - rScale(ring.value) - 3}
                fontSize={10}
                fontFamily="var(--font-mono)"
                fill="rgba(24,26,32,0.55)"
                stroke="rgb(247,245,240)"
                strokeWidth={3}
                paintOrder="stroke"
              >
                {ring.label}
              </text>
            </g>
          ))}

          {/* every year up to the focus; earlier years form the trail.
              lineRadial centers at the origin, so translate to the hub. */}
          <g transform={`translate(${CX},${CY})`}>
            {yearPaths
              .filter((yp) => yp.year <= shownYear)
              .map((yp) => {
                const isFocus = yp.year === shownYear;
                return (
                  <path
                    key={yp.year}
                    d={yp.d}
                    fill="none"
                    stroke={yp.color}
                    strokeWidth={isFocus ? 2.75 : 1}
                    strokeOpacity={isFocus ? 1 : 0.5}
                    strokeLinejoin="round"
                  />
                );
              })}
          </g>

          {/* month labels */}
          {data.months.map((m, i) => {
            const { x, y } = monthAt(i, LABEL_R);
            return (
              <text
                key={m}
                x={x}
                y={y}
                dy="0.35em"
                textAnchor="middle"
                fontSize={11}
                fontFamily="var(--font-mono)"
                fill="rgba(24,26,32,0.55)"
              >
                {m}
              </text>
            );
          })}

          {/* center readout */}
          <text x={CX} y={CY - 8} textAnchor="middle" fontSize={38} fontWeight={600} fill="rgb(24,26,32)">
            {shownYear}
          </text>
          <text
            x={CX}
            y={CY + 22}
            textAnchor="middle"
            fontSize={20}
            fontFamily="var(--font-mono)"
            fontWeight={600}
            fill={focusValue !== null ? tempColor(focusValue) : 'rgba(24,26,32,0.5)'}
          >
            {focusValue !== null ? `${fmt(focusValue)} C` : 'n/a'}
          </text>
          {focusPartial && (
            <text x={CX} y={CY + 40} textAnchor="middle" fontSize={9.5} fontFamily="var(--font-mono)" fill="rgba(24,26,32,0.45)">
              partial year
            </text>
          )}
        </svg>
      </div>

      {/* transport: scrub + play */}
      <div className="mx-auto mt-4 flex max-w-[560px] items-center gap-4">
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          className="flex h-9 w-20 shrink-0 items-center justify-center gap-1.5 rounded-full border border-rule text-sm font-medium text-ink/80 transition-colors hover:bg-black/[0.04]"
          aria-label={playing ? 'Pause' : 'Play the animation from the current year'}
        >
          {playing ? (
            <>
              <span className="inline-block h-3 w-[3px] bg-current" />
              <span className="inline-block h-3 w-[3px] bg-current" />
              Pause
            </>
          ) : (
            <>
              <svg width="10" height="12" viewBox="0 0 10 12" aria-hidden>
                <path d="M0 0l10 6-10 6z" fill="currentColor" />
              </svg>
              Play
            </>
          )}
        </button>
        <input
          type="range"
          min={minYear}
          max={maxYear}
          step={1}
          value={shownYear}
          onChange={(e) => {
            setPlaying(false);
            setFocusYear(Number(e.target.value));
          }}
          className="clim-range h-1.5 flex-1 cursor-pointer appearance-none rounded-full"
          aria-label="Year"
        />
        <span className="w-10 shrink-0 text-right font-mono text-sm tabular-nums text-ink/70">{shownYear}</span>
      </div>

      {/* diverging color legend */}
      <div className="mx-auto mt-8 max-w-[440px]">
        <svg viewBox="0 0 440 40" width="100%" height="auto" role="img" aria-label="Color scale from cooler (blue) to warmer (red), in degrees Celsius">
          <defs>
            <linearGradient id="clim-grad" x1="0" x2="1">
              {RAMP_DOMAIN.map((d, i) => (
                <stop
                  key={d}
                  offset={`${((d - RAMP_DOMAIN[0]) / (RAMP_DOMAIN[RAMP_DOMAIN.length - 1] - RAMP_DOMAIN[0])) * 100}%`}
                  stopColor={RAMP_RANGE[i]}
                />
              ))}
            </linearGradient>
          </defs>
          {(() => {
            const LM = 16;
            const BW = 408; // bar spans [16, 424], leaving margin for edge labels
            const pos = (t: number) => LM + ((t - RAMP_DOMAIN[0]) / (RAMP_DOMAIN[RAMP_DOMAIN.length - 1] - RAMP_DOMAIN[0])) * BW;
            return (
              <>
                <rect x={LM} y={4} width={BW} height={12} rx={6} fill="url(#clim-grad)" />
                {[-0.5, 0, 0.5, 1.0, 1.5].map((t) => (
                  <g key={t}>
                    <line x1={pos(t)} x2={pos(t)} y1={16} y2={21} stroke="rgba(24,26,32,0.4)" strokeWidth={1} />
                    <text x={pos(t)} y={32} textAnchor="middle" fontSize={10} fontFamily="var(--font-mono)" fill="rgba(24,26,32,0.6)">
                      {fmt(t)}
                    </text>
                  </g>
                ))}
              </>
            );
          })()}
        </svg>
        <p className="mt-1 text-center font-mono text-[10px] uppercase tracking-[0.15em] text-faint">
          anomaly vs {data.baseline} average, in C
        </p>
      </div>
    </div>
  );
}
