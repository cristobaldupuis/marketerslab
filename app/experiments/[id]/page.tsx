import { redirect } from "next/navigation";

type Params = { params: Promise<{ id: string }> };

/** Superseded by /microscope/[id] — kept as a redirect so old links still resolve. */
export default async function LegacyExperimentPage({ params }: Params) {
  const { id } = await params;
  redirect(`/microscope/${id}`);
}
