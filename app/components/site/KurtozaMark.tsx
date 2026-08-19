// The Kurtoza mark: a data curve with one highlighted point, echoing the line
// charts in the lab. Orange gradient reads on both light and dark surfaces, so
// one version works everywhere. Stroke/point are thickened from the source art
// so it stays legible at small header sizes.
export function KurtozaMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 294 177"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Kurtoza"
    >
      <path
        d="M0 167.38C88.5 -105.12 175 262.88 293.5 9.87996"
        stroke="url(#km_grad)"
        strokeWidth={14}
        strokeLinecap="round"
      />
      <circle cx="128.5" cy="76.88" r="18" fill="#F39C12" />
      <defs>
        <linearGradient id="km_grad" x1="73.5" y1="107.88" x2="181.5" y2="107.88" gradientUnits="userSpaceOnUse">
          <stop stopColor="#EE5A24" />
          <stop offset="0.476365" stopColor="#F39C12" />
          <stop offset="1" stopColor="#EE5A24" />
        </linearGradient>
      </defs>
    </svg>
  );
}
