'use client';

import { useMemo, useState } from 'react';
import { useCountries } from '../lib/useData';
import { Glyph } from '../components/Glyph';
import { GlyphLegend } from '../components/GlyphLegend';

const SIZES = [60, 90, 120, 200];

export default function GlyphTest() {
  const { file, maxLogDeaths, loading, error } = useCountries();
  const [iso, setIso] = useState('CHN');

  const countries = useMemo(
    () => (file ? [...file.countries].sort((a, b) => a.country.localeCompare(b.country)) : []),
    [file],
  );
  const country = countries.find((c) => c.iso3 === iso) ?? countries[0];

  return (
    <main className="mx-auto max-w-4xl px-8 py-16">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-faint">
        Step 2 · Glyph in isolation
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        The hazard fingerprint
      </h1>

      {loading && <p className="mt-8 text-faint">Loading data…</p>}
      {error && <p className="mt-8 text-[#b0463b]">Failed to load: {error}</p>}

      {country && (
        <>
          <div className="mt-8 flex items-center gap-3">
            <label htmlFor="country" className="text-sm text-ink/70">
              Country
            </label>
            <select
              id="country"
              value={country.iso3}
              onChange={(e) => setIso(e.target.value)}
              className="rounded-md border border-rule bg-white px-3 py-1.5 font-mono text-sm"
            >
              {countries.map((c) => (
                <option key={c.iso3} value={c.iso3}>
                  {c.iso3} — {c.country}
                </option>
              ))}
            </select>
            <span className="font-mono text-xs text-faint">
              INFORM {country.informRisk.toFixed(1)} · {country.totalDeaths.toLocaleString()} deaths ·
              residual {country.residual >= 0 ? '+' : ''}
              {country.residual.toFixed(2)}
            </span>
          </div>

          <div className="mt-10 flex flex-wrap items-end gap-12">
            {SIZES.map((s) => (
              <div key={s} className="flex flex-col items-center gap-3">
                <Glyph country={country} size={s} maxLogDeaths={maxLogDeaths} />
                <span className="font-mono text-xs text-faint">{s}px</span>
              </div>
            ))}
          </div>

          <hr className="my-12 border-rule" />

          <h2 className="text-lg font-semibold">How to read it</h2>
          <div className="mt-6">
            <GlyphLegend />
          </div>

          <p className="mt-10 max-w-2xl text-sm leading-relaxed text-ink/70">
            Note the dual encoding in action: a <em>long, pale</em> petal means
            INFORM predicts high risk for that hazard but EM-DAT recorded few
            deaths; a <em>short, deep</em> petal means the opposite. The coastal
            flood and tsunami petals stay pale by construction — EM-DAT here has
            no coastal- or tsunami-specific subtype, so their deaths channel is
            empty while their predicted-risk length is still shown.
          </p>
        </>
      )}
    </main>
  );
}
