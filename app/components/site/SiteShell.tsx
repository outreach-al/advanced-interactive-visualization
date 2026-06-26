import Link from 'next/link';

// Shared chrome for the content pages (landing, lab gallery, blog). The
// full-screen visualizations opt out of this and render bare.
export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-rule">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-base font-semibold tracking-tight">
            Kurtoza
            <span className="ml-2 hidden text-sm font-normal text-faint sm:inline">a data-visualization lab</span>
          </Link>
          <nav className="flex items-center gap-5 text-sm">
            <Link href="/lab" className="text-ink/80 transition-colors hover:text-ink">
              Lab
            </Link>
            <Link href="/blog" className="text-ink/80 transition-colors hover:text-ink">
              Blog
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">{children}</main>

      <footer className="border-t border-rule">
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-2 px-6 py-8 text-xs text-faint sm:flex-row sm:items-center">
          <span>Kurtoza · data-visualization experiments</span>
          <span>Built with Next.js, TypeScript and D3. Every mark hand-drawn in SVG.</span>
        </div>
      </footer>
    </div>
  );
}
