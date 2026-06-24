'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { geoNaturalEarth1, geoPath, zoom as d3zoom, select, zoomIdentity, type ZoomBehavior } from 'd3';
import type { FeatureCollection } from 'geojson';
import { conflictColor, NO_DATA, type ConflictFile } from '../lib/conflict';
import { Tooltip, type TooltipData } from './Tooltip';

const W = 980;
const H = 460;

interface ConflictMapProps {
  data: ConflictFile;
  geo: FeatureCollection;
  hovered: string | null;
  onHover: (iso: string | null) => void;
}

export function ConflictMap({ data, geo, hovered, onHover }: ConflictMapProps) {
  const last = data.years[data.years.length - 1];
  const first = data.years[0];
  const [year, setYear] = useState(last);
  const [playing, setPlaying] = useState(false);
  const [tip, setTip] = useState<TooltipData | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  const byIso = useMemo(() => {
    const m = new Map<string, ConflictFile['countries'][number]>();
    for (const c of data.countries) m.set(c.iso3, c);
    return m;
  }, [data]);

  const { path, features } = useMemo(() => {
    const projection = geoNaturalEarth1().fitSize([W, H], geo);
    return { path: geoPath(projection), features: geo.features };
  }, [geo]);

  // Pan + zoom: drag to pan, wheel to zoom, applied imperatively to the <g>.
  useEffect(() => {
    if (!svgRef.current) return;
    const zoomBehavior = d3zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .translateExtent([
        [0, 0],
        [W, H],
      ])
      .on('zoom', (e) => {
        if (gRef.current) gRef.current.setAttribute('transform', e.transform.toString());
        setZoomed(e.transform.k > 1.01);
      });
    zoomRef.current = zoomBehavior;
    select(svgRef.current).call(zoomBehavior);
    return () => {
      select(svgRef.current as SVGSVGElement).on('.zoom', null);
    };
  }, []);

  const zoomBy = (k: number) => {
    if (svgRef.current && zoomRef.current) {
      select(svgRef.current).transition().duration(250).call(zoomRef.current.scaleBy, k);
    }
  };
  const resetZoom = () => {
    if (svgRef.current && zoomRef.current) {
      select(svgRef.current).transition().duration(300).call(zoomRef.current.transform, zoomIdentity);
    }
  };

  // play loop: advance one year every 800ms, looping back to the start.
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setYear((y) => (y >= last ? first : y + 1)), 800);
    return () => clearInterval(id);
  }, [playing, first, last]);

  return (
    <div>
      {/* controls */}
      <div className="mb-2 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? 'Pause' : 'Play'}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-ink/20 text-xs hover:bg-black/[0.04]"
        >
          {playing ? '❚❚' : '▶'}
        </button>
        <input
          type="range"
          min={first}
          max={last}
          step={1}
          value={year}
          onChange={(e) => {
            setPlaying(false);
            setYear(Number(e.target.value));
          }}
          aria-label="Year"
          className="h-1 flex-1 cursor-pointer accent-[#6d1410]"
        />
        <span className="w-10 shrink-0 text-right font-mono text-sm font-semibold tabular-nums">{year}</span>
      </div>

      <div className="relative">
        {/* zoom controls */}
        <div className="absolute right-2 top-2 z-10 flex flex-col gap-1">
          <button type="button" onClick={() => zoomBy(1.6)} aria-label="Zoom in" className="flex h-7 w-7 items-center justify-center rounded-md border border-ink/15 bg-white/90 text-sm shadow-sm hover:bg-white">
            +
          </button>
          <button type="button" onClick={() => zoomBy(1 / 1.6)} aria-label="Zoom out" className="flex h-7 w-7 items-center justify-center rounded-md border border-ink/15 bg-white/90 text-sm shadow-sm hover:bg-white">
            −
          </button>
          {zoomed && (
            <button type="button" onClick={resetZoom} aria-label="Reset view" title="Reset view" className="flex h-7 w-7 items-center justify-center rounded-md border border-ink/15 bg-white/90 text-[10px] shadow-sm hover:bg-white">
              ⤢
            </button>
          )}
        </div>

        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className={`w-full touch-none ${zoomed ? 'cursor-grab' : ''}`}
          role="img"
          aria-label={`World conflict probability ${year}`}
        >
          <g ref={gRef}>
            {features.map((f, i) => {
              const iso = (f.id as string) ?? '';
              const c = byIso.get(iso);
              const score = c?.scores[year];
              const isH = iso !== '-99' && hovered === iso;
              return (
                <path
                  key={i}
                  d={path(f as never) ?? undefined}
              fill={score != null ? conflictColor(score) : NO_DATA}
              stroke={isH ? '#14161b' : '#f7f5f0'}
              strokeWidth={isH ? 1.1 : 0.4}
              style={{ cursor: c ? 'pointer' : 'default' }}
              onMouseEnter={(e) => {
                onHover(iso);
                if (!c) return;
                const r = (e.target as SVGElement).getBoundingClientRect();
                setTip({
                  x: r.left + r.width / 2,
                  y: r.top,
                  node: (
                    <div>
                      <div className="font-semibold">
                        {c.country} <span className="font-mono text-faint">· {year}</span>
                      </div>
                      <div className="mt-0.5 text-ink/70">
                        conflict probability{' '}
                        <span className="font-mono font-semibold">{(score ?? 0).toFixed(1)}</span> / 10
                      </div>
                    </div>
                  ),
                });
              }}
              onMouseLeave={() => {
                onHover(null);
                setTip(null);
                  }}
                />
              );
            })}
          </g>
        </svg>
      </div>
      <p className="mt-1 text-[11px] text-faint">
        Drag to pan · scroll or +/- to zoom · slider/play to watch 2017-2026 · grey = no INFORM score (mostly microstates)
      </p>
      <Tooltip data={tip} />
    </div>
  );
}
