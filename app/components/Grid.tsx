'use client';

import { useMemo } from 'react';
import type { Country, Selection } from '../lib/types';
import { HAZARD_LABELS } from '../lib/palette';
import { Glyph } from './Glyph';

const GLYPH_SIZE = 86;

interface GridProps {
  countries: Country[]; // pre-sorted by residual, descending
  maxLogDeaths: number;
  selection: Selection;
  activeHazard: string | null;
  onHover: (iso: string | null, anchor?: { x: number; y: number }) => void;
  onSelect: (iso: string) => void;
}

// Sort/split key: the active hazard's residual when focused, else the global one.
const residualOf = (c: Country, activeHazard: string | null) =>
  activeHazard ? c.hazards.find((h) => h.key === activeHazard)?.residual ?? 0 : c.residual;

interface CellProps {
  c: Country;
  maxLogDeaths: number;
  activeHazard: string | null;
  isHovered: boolean;
  isSelected: boolean;
  isDimmed: boolean;
  onHover: GridProps['onHover'];
  onSelect: GridProps['onSelect'];
}

function Cell({ c, maxLogDeaths, activeHazard, isHovered, isSelected, isDimmed, onHover, onSelect }: CellProps) {
  return (
    <button
      type="button"
      onMouseEnter={(e) => {
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
        onHover(c.iso3, { x: r.right - 8, y: r.top });
      }}
      onMouseLeave={() => onHover(null)}
      onFocus={(e) => {
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
        onHover(c.iso3, { x: r.right - 8, y: r.top });
      }}
      onBlur={() => onHover(null)}
      onClick={() => onSelect(c.iso3)}
      className="flex items-center justify-center rounded-lg p-1 outline-none transition-opacity duration-300 hover:bg-black/[0.03] focus-visible:ring-2 focus-visible:ring-[#b0463b]"
      style={{ opacity: isDimmed ? 0.12 : 1 }}
      aria-label={`${c.country}, residual ${c.residual.toFixed(2)}`}
    >
      <Glyph
        country={c}
        size={GLYPH_SIZE}
        maxLogDeaths={maxLogDeaths}
        isHovered={isHovered}
        isSelected={isSelected}
        activeHazard={activeHazard}
      />
    </button>
  );
}

function Section({
  items,
  ...rest
}: { items: Country[] } & Omit<GridProps, 'countries'>) {
  return (
    <div
      className="grid gap-1 px-4"
      style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${GLYPH_SIZE + 8}px, 1fr))` }}
    >
      {items.map((c) => (
        <Cell
          key={c.iso3}
          c={c}
          maxLogDeaths={rest.maxLogDeaths}
          activeHazard={rest.activeHazard}
          isHovered={rest.selection.hovered === c.iso3}
          isSelected={rest.selection.selected === c.iso3}
          isDimmed={!!rest.selection.brushed && !rest.selection.brushed.has(c.iso3)}
          onHover={rest.onHover}
          onSelect={rest.onSelect}
        />
      ))}
    </div>
  );
}

export function Grid(props: GridProps) {
  const { countries, activeHazard } = props;
  const hazardLabel = activeHazard ? HAZARD_LABELS[activeHazard] : null;

  const { worse, better } = useMemo(() => {
    const sorted = activeHazard
      ? [...countries].sort((a, b) => residualOf(b, activeHazard) - residualOf(a, activeHazard))
      : countries; // already globally sorted
    const worse: Country[] = [];
    const better: Country[] = [];
    for (const c of sorted) (residualOf(c, activeHazard) >= 0 ? worse : better).push(c);
    return { worse, better };
  }, [countries, activeHazard]);

  const brushedCount = props.selection.brushed?.size ?? null;

  return (
    <div className="fp-scroll pb-24 lg:h-full lg:overflow-y-auto">
      {/* top band — the sort principle, stated up front */}
      <div className="sticky top-0 z-10 border-b border-rule bg-paper/95 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold tracking-tight">
            ↑ Worse than predicted
          </h2>
          <span className="font-mono text-[11px] text-faint">
            {brushedCount !== null
              ? `${brushedCount} brushed`
              : hazardLabel
                ? `sorted by ${hazardLabel} error`
                : `${countries.length} countries · sorted by model error`}
          </span>
        </div>
        <p className="mt-0.5 text-[11px] text-faint">
          {hazardLabel
            ? `${hazardLabel} deaths exceed the INFORM ${hazardLabel.toLowerCase()} prediction`
            : 'actual disaster deaths exceed the INFORM prediction'}
        </p>
      </div>

      <div className="pt-3">
        <Section items={worse} {...props} />
      </div>

      {/* the "expected" divider — where model and reality agree */}
      <div className="my-5 flex items-center gap-3 px-6" aria-hidden>
        <div className="h-px flex-1 bg-ink/40" />
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink/60">
          expected · model = reality
        </span>
        <div className="h-px flex-1 bg-ink/40" />
      </div>

      <div className="px-4 pb-1">
        <h2 className="text-sm font-semibold tracking-tight text-ink/70">
          ↓ Better than predicted
        </h2>
        <p className="mt-0.5 text-[11px] text-faint">
          actual deaths fall below the INFORM prediction
        </p>
      </div>

      <div className="pt-2">
        <Section items={better} {...props} />
      </div>
    </div>
  );
}
