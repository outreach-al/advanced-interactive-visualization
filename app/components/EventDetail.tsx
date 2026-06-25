'use client';

import { useEffect, useState } from 'react';
import type { DisasterEvent } from '../lib/types';
import { HAZARD_LABELS, hazardColor } from '../lib/palette';

const MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(e: DisasterEvent): string {
  if (e.month && e.day) return `${e.day} ${MONTHS[e.month]} ${e.year}`;
  if (e.month) return `${MONTHS[e.month]} ${e.year}`;
  return String(e.year);
}

interface WikiState {
  status: 'loading' | 'found' | 'none' | 'error';
  title?: string;
  excerpt?: string;
  url?: string;
}

// On-demand Wikipedia lookup: searches live (no scraping, nothing stored) and
// shows the best-matching article's title + excerpt, or a search link if none.
function useWikipedia(event: DisasterEvent, country: string): WikiState {
  const [state, setState] = useState<WikiState>({ status: 'loading' });
  useEffect(() => {
    let alive = true;
    setState({ status: 'loading' });
    const q = event.name
      ? `${event.name} ${country} ${event.year}`
      : `${country} ${event.hazard_type} ${event.year}`;
    fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
        q,
      )}&srlimit=1&format=json&origin=*`,
    )
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        const hit = d?.query?.search?.[0];
        if (!hit) {
          setState({ status: 'none' });
          return;
        }
        setState({
          status: 'found',
          title: hit.title,
          excerpt: String(hit.snippet || '').replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&'),
          url: `https://en.wikipedia.org/wiki/${encodeURIComponent(String(hit.title).replace(/ /g, '_'))}`,
        });
      })
      .catch(() => alive && setState({ status: 'error' }));
    return () => {
      alive = false;
    };
  }, [event, country]);
  return state;
}

export function EventDetail({
  event,
  country,
  onClose,
}: {
  event: DisasterEvent;
  country: string;
  onClose: () => void;
}) {
  const wiki = useWikipedia(event, country);
  const label = HAZARD_LABELS[event.petalKey ?? 'other'] ?? event.hazard_type;
  const searchQ = event.name
    ? `${event.name} ${country} ${event.year}`
    : `${country} ${event.hazard_type} ${event.year}`;
  const searchUrl = `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(searchQ)}`;

  const stat = (n: number | undefined, lbl: string) =>
    n && n > 0 ? (
      <span>
        <span className="font-mono font-medium text-ink">{Math.round(n).toLocaleString()}</span> {lbl}
      </span>
    ) : null;

  return (
    <div className="mt-3 rounded-lg border border-rule bg-white/60 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: hazardColor(event.petalKey) }} />
            {event.name ? event.name : label}
          </div>
          <div className="mt-0.5 text-[11px] text-faint">
            {formatDate(event)}
            {event.subtype && <> · {event.subtype}</>}
            {event.magnitude ? <> · {event.magnitude} {event.magScale ?? ''}</> : null}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close event detail"
          className="shrink-0 text-faint hover:text-ink"
        >
          ✕
        </button>
      </div>

      {event.location && <p className="mt-2 text-[11px] leading-snug text-ink/70">{event.location}</p>}

      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-ink/70">
        {stat(event.deaths, 'deaths')}
        {stat(event.injured, 'injured')}
        {stat(event.affected, 'affected')}
        {stat(event.homeless, 'homeless')}
      </div>

      {/* on-demand Wikipedia lookup */}
      <div className="mt-2.5 border-t border-rule pt-2 text-[11px]">
        {wiki.status === 'loading' && <span className="text-faint">Looking up Wikipedia...</span>}
        {wiki.status === 'found' && (
          <div>
            <a
              href={wiki.url}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-ink underline decoration-rule underline-offset-2 hover:decoration-ink"
            >
              {wiki.title}
            </a>
            {wiki.excerpt && <p className="mt-0.5 leading-snug text-ink/70">{wiki.excerpt}</p>}
            <p className="mt-0.5 text-faint">Wikipedia (best match, may differ)</p>
          </div>
        )}
        {(wiki.status === 'none' || wiki.status === 'error') && (
          <a
            href={searchUrl}
            target="_blank"
            rel="noreferrer"
            className="text-faint underline decoration-rule underline-offset-2 hover:text-ink"
          >
            Search Wikipedia for this event
          </a>
        )}
      </div>
    </div>
  );
}
