import type { Metadata } from "next";
import { getAllGems } from "@/lib/field-guide/loader";
import { InstrumentPanel } from "../components/InstrumentPanel";
import { GemBrowserClient } from "./GemBrowserClient";

export const metadata: Metadata = {
  title: "Hidden Gems — Lumix S5II Field Guide",
  description:
    "A filterable directory of menu-buried features on the Panasonic Lumix S5II — Starlight AF, Sheer Overlay, Live Cropping, Focus Transition, and more.",
};

export default function GemsPage() {
  // Server component: load and validate content at build time,
  // serialize the data into the client island below.
  const gems = getAllGems().map((g) => g.data);

  return (
    <InstrumentPanel
      code="GEM"
      title="Hidden Gems Browser"
      subtitle="Menu-buried features that most S5II owners never discover. Every entry cites its source. Filter by use case, applies-to, or difficulty."
      meta={[
        { label: "ENTRIES", value: String(gems.length) },
        {
          label: "WITH CONFLICTS",
          value: String(gems.filter((g) => g.conflicts.length > 0).length),
        },
      ]}
    >
      <GemBrowserClient gems={gems} />
    </InstrumentPanel>
  );
}
