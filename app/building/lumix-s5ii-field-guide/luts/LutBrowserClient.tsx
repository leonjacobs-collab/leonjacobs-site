"use client";

import { useMemo, useState } from "react";
import type { Lut } from "@/lib/field-guide/schemas";
import { FilterBar, type FilterGroup } from "../components/FilterBar";
import { LutCard } from "../components/LutCard";
import styles from "./LutBrowserClient.module.css";

interface LutBrowserClientProps {
  luts: Lut[];
}

type FilterState = {
  built_for: string | null;
  license: string | null;
  look: string | null;
};

export function LutBrowserClient({ luts }: LutBrowserClientProps) {
  const [filters, setFilters] = useState<FilterState>({
    built_for: null,
    license: null,
    look: null,
  });

  const allProfiles = useMemo(() => {
    const set = new Set<string>();
    luts.forEach((l) => l.built_for.forEach((p) => set.add(p)));
    return Array.from(set).sort();
  }, [luts]);

  const allLooks = useMemo(() => {
    const set = new Set<string>();
    luts.forEach((l) => l.look.forEach((lk) => set.add(lk)));
    return Array.from(set).sort();
  }, [luts]);

  const filtered = useMemo(() => {
    return luts.filter((l) => {
      if (filters.built_for && !(l.built_for as string[]).includes(filters.built_for)) {
        return false;
      }
      if (filters.license && l.license !== filters.license) {
        return false;
      }
      if (filters.look && !l.look.includes(filters.look)) {
        return false;
      }
      return true;
    });
  }, [luts, filters]);

  const groups: FilterGroup[] = [
    {
      key: "built_for",
      label: "BUILT FOR",
      options: allProfiles.map((p) => ({ value: p, label: p.toUpperCase() })),
      selected: filters.built_for,
    },
    {
      key: "license",
      label: "LICENSE",
      options: [
        { value: "free", label: "Free" },
        { value: "donationware", label: "Donationware" },
        { value: "paid", label: "Paid" },
      ],
      selected: filters.license,
    },
    {
      key: "look",
      label: "LOOK",
      options: allLooks.map((l) => ({ value: l, label: l })),
      selected: filters.look,
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
          {filtered.map((lut) => (
            <LutCard key={lut.id} lut={lut} />
          ))}
        </div>
      )}
    </>
  );
}
