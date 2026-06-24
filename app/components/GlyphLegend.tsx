'use client';

import { interpolateLab } from 'd3';
import { PETAL_ORDER, HAZARD_COLORS, HAZARD_LABELS } from '../lib/palette';

const PALE = '#efece4';

// A standalone explainer for the dual encoding — used on /glyph-test and folded
// into the About panel. Renders a schematic glyph plus the two channels.
export function GlyphLegend() {
  const size = 150;
  const cx = size / 2;
  const cy = size / 2;
  const innerR = size * 0.13;
  const maxR = size * 0.45;
  const halfW = size * 0.082;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-5">
        {/* schematic glyph: each petal a different length + saturation */}
        <svg width={size} height={size} className="shrink-0">
          {PETAL_ORDER.map((key, i) => {
            const t = (i + 1) / PETAL_ORDER.length; // demo gradient
            const L = (0.35 + 0.6 * t) * (maxR - innerR);
            const tip = cy - (innerR + L);
            const w1 = cy - (innerR + L * 0.35);
            const w2 = cy - (innerR + L * 0.78);
            const d =
              `M ${cx},${cy - innerR} C ${cx + halfW},${w1} ${cx + halfW},${w2} ${cx},${tip} ` +
              `C ${cx - halfW},${w2} ${cx - halfW},${w1} ${cx},${cy - innerR} Z`;
            return (
              <path
                key={key}
                d={d}
                transform={`rotate(${(360 / PETAL_ORDER.length) * i},${cx},${cy})`}
                fill={interpolateLab(PALE, HAZARD_COLORS[key])(t)}
                stroke={HAZARD_COLORS[key]}
                strokeWidth={0.8}
                strokeOpacity={0.55}
              />
            );
          })}
          <circle cx={cx} cy={cy} r={innerR * 0.98} fill="#f7f5f0" />
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily="var(--font-mono)"
            fontSize={size * 0.13}
            fontWeight={600}
            fill="#14161b"
          >
            ISO
          </text>
        </svg>

        <dl className="space-y-3 text-sm">
          <div>
            <dt className="font-semibold">Petal length → predicted risk</dt>
            <dd className="text-ink/70">
              The hazard's INFORM risk score (0-10). Longer = the model expects
              more risk.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Petal saturation → observed deaths</dt>
            <dd className="text-ink/70">
              Log-scaled EM-DAT deaths from that hazard. Pale = few/none
              recorded; deep = many.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Angle → which hazard</dt>
            <dd className="text-ink/70">
              Fixed clockwise from the top, so the same hazard sits at the same
              angle on every country.
            </dd>
          </div>
        </dl>
      </div>

      {/* the seven petal positions, named */}
      <ol className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs sm:grid-cols-3">
        {PETAL_ORDER.map((key, i) => (
          <li key={key} className="flex items-center gap-2">
            <span className="font-mono text-faint">{i + 1}</span>
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: HAZARD_COLORS[key] }}
            />
            <span>{HAZARD_LABELS[key]}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
