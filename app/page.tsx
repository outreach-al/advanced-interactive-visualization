import Link from 'next/link';
import { SiteShell } from '@/app/components/site/SiteShell';
import { VIZ } from '@/app/lib/viz';
import { getAllPosts } from '@/app/lib/blog';

export default function Home() {
  const featured = VIZ[0];
  const posts = getAllPosts().slice(0, 3);

  return (
    <SiteShell>
      {/* hero */}
      <section className="max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-faint">Data-visualization lab</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
          Experiments in making data legible.
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-ink/80">
          Custom, hand-built visualizations and write-ups about how they are made. No chart libraries,
          just D3 and SVG, and an interest in the gap between what models predict and what actually happens.
        </p>
        <div className="mt-6 flex gap-4 text-sm">
          <Link href="/lab" className="rounded-full bg-ink px-4 py-2 font-medium text-paper transition-colors hover:bg-ink/90">
            See the lab
          </Link>
          <Link href="/blog" className="rounded-full border border-rule px-4 py-2 font-medium text-ink/80 transition-colors hover:bg-black/[0.04]">
            Read the blog
          </Link>
        </div>
      </section>

      {/* featured viz */}
      {featured && (
        <section className="mt-16">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-faint">Featured</h2>
          <Link
            href={featured.href}
            className="mt-3 block rounded-xl border border-rule p-6 transition-colors hover:border-ink/30 hover:bg-black/[0.015]"
          >
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="text-xl font-semibold tracking-tight">{featured.title}</h3>
              <span className="font-mono text-xs text-faint">{featured.year}</span>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink/70">{featured.blurb}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {featured.tags.map((t) => (
                <span key={t} className="rounded-full border border-rule px-2 py-0.5 font-mono text-[11px] text-faint">
                  {t}
                </span>
              ))}
            </div>
          </Link>
        </section>
      )}

      {/* latest posts */}
      {posts.length > 0 && (
        <section className="mt-16">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-faint">Latest writing</h2>
            <Link href="/blog" className="text-sm text-ink/70 hover:text-ink">
              All posts
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-rule border-t border-rule">
            {posts.map((p) => (
              <li key={p.slug}>
                <Link href={`/blog/${p.slug}`} className="block py-4 transition-colors hover:bg-black/[0.015]">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="font-medium">{p.title}</h3>
                    <span className="shrink-0 font-mono text-xs text-faint">{p.date}</span>
                  </div>
                  <p className="mt-1 text-sm text-ink/70">{p.summary}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </SiteShell>
  );
}
