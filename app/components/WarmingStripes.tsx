'use client';

import { useMemo, useState } from 'react';
import { useClimate, reportedMean } from '../lib/climate';
import { makeTempColor, chrome, fmtAnomaly } from '../lib/climateScale';
import { useTheme } from '../lib/useTheme';

const W = 920;
const H = 128;

export function WarmingStripes() {
  const { data, loading, error } = useClimate();
  const theme = useTheme();
  const tempColor = useMemo(() => makeTempColor(theme), [theme]);
  const c = chrome(theme);
  const [hover, setHover] = useState<number | null>(null); // index into stripes

  const stripes = useMemo(() => {
    if (!data) return [];
    return data.years.map((y) => ({
      year: y.year,
      value: y.annual ?? reportedMean(y) ?? 0,
      partial: y.annual === null,
    }));
  }, [data]);

  if (loading) return <p className="py-10 text-center text-faint">Loading...</p>;
  if (error || !data) return <p className="py-10 text-center text-[#b0463b]">Failed to load.</p>;

  const n = stripes.length;
  const sw = W / n;
  const active = hover !== null ? stripes[hover] : stripes[n - 1];
  const axisYears = [1880, 1920, 1960, 2000, stripes[n - 1].year];

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-sm text-ink/70">
          Each stripe is one year, {stripes[0].year} to {stripes[n - 1].year}, colored by its anomaly.
        </p>
        <p className="font-mono text-sm tabular-nums text-ink/80">
          <span className="text-ink">{active.year}</span>{' '}
          <span style={{ color: tempColor(active.value) }}>{fmtAnomaly(active.value)} C</span>
        </p>
      </div>

      <div
        className="mt-3 overflow-hidden rounded-lg"
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const i = Math.floor(((e.clientX - r.left) / r.width) * n);
          setHover(Math.max(0, Math.min(n - 1, i)));
        }}
        onMouseLeave={() => setHover(null)}
      >
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="auto" role="img" aria-label={`Warming stripes, ${stripes[0].year} to ${stripes[n - 1].year}`}>
          {stripes.map((s, i) => (
            <rect key={s.year} x={i * sw} y={0} width={sw + 0.6} height={H} fill={tempColor(s.value)} />
          ))}
          {hover !== null && (
            <rect x={hover * sw} y={0} width={sw + 0.6} height={H} fill="none" stroke={c.surface} strokeWidth={1.5} />
          )}
        </svg>
      </div>

      {/* year axis */}
      <div className="relative mt-1 h-4">
        {axisYears.map((yr) => {
          const frac = (yr - stripes[0].year) / (stripes[n - 1].year - stripes[0].year);
          return (
            <span
              key={yr}
              className="absolute font-mono text-[10px] text-faint"
              style={{ left: `${frac * 100}%`, transform: frac === 0 ? 'none' : frac === 1 ? 'translateX(-100%)' : 'translateX(-50%)' }}
            >
              {yr}
            </span>
          );
        })}
      </div>
    </div>
  );
}
