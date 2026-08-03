import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PatternView } from "@/components/pattern-view";
import { FAMILIES, FAMILY_BY_ANCHOR } from "@/lib/patterns";

type Params = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return FAMILIES.map((f) => ({ id: f.anchorId }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const family = FAMILY_BY_ANCHOR[id];
  if (!family) return { title: "Pattern not found — Marketers Lab" };
  return {
    title: `${family.title} across ${family.studies.length} brands — Marketers Lab`,
    description: `The same experiment run at ${family.studies.length} brands, pooled, with brand as a split variable.`,
  };
}

export default async function PatternPage({ params }: Params) {
  const { id } = await params;
  const family = FAMILY_BY_ANCHOR[id];
  if (!family) notFound();
  return <PatternView family={family} />;
}
