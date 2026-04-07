import type { Conflict, Source } from "./schemas";

/**
 * Helpers for the source-conflict system.
 *
 * When the manual and a creator (or two creators) disagree about
 * something, we record that in the file's `conflicts` frontmatter
 * array. The UI then surfaces a "SOURCES DISAGREE" badge on the
 * relevant card or recommendation.
 *
 * Calculators and lookup tables (lens specs, exposure math) must
 * never carry conflicts. If two sources disagree on a number,
 * resolve it editorially before publishing.
 */

export interface ResolvedConflict extends Conflict {
  resolved_sources: Source[];
}

/**
 * Resolve a conflict's source_keys against the file's sources array.
 * Returns the conflict augmented with the actual Source objects.
 */
export function resolveConflict(
  conflict: Conflict,
  sources: Source[]
): ResolvedConflict {
  const resolved = conflict.source_keys
    .map((k) => sources.find((s) => s.key === k))
    .filter((s): s is Source => s !== undefined);
  return { ...conflict, resolved_sources: resolved };
}

/**
 * Validate that every conflict in a file references real source keys.
 * Call this from the loader to catch authoring mistakes at build time.
 */
export function validateConflicts(
  conflicts: Conflict[],
  sources: Source[],
  filepath: string
): void {
  const sourceKeys = new Set(sources.map((s) => s.key));
  for (const conflict of conflicts) {
    const missing = conflict.source_keys.filter((k) => !sourceKeys.has(k));
    if (missing.length > 0) {
      throw new Error(
        `Conflict in ${filepath} references unknown source key(s): ${missing.join(", ")}`
      );
    }
    if (conflict.source_keys.length < 2) {
      throw new Error(
        `Conflict in ${filepath} must reference at least 2 sources to be a conflict.`
      );
    }
  }
}

/** True if the conflict has an editorial resolution. */
export function isResolved(conflict: Conflict): boolean {
  return conflict.resolution !== null && conflict.resolution.length > 0;
}
