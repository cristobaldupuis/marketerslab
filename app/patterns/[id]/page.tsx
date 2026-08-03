import { redirect } from "next/navigation";

type Params = { params: Promise<{ id: string }> };

/** Superseded by the Patterns tab on /laboratory/[id] — kept as a redirect so old links still resolve. */
export default async function LegacyPatternPage({ params }: Params) {
  const { id } = await params;
  redirect(`/laboratory/${id}?tab=patterns`);
}
