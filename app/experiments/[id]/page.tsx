import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExperimentDetail } from "@/components/experiment-detail";
import { EXPERIMENTS, EXPERIMENT_BY_ID } from "@/lib/data/experiments";

type Params = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return EXPERIMENTS.map((e) => ({ id: e.id }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const experiment = EXPERIMENT_BY_ID[id];
  if (!experiment) return { title: "Record not found — Marketers Lab" };
  return {
    title: `${experiment.id} · ${experiment.title} — Marketers Lab`,
    description: experiment.summary,
  };
}

export default async function ExperimentPage({ params }: Params) {
  const { id } = await params;
  const experiment = EXPERIMENT_BY_ID[id];
  if (!experiment) notFound();
  return <ExperimentDetail experiment={experiment} />;
}
