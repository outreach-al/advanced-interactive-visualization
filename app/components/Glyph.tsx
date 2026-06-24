'use client';

import { memo } from 'react';
import type { Country } from '../lib/types';
import { buildGlyph } from '../lib/glyph';

interface GlyphProps {
  country: Country;
  size: number;
  maxLogDeaths: number;
  showLabel?: boolean;
  isHovered?: boolean;
  isSelected?: boolean;
  activeHazard?: string | null; // when set, the other six petals fade back
}

function GlyphImpl({
  country,
  size,
  maxLogDeaths,
  showLabel = true,
  isHovered = false,
  isSelected = false,
  activeHazard = null,
}: GlyphProps) {
  const g = buildGlyph(country, size, maxLogDeaths);
  const labelSize = Math.max(8, size * 0.13);
  const strokeW = Math.max(0.5, size * 0.006);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`${country.country} hazard fingerprint`}
    >
      {/* selection / hover halo */}
      {(isHovered || isSelected) && (
        <circle
          cx={g.cx}
          cy={g.cy}
          r={size * 0.47}
          fill="none"
          stroke={isSelected ? '#14161b' : '#b0463b'}
          strokeWidth={isSelected ? size * 0.02 : size * 0.014}
          opacity={isSelected ? 0.9 : 0.7}
        />
      )}

      {g.petals.map((p) => {
        const faded = activeHazard != null && p.key !== activeHazard;
        return (
          <path
            key={p.key}
            d={p.d}
            transform={`rotate(${p.angle},${g.cx},${g.cy})`}
            fill={p.fill}
            stroke={p.stroke}
            strokeWidth={strokeW}
            strokeOpacity={faded ? 0.15 : 0.55}
            strokeLinejoin="round"
            opacity={faded ? 0.16 : 1}
            className="transition-opacity duration-300"
          />
        );
      })}

      {/* central disc keeps the label legible over petal roots */}
      <circle cx={g.cx} cy={g.cy} r={g.innerR * 0.98} fill="#f7f5f0" />

      {showLabel && (
        <text
          x={g.cx}
          y={g.cy}
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="var(--font-mono)"
          fontSize={labelSize}
          fontWeight={600}
          fill="#14161b"
          style={{ pointerEvents: 'none' }}
        >
          {country.iso3}
        </text>
      )}
    </svg>
  );
}

export const Glyph = memo(GlyphImpl);
