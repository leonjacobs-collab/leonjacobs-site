"use client";

import { useMemo, useState } from "react";
import type { Scene } from "@/lib/field-guide/schemas";
import { FilterBar, type FilterGroup } from "../components/FilterBar";
import { SceneCard } from "../components/SceneCard";
import styles from "./SceneBrowserClient.module.css";

interface SceneBrowserClientProps {
  scenes: Scene[];
}

type FilterState = {
  scene_category: string | null;
  applies_to: string | null;
  difficulty: string | null;
};

export function SceneBrowserClient({ scenes }: SceneBrowserClientProps) {
  const [filters, setFilters] = useState<FilterState>({
    scene_category: null,
    applies_to: null,
    difficulty: null,
  });

  const allCategories = useMemo(() => {
    const set = new Set<string>();
    scenes.forEach((s) => set.add(s.scene_category));
    return Array.from(set).sort();
  }, [scenes]);

  const filtered = useMemo(() => {
    return scenes.filter((s) => {
      if (filters.scene_category && s.scene_category !== filters.scene_category) {
        return false;
      }
      if (filters.applies_to && s.applies_to !== filters.applies_to && s.applies_to !== "both") {
        return false;
      }
      if (filters.difficulty && s.difficulty !== filters.difficulty) {
        return false;
      }
      return true;
    });
  }, [scenes, filters]);

  const groups: FilterGroup[] = [
    {
      key: "scene_category",
      label: "SCENARIO",
      options: allCategories.map((c) => ({ value: c, label: c.replace(/-/g, " ").toUpperCase() })),
      selected: filters.scene_category,
    },
    {
      key: "applies_to",
      label: "APPLIES TO",
      options: [
        { value: "photo", label: "Photo" },
        { value: "video", label: "Video" },
        { value: "both", label: "Both" },
      ],
      selected: filters.applies_to,
    },
    {
      key: "difficulty",
      label: "DIFFICULTY",
      options: [
        { value: "beginner", label: "Beginner" },
        { value: "intermediate", label: "Intermediate" },
        { value: "advanced", label: "Advanced" },
      ],
      selected: filters.difficulty,
    },
  ];

  const handleFilterChange = (groupKey: string, value: string | null) => {
    setFilters((prev) => ({ ...prev, [groupKey]: value }));
  };

  return (
    <>
      <FilterBar
        groups={groups}
        onChange={handleFilterChange}
        resultCount={filtered.length}
      />
      {filtered.length === 0 ? (
        <div className={styles.empty}>
          <p>NO MATCHES — try clearing a filter or two.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filtered.map((scene) => (
            <SceneCard key={scene.id} scene={scene} />
          ))}
        </div>
      )}
    </>
  );
}
