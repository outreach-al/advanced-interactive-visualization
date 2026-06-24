'use client';

import { useLayoutEffect, useRef, useState } from 'react';

export interface TooltipData {
  x: number; // anchor point in viewport coords (clientX-ish)
  y: number;
  node: React.ReactNode;
}

// A fixed-position card that flips its corner so it never clips the viewport.
export function Tooltip({ data }: { data: TooltipData | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    if (!data || !ref.current) {
      setPos(null);
      return;
    }
    const { width, height } = ref.current.getBoundingClientRect();
    const pad = 12;
    let left = data.x + pad;
    let top = data.y + pad;
    if (left + width > window.innerWidth - pad) left = data.x - width - pad;
    if (top + height > window.innerHeight - pad) top = data.y - height - pad;
    setPos({ left: Math.max(pad, left), top: Math.max(pad, top) });
  }, [data]);

  if (!data) return null;

  return (
    <div
      ref={ref}
      role="tooltip"
      className="pointer-events-none fixed z-50 max-w-[260px] rounded-lg border border-rule bg-white/95 px-3 py-2 text-xs shadow-lg backdrop-blur-sm"
      style={{
        left: pos?.left ?? data.x,
        top: pos?.top ?? data.y,
        visibility: pos ? 'visible' : 'hidden',
      }}
    >
      {data.node}
    </div>
  );
}
