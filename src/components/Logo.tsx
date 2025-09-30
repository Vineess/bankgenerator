export default function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      className="drop-shadow-[0_2px_6px_rgba(16,185,129,.35)]"
    >
      <defs>
        <linearGradient id="nbg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>
      <rect x="8" y="8" width="48" height="48" rx="14" fill="url(#nbg)" />
      <path
        d="M22 40V24h4.8l6.8 9.4V24H38v16h-4.8l-6.8-9.4V40H22z"
        fill="white"
      />
    </svg>
  );
}
