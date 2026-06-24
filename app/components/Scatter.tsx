'use client';

import { useEffect, useMemo, useRef } from 'react';
import { scaleLinear, scaleSqrt, max as d3max, brush as d3brush, select } from 'd3';
import type { Country, HazardReg, Selection } from '../lib/types';
import { isDimmed } from '../lib/types';
import { regionColor, HAZARD_LABELS } from '../lib/palette';

const W = 430;
const H = 330;
const M = { top: 14, right: 16, bottom: 38, left: 44 };
const IW = W - M.left - M.right;
const IH = H - M.top - M.bottom;

const POS = '#b0463b'; // worse than predicted
const NEG = '#5566b5'; // better than predicted

interface ScatterProps {
  countries: Country[];
  regression: { slope: number; intercept: number };
  hazardRegression: Record<string, HazardReg>;
  activeHazard: string | null;
  selection: Selection;
  onHover: (iso: string | null, anchor?: { x: number; y: number }) => void;
  onSelect: (iso: string) => void;
  onBrush: (isos: Set<string> | null) => void;
}

export function Scatter({
  countries,
  regression,
  hazardRegression,
  activeHazard,
  selection,
  onHover,
  onSelect,
  onBrush,
}: ScatterProps) {
  const brushRef = useRef<SVGGElement>(null);

  // Mode-aware accessors: total deaths vs. inform_risk, OR one hazard's
  // deaths vs. that hazard's risk score. The residual story is identical.
  const m = useMemo(() => {
    const hz = (c: Country) => c.hazards.find((h) => h.key === activeHazard);
    const xVal = (c: Country) => (activeHazard ? hz(c)?.risk ?? 0 : c.informRisk);
    const yVal = (c: Country) => (activeHazard ? hz(c)?.logDeaths ?? 0 : c.logDeaths);
    const resid = (c: Country) => (activeHazard ? hz(c)?.residual ?? 0 : c.residual);
    const sizeVal = (c: Country) => (activeHazard ? hz(c)?.deaths ?? 0 : c.totalEvents);
    const reg = activeHazard ? hazardRegression[activeHazard] : regression;

    const xmax = activeHazard ? 10 : Math.ceil(d3max(countries, xVal) ?? 10);
    const ymax = Math.ceil(d3max(countries, yVal) ?? 6) || 6;
    const smax = d3max(countries, sizeVal) ?? 1;

    const x = scaleLinear().domain([0, xmax]).range([0, IW]);
    const y = scaleLinear().domain([0, ymax]).range([IH, 0]);
    const r = scaleSqrt().domain([0, smax]).range([activeHazard ? 2.5 : 2, 12]);

    const outliers = [...countries].sort((a, b) => Math.abs(resid(b)) - Math.abs(resid(a))).slice(0, 8);
    const fit = (xv: number) => reg.intercept + reg.slope * xv;
    const clampY = (v: number) => Math.max(0, Math.min(ymax, v));
    const linePts = [
      { x: x(0), y: y(clampY(fit(0))) },
      { x: x(xmax), y: y(clampY(fit(xmax))) },
    ];
    return { x, y, r, xVal, yVal, resid, sizeVal, reg, fit, clampY, outliers, linePts, ymax };
  }, [countries, regression, hazardRegression, activeHazard]);

  // d3-brush beneath the dots, so dot hover/click still work on top.
  useEffect(() => {
    const g = select(brushRef.current);
    const brush = d3brush<unknown>()
      .extent([
        [0, 0],
        [IW, IH],
      ])
      .on('end', (ev) => {
        if (!ev.selection) {
          onBrush(null);
          return;
        }
        const [[x0, y0], [x1, y1]] = ev.selection as [[number, number], [number, number]];
        const hit = new Set<string>();
        for (const c of countries) {
          const cx = m.x(m.xVal(c));
          const cy = m.y(m.yVal(c));
          if (cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1) hit.add(c.iso3);
        }
        onBrush(hit.size ? hit : null);
      });
    g.call(brush as never);
    return () => {
      g.on('.brush', null);
      g.selectAll('*').remove();
    };
  }, [countries, m, onBrush]);

  const { x, y, r } = m;
  const xTicks = x.ticks(5);
  const yTicks = y.ticks(5);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="INFORM risk vs observed deaths">
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

        {/* brush layer (below everything interactive) */}
        <g ref={brushRef} />

        {/* residual sticks — the vertical gap each dot has from the OLS line.
            This IS the quantity the grid is sorted by, drawn explicitly. */}
        {countries.map((c) => {
          const isDim = isDimmed(selection, c.iso3, c.region);
          if (isDim) return null;
          const xc = x(m.xVal(c));
          const yActual = y(m.yVal(c));
          const yFit = y(m.clampY(m.fit(m.xVal(c))));
          return (
            <line
              key={`r${c.iso3}`}
              x1={xc}
              y1={yActual}
              x2={xc}
              y2={yFit}
              stroke={m.resid(c) >= 0 ? POS : NEG}
              strokeWidth={selection.hovered === c.iso3 || selection.selected === c.iso3 ? 1.6 : 0.7}
              opacity={selection.hovered === c.iso3 || selection.selected === c.iso3 ? 0.85 : 0.28}
              style={{ pointerEvents: 'none' }}
            />
          );
        })}

        {/* OLS regression line — the "expected" relationship */}
        <line
          x1={m.linePts[0].x}
          y1={m.linePts[0].y}
          x2={m.linePts[1].x}
          y2={m.linePts[1].y}
          stroke="#14161b"
          strokeWidth={1.5}
          strokeDasharray="5 4"
          opacity={0.7}
        />

        {/* dots */}
        {countries.map((c) => {
          const isH = selection.hovered === c.iso3;
          const isS = selection.selected === c.iso3;
          const isDim = isDimmed(selection, c.iso3, c.region);
          return (
            <circle
              key={c.iso3}
              cx={x(m.xVal(c))}
              cy={y(m.yVal(c))}
              r={r(m.sizeVal(c))}
              fill={regionColor(c.region)}
              fillOpacity={isDim ? 0.12 : isH || isS ? 0.95 : 0.62}
              stroke={isS || isH ? '#14161b' : 'white'}
              strokeWidth={isS ? 2 : isH ? 1.5 : 0.5}
              className="cursor-pointer transition-[fill-opacity] duration-200"
              style={{ pointerEvents: isDim ? 'none' : 'all' }}
              onMouseEnter={(e) => {
                const rect = (e.target as SVGElement).getBoundingClientRect();
                onHover(c.iso3, { x: rect.right, y: rect.top });
              }}
              onMouseLeave={() => onHover(null)}
              onClick={() => onSelect(c.iso3)}
            />
          );
        })}

        {/* outlier labels (by current-mode residual) */}
        {m.outliers.map((c) => (
          <text
            key={c.iso3}
            x={x(m.xVal(c)) + r(m.sizeVal(c)) + 2}
            y={y(m.yVal(c)) + 3}
            fontSize={9}
            fontFamily="var(--font-mono)"
            fill="#14161b"
            opacity={isDimmed(selection, c.iso3, c.region) ? 0.12 : 0.85}
            style={{ pointerEvents: 'none' }}
          >
            {c.iso3}
          </text>
        ))}

        {/* axis titles */}
        <text x={IW / 2} y={IH + 32} textAnchor="middle" fontSize={11} fill="#14161b">
          {activeHazard ? `${HAZARD_LABELS[activeHazard]} risk score →` : 'INFORM risk score →'}
        </text>
        <text transform={`translate(-32,${IH / 2}) rotate(-90)`} textAnchor="middle" fontSize={11} fill="#14161b">
          deaths (log₁₀) →
        </text>
      </g>
    </svg>
  );
}
