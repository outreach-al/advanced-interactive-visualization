'use client';

import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

// Reads the active theme from the class on <html> (set by ThemeToggle and the
// anti-FOUC script) and updates when it changes. SSR/first paint assume light
// to match the server output; the effect corrects it on mount.
export function useTheme(): Theme {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const el = document.documentElement;
    const read = () => setTheme(el.classList.contains('theme-dark') ? 'dark' : 'light');
    read();
    const obs = new MutationObserver(read);
    obs.observe(el, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  return theme;
}
