import type { Brand } from "../types";

/**
 * Three fabricated brands. Brand is a taxonomy dimension, not a tenant — a solo
 * marketer's instance has one of these, an agency's has all three, and the code
 * path is identical either way. See DECISIONS.md.
 */
export const BRANDS: Brand[] = [
  {
    id: "marlow-field",
    name: "Marlow & Field",
    initials: "MF",
    description:
      "Direct-to-consumer pantry staples on a subscription base. 41k active households, heavy repeat, thin margins.",
  },
  {
    id: "ridgeline",
    name: "Ridgeline Provisions",
    initials: "RP",
    description:
      "Frozen protein and prepared-meal boxes sold in fortnightly cycles. High AOV, long consideration, cold-chain logistics.",
  },
  {
    id: "sundry",
    name: "Sundry Market",
    initials: "SM",
    description:
      "Online grocery marketplace with booked delivery slots. Large basket, low margin, everything hinges on slot utilisation.",
  },
];

export const BRAND_BY_ID = Object.fromEntries(BRANDS.map((b) => [b.id, b])) as Record<string, Brand>;

export function brandName(id: string): string {
  return BRAND_BY_ID[id]?.name ?? id;
}
