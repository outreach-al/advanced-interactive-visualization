'use client';

import { useState } from 'react';
import { GlyphLegend } from './GlyphLegend';

// Collapsible "How to read this" — folds the encoding explainer into the header.
export function About() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="rounded-full border border-rule px-3 py-1 text-xs font-medium text-ink/80 transition-colors hover:bg-black/[0.04]"
        aria-expanded={open}
      >
        {open ? 'Close' : 'How to read this'}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 flex items-start justify-center bg-ink/30 p-4 backdrop-blur-sm sm:p-10"
          onClick={() => setOpen(false)}
        >
          <div
            className="mt-6 max-w-2xl rounded-xl border border-rule bg-paper p-7 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-6">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">How to read this</h2>
                <p className="mt-1 text-sm text-ink/70">
                  Every country is a fingerprint of seven hazards. Two channels on one mark:
                  predicted risk and observed reality.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-rule px-3 py-1 text-xs"
              >
                Close
              </button>
            </div>

            <div className="mt-6">
              <GlyphLegend />
            </div>

            <div className="mt-6 space-y-2 border-t border-rule pt-5 text-sm text-ink/70">
              <p>
                <strong className="text-ink">The grid is sorted by model error.</strong> Top =
                actual deaths exceed the INFORM prediction; bottom = below. The line in the
                middle is where the model and reality agree.
              </p>
              <p>
                <strong className="text-ink">Hover</strong> a glyph or dot to link the views ·{' '}
                <strong className="text-ink">click</strong> to drill into a country's events ·{' '}
                <strong className="text-ink">drag</strong> a box on the scatter to filter the grid ·{' '}
                <strong className="text-ink">Esc</strong> clears.
              </p>
              <p>
                <strong className="text-ink">Focus a hazard</strong> (the chips by the scatter) to
                re-sort the grid and the scatter by that single hazard's model error — the same
                residual analysis, run per hazard. The <strong className="text-ink">sticks</strong> on
                the scatter draw each country's residual: its vertical distance from the expected line.
              </p>
              <p>
                The <strong className="text-ink">shaded band</strong> on the scatter is ±1σ and ±2σ of
                the residuals around the OLS line. A country whose stick reaches past the band is a
                <em> statistically real</em> model miss, not just noise — the caption counts how many
                fall beyond ±2σ.
              </p>
              <p>
                The <strong className="text-ink">streamgraph</strong> at the bottom is disaster deaths by
                hazard per year (1995–2025). <strong className="text-ink">Brush a year range</strong> and
                the entire grid + scatter recompute their residuals for just that era — so you can see
                that a country is a model miss only because of one event (e.g. brush 2004 to surface the
                tsunami nations).
              </p>
              <p>
                <strong className="text-ink">Click the legends</strong> to filter: the region legend
                isolates regions across the scatter and the grid; the timeline legend shows only the
                selected hazard types. Both are multi-select toggles.
              </p>
              <p>
                <strong className="text-ink">Search</strong> a country by name or ISO code to locate it.
                Selecting one shows its enlarged fingerprint with per-hazard numbers; <strong className="text-ink">Pin to compare</strong>{' '}
                stacks several side by side in the tray below. The current view (hazard, selection,
                filters, pins) is saved to the <strong className="text-ink">URL</strong>, so any state is
                shareable as a link.
              </p>
              <p className="text-xs text-faint">
                Coastal flood and tsunami are split out of EM-DAT&apos;s Flood and Earthquake types
                by subtype, so those petals carry real deaths (notably ~253k tsunami deaths that
                would otherwise hide in the earthquake petal). Hazard types with no INFORM petal
                appear in the timeline as “Other.”
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
