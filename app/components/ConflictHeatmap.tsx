'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { regionColor } from '../lib/palette';
import { conflictColor as color, type ConflictFile } from '../lib/conflict';
import { Tooltip, type TooltipData } from './Tooltip';

const ROW_H = 20;

export function ConflictHeatmap({
  data,
  hovered,
  onHover,
}: {
  data: ConflictFile;
  hovered?: string | null;
  onHover?: (iso: string | null) => void;
}) {
  const [sortBy, setSortBy] = useState<'delta' | 'latest'>('delta');
  const [query, setQuery] = useState('');
  const [tip, setTip] = useState<TooltipData | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(900);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...data.countries]
      .filter((c) => !q || c.country.toLowerCase().includes(q) || c.iso3.toLowerCase().includes(q))
      .sort((a, b) => (sortBy === 'delta' ? b.delta - a.delta : b.latest - a.latest));
  }, [data.countries, sortBy, query]);

  // Cells stretch to fill the container width (min cell keeps it readable).
  const w = Math.floor(width);
  // Compact dimensions on narrow screens so the grid fits without a side-scroll.
  const compact = w < 640;
  const LABEL_W = compact ? 92 : 220;
  const DELTA_W = compact ? 40 : 72;
  const MIN_CELL = compact ? 18 : 40;
  const showName = !compact;
  const CELL_W = Math.max(MIN_CELL, (w - LABEL_W - DELTA_W) / data.years.length);
  const gridW = Math.max(w, LABEL_W + data.years.length * MIN_CELL + DELTA_W);
  const bodyH = rows.length * ROW_H;

  return (
    <div ref={wrapRef}>
      {/* controls */}
      <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-2">
        <span className="text-xs text-faint">Sort by</span>
        {(
          [
            ['delta', 'Biggest rise 2017-2026'],
            ['latest', 'Highest 2026 risk'],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setSortBy(k)}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              sortBy === k ? 'border-ink bg-ink text-paper' : 'border-rule hover:bg-black/[0.04]'
            }`}
          >
            {label}
          </button>
        ))}
        <div className="relative ml-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search country..."
            aria-label="Search countries"
            className="h-8 w-44 rounded-full border border-ink/20 bg-white pl-3 pr-7 text-xs shadow-sm outline-none placeholder:text-faint focus:border-ink/50"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-faint hover:text-ink"
            >
              ✕
            </button>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2 text-[11px] text-faint">
          <span>0</span>
          <span className="inline-block h-2.5 w-28 rounded" style={{ background: `linear-gradient(to right, ${color(0)}, ${color(5)}, ${color(10)})` }} />
          <span>10 · conflict probability</span>
        </div>
      </div>
      {query && rows.length === 0 && <p className="py-6 text-center text-sm text-faint">No countries match "{query}".</p>}

      {/* year header — sticks to the top as the page scrolls */}
      <div className="sticky top-0 z-10 bg-paper">
      <svg width={gridW} height={22} className="block">
        {data.years.map((y, j) => (
          <text
            key={y}
            x={LABEL_W + j * CELL_W + CELL_W / 2}
            y={14}
            textAnchor="middle"
            fontSize={10}
            fontFamily="var(--font-mono)"
            fill="#8a8780"
          >
            {`'${String(y).slice(2)}`}
          </text>
        ))}
        <text x={LABEL_W + data.years.length * CELL_W + DELTA_W / 2} y={14} textAnchor="middle" fontSize={10} fill="#8a8780">
          Δ
        </text>
      </svg>
      </div>

      {/* heatmap body — flows with the page (no nested scroll) */}
      <div>
        <svg width={gridW} height={bodyH} className="block">
          {rows.map((c, i) => {
            const y = i * ROW_H;
            const name = c.country.length > 28 ? c.country.slice(0, 27) + '...' : c.country;
            return (
              <g
                key={c.iso3}
                transform={`translate(0,${y})`}
                onMouseEnter={() => onHover?.(c.iso3)}
                onMouseLeave={() => onHover?.(null)}
              >
                {hovered === c.iso3 && <rect x={0} y={0} width={gridW} height={ROW_H} fill="#14161b" opacity={0.06} />}
                <circle cx={6} cy={ROW_H / 2} r={3} fill={regionColor(c.region)} />
                <text x={15} y={ROW_H / 2} dominantBaseline="central" fontSize={10} fontFamily="var(--font-mono)" fontWeight={600} fill="#14161b">
                  {c.iso3}
                </text>
                {showName && (
                  <text x={48} y={ROW_H / 2} dominantBaseline="central" fontSize={10} fill="#14161b">
                    {name}
                  </text>
                )}
                {data.years.map((yr, j) => {
                  const s = c.scores[yr] ?? 0;
                  return (
                    <rect
                      key={yr}
                      x={LABEL_W + j * CELL_W}
                      y={1}
                      width={CELL_W - 1.5}
                      height={ROW_H - 2}
                      fill={color(s)}
                      className="cursor-pointer"
                      onMouseEnter={(e) => {
                        const r = (e.target as SVGElement).getBoundingClientRect();
                        setTip({
                          x: r.right,
                          y: r.top,
                          node: (
                            <div>
                              <div className="font-semibold">
                                {c.country} <span className="font-mono text-faint">· {yr}</span>
                              </div>
                              <div className="mt-0.5 text-ink/70">
                                conflict probability <span className="font-mono font-semibold">{s.toFixed(1)}</span> / 10
                              </div>
                            </div>
                          ),
                        });
                      }}
                      onMouseLeave={() => setTip(null)}
                    />
                  );
                })}
                <text
                  x={LABEL_W + data.years.length * CELL_W + DELTA_W - 6}
                  y={ROW_H / 2}
                  textAnchor="end"
                  dominantBaseline="central"
                  fontSize={10}
                  fontFamily="var(--font-mono)"
                  fontWeight={600}
                  fill={c.delta >= 0 ? '#b0463b' : '#5566b5'}
                >
                  {c.delta >= 0 ? '▲' : '▼'}
                  {Math.abs(c.delta).toFixed(1)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <Tooltip data={tip} />
    </div>
  );
}
