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
              <p className="text-xs text-faint">
                Coastal-flood and tsunami saturation are empty by construction: EM-DAT here has no
                coastal- or tsunami-specific subtype, so all flood deaths go to the river-flood
                petal. Unmapped hazard types appear in the timeline as “Other.”
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
