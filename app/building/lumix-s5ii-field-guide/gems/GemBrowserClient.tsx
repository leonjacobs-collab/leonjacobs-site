"use client";

import { useMemo, useState } from "react";
import type { Gem } from "@/lib/field-guide/schemas";
import { FilterBar, type FilterGroup } from "../components/FilterBar";
import { GemCard } from "../components/GemCard";
import styles from "./GemBrowserClient.module.css";

interface GemBrowserClientProps {
  gems: Gem[];
}

type FilterState = {
  applies_to: string | null;
  difficulty: string | null;
  use_case: string | null;
};

export function GemBrowserClient({ gems }: GemBrowserClientProps) {
  const [filters, setFilters] = useState<FilterState>({
    applies_to: null,
    difficulty: null,
    use_case: null,
  });

  // Build the use_case options from the data itself — never hardcode
  const allUseCases = useMemo(() => {
    const set = new Set<string>();
    gems.forEach((g) => g.use_cases.forEach((uc) => set.add(uc)));
    return Array.from(set).sort();
  }, [gems]);

  const filtered = useMemo(() => {
    return gems.filter((g) => {
      if (filters.applies_to && g.applies_to !== filters.applies_to && g.applies_to !== "both") {
        return false;
      }
      if (filters.difficulty && g.difficulty !== filters.difficulty) {
        return false;
      }
      if (filters.use_case && !g.use_cases.includes(filters.use_case)) {
        return false;
      }
      return true;
    });
  }, [gems, filters]);

  const groups: FilterGroup[] = [
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
    {
      key: "use_case",
      label: "USE CASE",
      options: allUseCases.map((uc) => ({ value: uc, label: uc })),
      selected: filters.use_case,
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
          {filtered.map((gem) => (
            <GemCard key={gem.id} gem={gem} />
          ))}
        </div>
      )}
    </>
  );
}
