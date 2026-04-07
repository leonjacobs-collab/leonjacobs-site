"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Lens } from "@/lib/field-guide/schemas";
import { FilterBar, type FilterGroup } from "../components/FilterBar";
import { LensCard } from "../components/LensCard";
import styles from "./LensBrowserClient.module.css";

const STORAGE_KEY = "fg-lenses-owned";

interface LensBrowserClientProps {
  lenses: Lens[];
}

type FilterState = {
  category: string | null;
  type: string | null;
  brand: string | null;
  owned_only: string | null;
};

function loadOwned(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

function saveOwned(ids: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(ids)));
}

export function LensBrowserClient({ lenses }: LensBrowserClientProps) {
  const [filters, setFilters] = useState<FilterState>({
    category: null,
    type: null,
    brand: null,
    owned_only: null,
  });
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setOwnedIds(loadOwned());
  }, []);

  const toggleOwned = useCallback((id: string) => {
    setOwnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      saveOwned(next);
      return next;
    });
  }, []);

  const allCategories = useMemo(() => {
    const set = new Set<string>();
    lenses.forEach((l) => set.add(l.category));
    return Array.from(set).sort();
  }, [lenses]);

  const allBrands = useMemo(() => {
    const set = new Set<string>();
    lenses.forEach((l) => set.add(l.brand));
    return Array.from(set).sort();
  }, [lenses]);

  const filtered = useMemo(() => {
    return lenses.filter((l) => {
      if (filters.category && l.category !== filters.category) return false;
      if (filters.type && l.type !== filters.type) return false;
      if (filters.brand && l.brand !== filters.brand) return false;
      if (filters.owned_only === "owned" && !ownedIds.has(l.id)) return false;
      return true;
    });
  }, [lenses, filters, ownedIds]);

  const groups: FilterGroup[] = [
    {
      key: "category",
      label: "CLASS",
      options: allCategories.map((c) => ({
        value: c,
        label: c.replace(/-/g, " ").toUpperCase(),
      })),
      selected: filters.category,
    },
    {
      key: "type",
      label: "TYPE",
      options: [
        { value: "prime", label: "Prime" },
        { value: "zoom", label: "Zoom" },
      ],
      selected: filters.type,
    },
    {
      key: "brand",
      label: "BRAND",
      options: allBrands.map((b) => ({ value: b, label: b })),
      selected: filters.brand,
    },
    {
      key: "owned_only",
      label: "MY KIT",
      options: [{ value: "owned", label: "Owned Only" }],
      selected: filters.owned_only,
    },
  ];

  const handleFilterChange = (groupKey: string, value: string | null) => {
    setFilters((prev) => ({ ...prev, [groupKey]: value }));
  };

  const ownedLenses = lenses.filter((l) => ownedIds.has(l.id));

  return (
    <>
      {ownedLenses.length > 0 && (
        <div className={styles.inventory}>
          <div className={styles.inventoryHeader}>
            <span className={styles.inventoryLabel}>MY KIT</span>
            <span className={styles.inventoryCount}>
              {ownedLenses.length} LENS{ownedLenses.length !== 1 ? "ES" : ""}
            </span>
          </div>
          <div className={styles.inventoryList}>
            {ownedLenses.map((l) => (
              <span key={l.id} className="tag">{l.brand} {l.name}</span>
            ))}
          </div>
        </div>
      )}
      {ownedLenses.length === 0 && (
        <div className={styles.inventory}>
          <div className={styles.inventoryHeader}>
            <span className={styles.inventoryLabel}>MY KIT</span>
          </div>
          <p className={styles.inventoryEmpty}>
            No lenses added yet — tap &ldquo;+ ADD TO MY KIT&rdquo; on any lens below. Your kit is saved in this browser.
          </p>
        </div>
      )}
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
          {filtered.map((lens) => (
            <LensCard
              key={lens.id}
              lens={lens}
              owned={ownedIds.has(lens.id)}
              onToggleOwned={toggleOwned}
            />
          ))}
        </div>
      )}
    </>
  );
}
