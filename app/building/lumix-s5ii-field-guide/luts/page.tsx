import type { Metadata } from "next";
import { getAllLuts } from "@/lib/field-guide/loader";
import { InstrumentPanel } from "../components/InstrumentPanel";
import { LutBrowserClient } from "./LutBrowserClient";

export const metadata: Metadata = {
  title: "LUTs & Community — Lumix S5II Field Guide",
  description:
    "Curated directory of LUTs, presets, and community-created content for the Panasonic Lumix S5II.",
};

export default function LutsPage() {
  const luts = getAllLuts().map((l) => l.data);

  return (
    <InstrumentPanel
      code="LUT"
      title="LUTs & Community"
      subtitle="Curated directory of LUTs and community-created content. Filter by color profile, look, or license. Contribute via PR."
      meta={[
        { label: "ENTRIES", value: String(luts.length) },
        {
          label: "FREE",
          value: String(luts.filter((l) => l.license === "free").length),
        },
      ]}
    >
      <LutBrowserClient luts={luts} />
    </InstrumentPanel>
  );
}
