import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

// MDX blog posts live in content/blog/<slug>.mdx with frontmatter:
//   title, date (YYYY-MM-DD), summary, tags?, viz? (related viz slug)
const BLOG_DIR = path.join(process.cwd(), 'content/blog');

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  summary: string;
  tags: string[];
  viz?: string;
}

export interface Post extends PostMeta {
  content: string;
}

function readPost(slug: string): Post {
  const raw = fs.readFileSync(path.join(BLOG_DIR, `${slug}.mdx`), 'utf8');
  const { data, content } = matter(raw);
  // YAML parses bare dates into Date objects; normalize to YYYY-MM-DD strings.
  const date =
    data.date instanceof Date ? data.date.toISOString().slice(0, 10) : String(data.date ?? '1970-01-01');
  return {
    slug,
    title: data.title ?? slug,
    date,
    summary: data.summary ?? '',
    tags: data.tags ?? [],
    viz: data.viz,
    content,
  };
}

export function getPostSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => f.replace(/\.mdx$/, ''));
}

export function getAllPosts(): PostMeta[] {
  return getPostSlugs()
    .map((slug) => {
      const { content: _content, ...meta } = readPost(slug);
      return meta;
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPost(slug: string): Post {
  return readPost(slug);
}
