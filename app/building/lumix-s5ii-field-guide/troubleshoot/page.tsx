import type { Metadata } from "next";
import { getTroubleshootRootNodes, getAllTroubleshootNodes } from "@/lib/field-guide/loader";
import { InstrumentPanel } from "../components/InstrumentPanel";
import { TroubleshootClient } from "./TroubleshootClient";

export const metadata: Metadata = {
  title: "Troubleshoot — Lumix S5II Field Guide",
  description:
    "Symptom-driven troubleshooting decision tree for the Panasonic Lumix S5II.",
};

export default function TroubleshootPage() {
  const roots = getTroubleshootRootNodes();
  const all = getAllTroubleshootNodes();

  const nodes = all.map((n) => ({
    data: n.data,
    body: n.body,
  }));

  return (
    <InstrumentPanel
      code="TRB"
      title="Troubleshoot"
      subtitle="Symptom-driven decision tree. Pick a problem, answer questions, find the cause and fix."
      meta={[
        { label: "SYMPTOMS", value: String(roots.length) },
        { label: "NODES TOTAL", value: String(all.length) },
      ]}
    >
      <TroubleshootClient nodes={nodes} />
    </InstrumentPanel>
  );
}
