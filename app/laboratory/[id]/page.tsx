import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LaboratoryView } from "@/components/laboratory-view";
import { EXPERIMENTS, EXPERIMENT_BY_ID } from "@/lib/data/experiments";
import { familyOf } from "@/lib/patterns";

type Params = { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> };

export function generateStaticParams() {
  return EXPERIMENTS.map((e) => ({ id: e.id }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const experiment = EXPERIMENT_BY_ID[id];
  if (!experiment) return { title: "Record not found — Marketers Lab" };
  return {
    title: `${experiment.id} · ${experiment.title} — Laboratory — Marketers Lab`,
    description: experiment.summary,
  };
}

export default async function LaboratoryPage({ params, searchParams }: Params) {
  const { id } = await params;
  const { tab } = await searchParams;
  const experiment = EXPERIMENT_BY_ID[id];
  if (!experiment) notFound();
  const family = familyOf(id);

  return (
    <LaboratoryView
      experiment={experiment}
      family={family}
      initialTab={tab === "patterns" ? "patterns" : "experiment"}
    />
  );
}
