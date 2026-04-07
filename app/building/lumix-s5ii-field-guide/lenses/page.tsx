import type { Metadata } from "next";
import { getLensList } from "@/lib/field-guide/loader";
import { InstrumentPanel } from "../components/InstrumentPanel";
import { AsciiViewfinder } from "../components/AsciiViewfinder";
import { LensBrowserClient } from "./LensBrowserClient";

export const metadata: Metadata = {
  title: "Lens Helper — Lumix S5II Field Guide",
  description:
    "L-mount lens picker for the Panasonic Lumix S5II — ASCII viewfinder simulator, lens catalog, and kit builder.",
};

export default function LensesPage() {
  const list = getLensList();

  return (
    <InstrumentPanel
      code="LNS"
      title="Lens Helper"
      subtitle="ASCII viewfinder simulator with real exposure physics. Slide aperture for depth of field, ISO for noise, focal length for field of view. Then browse the L-mount catalog below."
      meta={[
        { label: "LENSES", value: String(list.lenses.length) },
        { label: "UPDATED", value: list.last_updated },
      ]}
    >
      <AsciiViewfinder />
      <hr className="divider" />
      <LensBrowserClient lenses={list.lenses} />
    </InstrumentPanel>
  );
}
