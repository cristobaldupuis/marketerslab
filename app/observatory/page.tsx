import type { Metadata } from "next";
import { ObservatoryView } from "@/components/observatory-view";

export const metadata: Metadata = {
  title: "Observatory — Marketers Lab",
  description: "Every experiment in the register, filterable by touchpoint, loop stage, risk and brand.",
};

export default function ObservatoryPage() {
  return <ObservatoryView />;
}
