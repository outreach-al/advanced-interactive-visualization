'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { FeatureCollection } from 'geojson';
import { ConflictHeatmap } from '../components/ConflictHeatmap';
import { ConflictMap } from '../components/ConflictMap';
import type { ConflictFile } from '../lib/conflict';

export default function ConflictPage() {
  const [data, setData] = useState<ConflictFile | null>(null);
  const [geo, setGeo] = useState<FeatureCollection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/data/conflict.json').then((r) => {
        if (!r.ok) throw new Error(`conflict.json ${r.status}`);
        return r.json();
      }),
      fetch('/world-countries.geo.json').then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([c, g]) => {
        setData(c);
        setGeo(g);
      })
      .catch((e) => setError(String(e)));
  }, []);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/" className="font-mono text-xs text-faint hover:text-ink">
        ← Risk Fingerprints
      </Link>

      <p className="mt-6 font-mono text-xs uppercase tracking-[0.25em] text-faint">Bonus · conflict</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Did the model see it coming?</h1>
      <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink/80">
        A decade of INFORM&apos;s <strong>Violent Conflict Probability</strong> score (0 to 10). The map
        shows where the model expects conflict each year. Drag through 2017 to 2026 and watch the Sahel
        deteriorate and Haiti and Ecuador emerge. The heatmap below is every country&apos;s trajectory,
        sorted by the biggest rise.
      </p>
      <p className="mt-3 max-w-2xl text-xs leading-relaxed text-faint">
        Honest scope: this is the model&apos;s <em>prediction</em> only. Unlike the main page, there&apos;s no
        conflict <em>outcome</em> data to measure it against. EM-DAT covers natural disasters, not armed
        conflict, so there&apos;s no residual here, just the trajectory of what INFORM expected.
      </p>

      {error && <p className="mt-8 text-[#b0463b]">Failed to load: {error}</p>}
      {!error && !data && <p className="mt-8 text-faint">Loading...</p>}

      {data && geo && (
        <div className="mt-8">
          <ConflictMap data={data} geo={geo} hovered={hovered} onHover={setHovered} />
        </div>
      )}

      {data && (
        <div className="mt-10">
          <ConflictHeatmap data={data} hovered={hovered} onHover={setHovered} />
        </div>
      )}
    </main>
  );
}
