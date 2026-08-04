import type { Metadata } from "next";
import { QuarantineView } from "@/components/quarantine-view";

export const metadata: Metadata = {
  title: "Quarantine — Marketers Lab",
  description:
    "Records held until their kill criteria are accepted or overridden, before they enter the register.",
};

export default function QuarantinePage() {
  return <QuarantineView />;
}
