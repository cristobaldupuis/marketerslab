import type { EffectTone } from "@/lib/segments";

/**
 * How an effect direction is drawn. Deliberately in its own module rather than
 * alongside the tree: the tree is a client component, and a plain object
 * exported from a `"use client"` module becomes a client reference when a
 * server component imports it — so the cross-brand view, which is a server
 * component, would get a proxy instead of these class names.
 *
 * Green up, rust down, neutral wherever the interval straddles zero. No new
 * colour: this is the won/lost pair already in the palette (see globals.css).
 */
export const TONE: Record<
  EffectTone,
  { text: string; band: string; tick: string; tint: string; word: string }
> = {
  positive: { text: "text-won", band: "bg-won-tint", tick: "bg-won", tint: "bg-won-tint", word: "lifts" },
  negative: { text: "text-lost", band: "bg-lost-tint", tick: "bg-lost", tint: "bg-lost-tint", word: "falls" },
  neutral: { text: "text-ink-2", band: "bg-rule/70", tick: "bg-ink-4", tint: "bg-sunk", word: "inside noise" },
};
