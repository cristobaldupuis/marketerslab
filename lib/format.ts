const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Deterministic on server and client — no locale, so no hydration drift. */
export function formatDate(iso: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export function daysBetween(from: string, to: string): number | null {
  if (!from || !to) return null;
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.round((b - a) / 86_400_000);
}

export function formatCount(n: number): string {
  return n.toLocaleString("en-GB");
}

/** "Priya Raman" -> "PR" — same two-letter convention as the seeded
 *  `Brand.initials` field, applied to `Experiment.owner` at read time since
 *  owners aren't a standalone entity with their own record to carry it on. */
export function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function formatPercent(n: number): string {
  return `${(n * 100).toFixed(0)}%`;
}

/** A relative treatment effect. Always signed — an unsigned effect in a segment
 *  read is the exact ambiguity the tree exists to remove. Uses a real minus
 *  sign so the column of figures stays optically aligned. */
export function formatEffect(n: number): string {
  return `${n < 0 ? "−" : "+"}${Math.abs(n).toFixed(1)}%`;
}

/** Share of population, as carried on a segment node (0–1). */
export function formatShare(n: number): string {
  return `${(n * 100).toFixed(0)}%`;
}
