import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { SiteShell } from '@/app/components/site/SiteShell';
import { mdxComponents } from '@/app/components/site/mdx';
import { getPost, getPostSlugs } from '@/app/lib/blog';
import { getViz } from '@/app/lib/viz';

export function generateStaticParams() {
  return getPostSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  try {
    const p = getPost(params.slug);
    return { title: `${p.title} · Kurtoza`, description: p.summary };
  } catch {
    return { title: 'Post · Kurtoza' };
  }
}

export default function PostPage({ params }: { params: { slug: string } }) {
  let post;
  try {
    post = getPost(params.slug);
  } catch {
    notFound();
  }
  const viz = post.viz ? getViz(post.viz) : undefined;

  return (
    <SiteShell>
      <article className="mx-auto max-w-2xl">
        <Link href="/blog" className="font-mono text-xs text-faint hover:text-ink">
          ← Blog
        </Link>
        <header className="mt-6">
          <p className="font-mono text-xs text-faint">{post.date}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{post.title}</h1>
          {post.summary && <p className="mt-3 text-lg leading-relaxed text-ink/70">{post.summary}</p>}
          {viz && (
            <Link
              href={viz.href}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-rule px-3 py-1 text-xs font-medium text-ink/80 hover:bg-black/[0.04]"
            >
              Open the live visualization: {viz.title}
            </Link>
          )}
        </header>

        <div className="mt-8">
          <MDXRemote source={post.content} components={mdxComponents} />
        </div>
      </article>
    </SiteShell>
  );
}
