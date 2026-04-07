import Link from "next/link";
import type { Metadata } from "next";
import {
  getAllGems,
  getAllScenes,
  getAllTroubleshootNodes,
  getAllLuts,
  getLensList,
} from "@/lib/field-guide/loader";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Lumix S5II Field Guide",
  description:
    "An instrument-panel field guide for the Panasonic Lumix S5II — hidden gems, scene recipes, lens picks, and troubleshooting.",
};

interface AppTile {
  code: string;
  title: string;
  href: string;
  count: number;
  countLabel: string;
  description: string;
}

export default function FieldGuideLandingPage() {
  const gems = getAllGems();
  const scenes = getAllScenes();
  const troubleshoot = getAllTroubleshootNodes();
  const luts = getAllLuts();
  const lenses = getLensList();

  const tiles: AppTile[] = [
    {
      code: "GEM",
      title: "Hidden Gems",
      href: "/building/lumix-s5ii-field-guide/gems",
      count: gems.length,
      countLabel: "GEMS",
      description:
        "Filterable directory of menu-buried features that most owners never discover.",
    },
    {
      code: "SCN",
      title: "Scene Recommender",
      href: "/building/lumix-s5ii-field-guide/scenes",
      count: scenes.length,
      countLabel: "SCENES",
      description:
        "Pick a scenario, get a starting exposure triangle, AF mode, lens picks, and watch-outs.",
    },
    {
      code: "LNS",
      title: "Lens Helper",
      href: "/building/lumix-s5ii-field-guide/lenses",
      count: lenses.lenses.length,
      countLabel: "L-MOUNT",
      description:
        "Browse the L-mount catalog, build your kit inventory, get lens picks for any scenario.",
    },
    {
      code: "TRB",
      title: "Troubleshoot",
      href: "/building/lumix-s5ii-field-guide/troubleshoot",
      count: troubleshoot.length,
      countLabel: "NODES",
      description:
        "Symptom-driven decision tree — pick a problem, answer questions, find the fix.",
    },
    {
      code: "LUT",
      title: "LUTs & Community",
      href: "/building/lumix-s5ii-field-guide/luts",
      count: luts.length,
      countLabel: "LUTS",
      description:
        "Curated directory of LUTs, presets, and community-created content with attribution.",
    },
  ];

  return (
    <main className={`container ${styles.landing}`}>
      <p className={styles.intro}>
        An instrument-panel approach to the Panasonic S5II. Built from the manual, the
        practitioners who shoot with it daily, and a stubborn refusal to let good features
        stay buried.
      </p>

      <div className={styles.grid}>
        {tiles.map((tile) => (
          <Link key={tile.code} href={tile.href} className={`card ${styles.tile}`}>
            <div className={styles.tileHeader}>
              <span className={styles.tileCode}>{tile.code}</span>
            </div>
            <h2 className={styles.tileTitle}>{tile.title}</h2>
            <p className={styles.tileDescription}>{tile.description}</p>
            <div className={styles.tileCount}>
              <span className={styles.tileCountValue}>{tile.count}</span>
              <span className={styles.tileCountLabel}>{tile.countLabel}</span>
            </div>
          </Link>
        ))}
      </div>

      <div className={styles.footer}>
        <p className={styles.footerNote}>
          Every claim cites its source. When the manual and a creator disagree,
          you&apos;ll see a <span className={styles.inlineBadge}>SOURCES DISAGREE</span> badge.
          Calculators are conflict-free by editorial policy.
        </p>
      </div>
    </main>
  );
}
