'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const STORE_KEY = 'fp-sidebar-w';
const DEFAULT = 540;
const MIN = 380;
// Leave at least this much room for the grid on the left.
const GRID_MIN = 420;

// Drives a draggable vertical split: the right sidebar's pixel width on desktop,
// clamped so the grid keeps a usable minimum. Persisted to localStorage.
export function useResizableSidebar() {
  const [width, setWidth] = useState(DEFAULT);
  const [isDesktop, setIsDesktop] = useState(false);
  const [dragging, setDragging] = useState(false);
  const draggingRef = useRef(false);

  // Track the lg breakpoint + restore any saved width (client-only).
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    const saved = Number(localStorage.getItem(STORE_KEY));
    if (Number.isFinite(saved) && saved >= MIN) setWidth(saved);
    return () => mq.removeEventListener('change', update);
  }, []);

  const clamp = (w: number) => Math.max(MIN, Math.min(w, window.innerWidth - GRID_MIN));

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      setWidth(clamp(window.innerWidth - e.clientX));
    };
    const onUp = () => {
      draggingRef.current = false;
      setDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      setWidth((w) => {
        localStorage.setItem(STORE_KEY, String(Math.round(w)));
        return w;
      });
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [dragging]);

  const onHandlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    draggingRef.current = true;
    setDragging(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  // Double-click the handle to reset to the default width.
  const onHandleDoubleClick = useCallback(() => {
    setWidth(DEFAULT);
    localStorage.setItem(STORE_KEY, String(DEFAULT));
  }, []);

  return { width, isDesktop, dragging, onHandlePointerDown, onHandleDoubleClick };
}
