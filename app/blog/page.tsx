import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteShell } from '@/app/components/site/SiteShell';
import { getAllPosts } from '@/app/lib/blog';

export const metadata: Metadata = {
  title: 'Blog · Kurtoza',
  description: 'Notes on building data visualizations.',
};

export default function BlogPage() {
  const posts = getAllPosts();
  return (
    <SiteShell>
      <header className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">Blog</h1>
        <p className="mt-3 text-ink/80">Notes on the experiments: what I tried, what broke, and why.</p>
      </header>

      {posts.length === 0 ? (
        <p className="mt-10 text-faint">No posts yet.</p>
      ) : (
        <ul className="mt-10 divide-y divide-rule border-t border-rule">
          {posts.map((p) => (
            <li key={p.slug}>
              <Link href={`/blog/${p.slug}`} className="block py-5 transition-colors hover:bg-black/[0.015]">
                <div className="flex items-baseline justify-between gap-4">
                  <h2 className="text-lg font-medium">{p.title}</h2>
                  <span className="shrink-0 font-mono text-xs text-faint">{p.date}</span>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-ink/70">{p.summary}</p>
                {p.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {p.tags.map((t) => (
                      <span key={t} className="font-mono text-[11px] text-faint">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SiteShell>
  );
}
