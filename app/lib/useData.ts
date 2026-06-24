'use client';

import { useEffect, useState } from 'react';
import type { CountriesFile, EventsFile } from './types';
import { maxHazardLogDeaths } from './glyph';

interface CountriesState {
  file: CountriesFile | null;
  maxLogDeaths: number;
  loading: boolean;
  error: string | null;
}

// Fetches public/data/countries.json once. Static file → cached by the browser.
export function useCountries(): CountriesState {
  const [state, setState] = useState<CountriesState>({
    file: null,
    maxLogDeaths: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let alive = true;
    fetch('/data/countries.json')
      .then((r) => {
        if (!r.ok) throw new Error(`countries.json ${r.status}`);
        return r.json();
      })
      .then((file: CountriesFile) => {
        if (!alive) return;
        setState({
          file,
          maxLogDeaths: maxHazardLogDeaths(file.countries),
          loading: false,
          error: null,
        });
      })
      .catch((e) => alive && setState((s) => ({ ...s, loading: false, error: String(e) })));
    return () => {
      alive = false;
    };
  }, []);

  return state;
}

// Fetches the (larger) events file once, lazily — only the timeline needs it.
export function useEvents(): EventsFile | null {
  const [events, setEvents] = useState<EventsFile | null>(null);
  useEffect(() => {
    let alive = true;
    fetch('/data/events.json')
      .then((r) => r.json())
      .then((e: EventsFile) => alive && setEvents(e))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return events;
}
