import Link from 'next/link';
import type { MDXComponents } from 'mdx/types';

// Styling for MDX content. Custom components (incl. live viz embeds) can be
// added here later so posts can drop them in by name.
export const mdxComponents: MDXComponents = {
  h2: (props) => <h2 className="mt-10 text-xl font-semibold tracking-tight" {...props} />,
  h3: (props) => <h3 className="mt-8 text-lg font-semibold tracking-tight" {...props} />,
  p: (props) => <p className="mt-4 leading-relaxed text-ink/85" {...props} />,
  ul: (props) => <ul className="mt-4 list-disc space-y-1.5 pl-5 text-ink/85" {...props} />,
  ol: (props) => <ol className="mt-4 list-decimal space-y-1.5 pl-5 text-ink/85" {...props} />,
  li: (props) => <li className="leading-relaxed" {...props} />,
  a: ({ href = '', ...props }) => {
    const cls = 'font-medium text-ink underline decoration-rule underline-offset-2 hover:decoration-ink';
    return href.startsWith('/') ? <Link href={href} className={cls} {...props} /> : <a href={href} className={cls} {...props} />;
  },
  blockquote: (props) => <blockquote className="mt-4 border-l-2 border-rule pl-4 text-ink/70" {...props} />,
  code: (props) => <code className="rounded bg-black/[0.05] px-1 py-0.5 font-mono text-[0.85em]" {...props} />,
  pre: (props) => (
    <pre className="mt-4 overflow-x-auto rounded-lg border border-rule bg-black/[0.03] p-4 font-mono text-[12px] leading-relaxed" {...props} />
  ),
  hr: () => <hr className="my-8 border-rule" />,
};
