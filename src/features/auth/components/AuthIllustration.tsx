/**
 * Decorative farm illustration (farmer, wheelbarrow, chicken, trees, mountains, sun).
 * It carries no information, so it is hidden from screen readers.
 * Colours come from the `art-*` theme tokens in globals.css.
 */
export function AuthIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 480 400"
      className={className}
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Mountains and sun */}
      <circle cx="355" cy="70" r="13" className="fill-art-sun" />
      <path d="M110 250 L190 110 L240 190 L290 130 L390 250 Z" className="fill-art-mountain" />
      <path d="M190 110 L240 190 L215 200 L180 150 Z" className="fill-art-mountain-dark" />

      {/* Ground */}
      <ellipse cx="240" cy="330" rx="210" ry="70" className="fill-art-ground" />

      {/* Trees */}
      <rect x="62" y="215" width="8" height="70" className="fill-art-boots" />
      <ellipse cx="66" cy="190" rx="34" ry="50" className="fill-art-tree" />
      <rect x="418" y="205" width="8" height="70" className="fill-art-boots" />
      <ellipse cx="422" cy="180" rx="32" ry="50" className="fill-art-tree" />

      {/* Wheelbarrow */}
      <path d="M205 270 L330 250 L318 305 L225 318 Z" className="fill-art-tub" />
      <ellipse cx="268" cy="268" rx="52" ry="12" className="fill-art-produce" />
      <path d="M205 290 L160 318" className="stroke-art-tub" strokeWidth="5" strokeLinecap="round" />
      <circle cx="170" cy="335" r="9" className="fill-art-boots" />

      {/* Farmer */}
      <rect x="105" y="228" width="16" height="78" rx="6" className="fill-art-pants" />
      <rect x="128" y="228" width="16" height="78" rx="6" className="fill-art-pants" />
      <rect x="102" y="298" width="22" height="22" rx="6" className="fill-art-boots" />
      <rect x="126" y="298" width="22" height="22" rx="6" className="fill-art-boots" />
      <rect x="98" y="150" width="54" height="86" rx="14" className="fill-art-shirt" />
      <circle cx="125" cy="130" r="18" className="fill-art-skin" />
      <path d="M100 126 Q125 88 150 126 Z" className="fill-art-ground" />
      <ellipse cx="125" cy="126" rx="30" ry="5" className="fill-art-ground" />

      {/* Crate of produce */}
      <rect x="82" y="185" width="90" height="46" rx="4" className="fill-art-crate" />
      <circle cx="102" cy="182" r="9" className="fill-art-produce" />
      <circle cx="126" cy="178" r="9" className="fill-art-produce" />
      <circle cx="150" cy="182" r="9" className="fill-art-produce" />
      <rect x="82" y="200" width="90" height="4" className="fill-art-tub/30" />

      {/* Chicken */}
      <ellipse cx="365" cy="285" rx="26" ry="20" className="fill-art-chicken" />
      <circle cx="388" cy="262" r="11" className="fill-art-chicken" />
      <path d="M398 262 L408 266 L398 269 Z" className="fill-art-sun" />
      <path d="M385 252 L390 244 L394 252 Z" className="fill-art-produce" />
      <rect x="360" y="302" width="3" height="16" className="fill-art-sun" />
      <rect x="372" y="302" width="3" height="16" className="fill-art-sun" />
    </svg>
  );
}
