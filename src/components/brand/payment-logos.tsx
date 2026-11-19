/** Payment method marks shown where students choose how they paid (vector, crisp at any size). */

/** Vodafone mark traced from the official artwork: white ring with the red speech mark, on red. */
export function VodafoneLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="97 30 450 450" className={className} role="img" aria-label="Vodafone">
      <rect x="97" y="30" width="450" height="450" rx="96" fill="#e60000" />
      <circle cx="322" cy="255" r="176" fill="#fff" />
      <path d="M392 96C330 94 222 135 222 250c0 60 40 106 92 106 56 0 99-40 99-94 0-48-29-82-70-92-9-24 1-56 27-68 8-4 15-6 22-6Z" fill="#e60000" />
    </svg>
  );
}

export function InstaPayLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="InstaPay">
      <rect width="64" height="64" rx="14" fill="#fff" />
      <rect x=".5" y=".5" width="63" height="63" rx="13.5" fill="none" stroke="#e7e2ee" />
      <g transform="translate(4.6 18.2) scale(.62)">
        {/* i */}
        <path d="M9.6 4.6h7l-1.3 6.4h-7Z" fill="#5a2783" />
        <path d="M8.8 14h7L10.6 40h-7Z" fill="#5a2783" />
        {/* chevrons */}
        <path d="M20 14h9.4l11 13-11 13H20l11-13Z" fill="#f4a08f" />
        <path d="M33.6 14H43l11 13-11 13h-9.4l11-13Z" fill="#f07c24" />
        {/* P */}
        <path d="M58.6 14H76c8.6 0 13 5 11.8 11.6C86.6 32 81.2 35.6 73.8 35.6h-9.2L62.9 40h-7.2Z" fill="#7c49ab" />
        <path d="M65.8 20.6h8.6c3.2 0 4.8 1.6 4.4 4-.5 2.6-2.6 4.2-6 4.2h-8.6Z" fill="#fff" />
      </g>
    </svg>
  );
}
