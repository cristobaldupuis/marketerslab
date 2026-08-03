import type { Metadata } from "next";
import { BRAND_BY_ID } from "@/lib/data/brands";
import { EXPERIMENT_BY_ID } from "@/lib/data/experiments";
import { ROADMAP_ELIGIBLE_IDS } from "@/lib/generate/facts";
import { SupercomputerView } from "@/components/supercomputer-view";

export const metadata: Metadata = {
  title: "Supercomputer — Marketers Lab",
  description: "The agentic plan-builder and roadmap generator — one engine, two entry points.",
};

type Params = { searchParams: Promise<{ tab?: string; id?: string }> };

export default async function SupercomputerPage({ searchParams }: Params) {
  const { tab, id } = await searchParams;

  const roadmapOptions = ROADMAP_ELIGIBLE_IDS.map((experimentId) => {
    const e = EXPERIMENT_BY_ID[experimentId];
    return {
      id: e.id,
      title: e.title,
      brandName: BRAND_BY_ID[e.brand_id].name,
      headlineValue: e.headline?.value ?? null,
    };
  });

  // EXP-0112 is the demo case — the record that gets clicked through in the
  // pitch — so it's the default selection whenever the id isn't specified in
  // the URL, not just whichever record happens to sort first.
  const DEMO_CASE_ID = "EXP-0112";
  const initialRoadmapId =
    id && roadmapOptions.some((o) => o.id === id)
      ? id
      : (roadmapOptions.find((o) => o.id === DEMO_CASE_ID)?.id ?? roadmapOptions[0]?.id ?? null);

  return (
    <SupercomputerView
      initialTab={tab === "roadmap" ? "roadmap" : "plan"}
      initialRoadmapId={initialRoadmapId}
      roadmapOptions={roadmapOptions}
    />
  );
}
