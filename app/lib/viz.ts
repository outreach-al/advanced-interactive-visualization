// Registry of visualizations in the lab. Adding one is a matter of dropping a
// component under app/lab/<slug>/ and registering it here.

export interface VizEntry {
  slug: string;
  title: string;
  blurb: string;
  href: string;
  year: number;
  tags: string[];
  /** related blog post slug, if any */
  post?: string;
}

export const VIZ: VizEntry[] = [
  {
    slug: 'climate-spiral',
    title: 'Climate Spiral',
    blurb:
      'A century and a half of global temperature, wound into a spiral. Every year is a ring; the planet warms as it winds outward from the 1951 to 1980 baseline.',
    href: '/lab/climate-spiral',
    year: 2026,
    tags: ['climate', 'temperature', 'radial'],
    post: 'the-planet-in-a-spiral',
  },
  {
    slug: 'risk-fingerprints',
    title: 'Risk Fingerprints',
    blurb:
      'Where the INFORM Risk Index misses. 191 country disaster fingerprints sorted by the gap between predicted risk and three decades of observed deaths.',
    href: '/lab/risk-fingerprints',
    year: 2026,
    tags: ['disasters', 'risk', 'residuals'],
    post: 'how-i-built-risk-fingerprints',
  },
];

export const getViz = (slug: string) => VIZ.find((v) => v.slug === slug);
