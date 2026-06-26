import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteShell } from '@/app/components/site/SiteShell';
import { VIZ } from '@/app/lib/viz';

export const metadata: Metadata = {
  title: 'Lab · Kurtoza',
  description: 'A gallery of custom data visualizations.',
};

export default function LabPage() {
  return (
    <SiteShell>
      <header className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">Lab</h1>
        <p className="mt-3 text-ink/80">
          Custom visualizations, each hand-built with D3 and SVG. More on the way.
        </p>
      </header>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {VIZ.map((v) => (
          <Link
            key={v.slug}
            href={v.href}
            className="flex flex-col rounded-xl border border-rule p-5 transition-colors hover:border-ink/30 hover:bg-black/[0.015]"
          >
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-lg font-semibold tracking-tight">{v.title}</h2>
              <span className="font-mono text-xs text-faint">{v.year}</span>
            </div>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-ink/70">{v.blurb}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {v.tags.map((t) => (
                <span key={t} className="rounded-full border border-rule px-2 py-0.5 font-mono text-[11px] text-faint">
                  {t}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </SiteShell>
  );
}
