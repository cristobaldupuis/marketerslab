/**
 * Small line icons for the sidebar nav — one per directly-navigable section.
 * Plain stroke glyphs, no fill, no gradient: the rest of the system rations
 * colour to semantic use only (see app/globals.css), so the nav icons stay
 * monochrome and pick up whatever text colour the row around them is using.
 */

type IconProps = { className?: string };

const base = "1.4" as const;

export function ObservatoryIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={base} strokeLinecap="round" className={className}>
      <path d="M3.5 15c0-3.87 2.91-7 6.5-7s6.5 3.13 6.5 7" />
      <path d="M10 8V3.5" />
      <path d="M2 15h16" />
      <circle cx="10" cy="2.6" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function VivariumIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={base} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4.5 15.5C4 9.5 8 4.5 15.5 4.5c.5 6-4.5 10.5-11 11Z" />
      <path d="M5.7 14.3 12.5 7.5" />
    </svg>
  );
}

export function QuarantineIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={base} strokeLinejoin="round" className={className}>
      <path d="M10 2.5 16 4.7v4.4c0 4.4-2.8 7.2-6 7.9-3.2-.7-6-3.5-6-7.9V4.7L10 2.5Z" />
    </svg>
  );
}

export function SupercomputerIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={base} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="5.5" y="5.5" width="9" height="9" rx="1.2" />
      <rect x="8.2" y="8.2" width="3.6" height="3.6" rx="0.5" />
      <path d="M10 2.3v2M10 15.7v2M2.3 10h2M15.7 10h2" />
    </svg>
  );
}

/** The small wordmark glyph in the sidebar header — a ring and a beacon, in
 *  the same spirit as the Observatory icon, at a scale meant for the logo
 *  line rather than a nav row. */
export function LabMark({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.3} className={className}>
      <circle cx="10" cy="10" r="7.25" />
      <circle cx="10" cy="10" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}
