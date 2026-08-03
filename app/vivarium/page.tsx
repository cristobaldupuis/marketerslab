import type { Metadata } from "next";
import { VivariumView } from "@/components/vivarium-view";

export const metadata: Metadata = {
  title: "Vivarium — Marketers Lab",
  description: "Every experiment currently running, isolated from the rest of the register.",
};

export default function VivariumPage() {
  return <VivariumView />;
}
