'use client';

import { useState } from 'react';

// "About" modal: what the project is, the data behind it, and how it was processed.
export function ProjectAbout() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-9 items-center rounded-full border border-rule px-3 text-xs font-medium text-ink/80 transition-colors hover:bg-black/[0.04]"
        aria-expanded={open}
      >
        About
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-ink/30 p-4 backdrop-blur-sm sm:p-10"
          onClick={() => setOpen(false)}
        >
          <div
            className="mt-6 max-w-2xl rounded-xl border border-rule bg-paper p-7 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-6">
              <h2 className="text-xl font-semibold tracking-tight">About this project</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="shrink-0 rounded-full border border-rule px-3 py-1 text-xs"
              >
                Close
              </button>
            </div>

            <div className="mt-5 space-y-5 text-sm leading-relaxed text-ink/80">
              <section>
                <h3 className="mb-1 font-semibold text-ink">What it is</h3>
                <p>
                  Risk Fingerprints compares what a disaster-risk model predicted against what
                  actually happened. The INFORM Risk Index forecasts each country's risk; three
                  decades of recorded disaster losses say how it really turned out. The gap between
                  the two, the signed residual, is the finding, and the whole grid is sorted by it:
                  countries where reality was worse than predicted rise to the top, those where it
                  was milder sink to the bottom.
                </p>
              </section>

              <section>
                <h3 className="mb-1 font-semibold text-ink">The data</h3>
                <ul className="space-y-1.5">
                  <li>
                    <a
                      href="https://drmkc.jrc.ec.europa.eu/inform-index"
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-ink underline decoration-rule underline-offset-2 hover:decoration-ink"
                    >
                      INFORM Risk Index 2026
                    </a>{' '}
                    (JRC, CC-BY-4.0): the predicted side. A 0 to 10 risk score per country, broken
                    down into the seven hazards shown as petals, plus a violent-conflict score used
                    on the conflict page.
                  </li>
                  <li>
                    <a
                      href="https://www.emdat.be/"
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-ink underline decoration-rule underline-offset-2 hover:decoration-ink"
                    >
                      EM-DAT
                    </a>{' '}
                    (CRED, UCLouvain): the observed side. Around 10,800 natural-disaster events from
                    1995 to 2025 with deaths, people affected and damages, covering 191 countries.
                  </li>
                </ul>
              </section>

              <section>
                <h3 className="mb-1 font-semibold text-ink">How it was processed</h3>
                <ul className="list-disc space-y-1.5 pl-4">
                  <li>
                    EM-DAT events are joined to each country and summed into per-hazard death totals.
                    Deaths use a log scale (log10) because the toll spans many orders of magnitude.
                  </li>
                  <li>
                    The residual is an ordinary least-squares fit of log deaths on the INFORM risk
                    score; each country's residual is how far its actual losses sit above or below
                    that expected line. The same fit is run per hazard, which is what the hazard
                    focus and the per-hazard numbers use.
                  </li>
                  <li>
                    EM-DAT classifies disasters as Type and Subtype. Coastal flood and tsunami are
                    split out of their parent Flood and Earthquake types so those petals carry real
                    deaths. This matters: roughly 253,000 tsunami deaths (2004 Indian Ocean, 2011
                    Tohoku) would otherwise hide inside the earthquake petal.
                  </li>
                  <li>
                    Everything is precomputed into static JSON at build time and drawn by hand with
                    SVG and D3. No chart libraries.
                  </li>
                </ul>
              </section>

              <section>
                <h3 className="mb-1 font-semibold text-ink">Honest scope</h3>
                <p>
                  This is bounded to natural hazards, where EM-DAT gives an outcome to measure the
                  prediction against. INFORM also weights human and conflict hazards, but there is no
                  matching conflict-outcome data here, so the conflict page shows the model's
                  prediction only and deliberately has no residual.
                </p>
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
