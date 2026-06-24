'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ConflictHeatmap } from '../components/ConflictHeatmap';

export default function ConflictPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/data/conflict.json')
      .then((r) => {
        if (!r.ok) throw new Error(`conflict.json ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(String(e)));
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/" className="font-mono text-xs text-faint hover:text-ink">
        ← Risk Fingerprints
      </Link>

      <p className="mt-6 font-mono text-xs uppercase tracking-[0.25em] text-faint">Bonus · conflict</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Did the model see it coming?</h1>
      <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink/80">
        A decade of INFORM&apos;s <strong>Violent Conflict Probability</strong> score (0–10), one row per
        country, one column per year (2017–2026). Sorted by the biggest rise, the model&apos;s sharpest
        escalations surface at the top — Haiti&apos;s collapse, Ecuador&apos;s gang-violence surge — alongside
        the persistent maxed-out war zones.
      </p>
      <p className="mt-3 max-w-2xl text-xs leading-relaxed text-faint">
        Honest scope: this is the model&apos;s <em>prediction</em> only. Unlike the main page, there&apos;s no
        conflict <em>outcome</em> data to measure it against — EM-DAT covers natural disasters, not armed
        conflict — so there&apos;s no residual here, just the trajectory of what INFORM expected.
      </p>

      <div className="mt-8">
        {error && <p className="text-[#b0463b]">Failed to load: {error}</p>}
        {!error && !data && <p className="text-faint">Loading…</p>}
        {data && <ConflictHeatmap data={data} />}
      </div>
    </main>
  );
}
