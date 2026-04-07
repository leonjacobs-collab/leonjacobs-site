import type { Metadata } from "next";
import { getAllScenes } from "@/lib/field-guide/loader";
import { InstrumentPanel } from "../components/InstrumentPanel";
import { SceneBrowserClient } from "./SceneBrowserClient";

export const metadata: Metadata = {
  title: "Scene Recommender — Lumix S5II Field Guide",
  description:
    "Pick a shooting scenario, get a starting exposure triangle, AF mode, lens picks, and watch-outs for the Lumix S5II.",
};

export default function ScenesPage() {
  const scenes = getAllScenes().map((s) => s.data);

  return (
    <InstrumentPanel
      code="SCN"
      title="Scene Recommender"
      subtitle="Pick a scenario, get a starting recipe — exposure, AF, lens picks, and watch-outs. Every recommendation cites its source."
      meta={[
        { label: "SCENES", value: String(scenes.length) },
        {
          label: "WITH CONFLICTS",
          value: String(scenes.filter((s) => s.conflicts.length > 0).length),
        },
      ]}
    >
      <SceneBrowserClient scenes={scenes} />
    </InstrumentPanel>
  );
}
