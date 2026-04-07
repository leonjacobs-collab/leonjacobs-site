import type { Source } from "./schemas";

/**
 * Citation helpers for the field guide.
 *
 * Body markdown uses standard footnote syntax for citations:
 *
 *   The dual-gain sensor cleans up at ISO 4000 [^stalman].
 *
 *   [^stalman]: Tyler Stalman — video transcript
 *
 * The footnote *key* must match a `key` in the file's frontmatter
 * `sources` array. This module provides helpers to (a) extract
 * footnote keys from a body string and (b) look them up against
 * the sources list.
 *
 * The actual rendering of the body markdown to HTML is done by the
 * page component using a markdown renderer (next-mdx, marked, etc.)
 * with a custom footnote handler — this file just provides the
 * lookup glue.
 */

export interface CitationLookup {
  key: string;
  source: Source | null;
}

/**
 * Extract every `[^key]` reference in body markdown.
 * Returns the unique keys in order of first appearance.
 */
export function extractCitationKeys(body: string): string[] {
  const re = /\[\^([a-z0-9-]+)\]/g;
  const seen = new Set<string>();
  const keys: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    const key = m[1];
    // Skip footnote definitions like `[^stalman]:` — those are
    // followed immediately by a colon.
    if (body[m.index + m[0].length] === ":") continue;
    if (!seen.has(key)) {
      seen.add(key);
      keys.push(key);
    }
  }
  return keys;
}

/**
 * Resolve every citation key referenced in the body against the
 * sources array. Returns null for any key that has no matching
 * source — the build should treat that as an error and surface it.
 */
export function resolveCitations(
  body: string,
  sources: Source[]
): CitationLookup[] {
  const keys = extractCitationKeys(body);
  return keys.map((key) => ({
    key,
    source: sources.find((s) => s.key === key) ?? null,
  }));
}

/**
 * Throws if the body references any citation key that isn't in the
 * sources array. Call this from the loader to catch authoring
 * mistakes at build time.
 */
export function validateCitations(
  body: string,
  sources: Source[],
  filepath: string
): void {
  const lookups = resolveCitations(body, sources);
  const missing = lookups.filter((l) => l.source === null).map((l) => l.key);
  if (missing.length > 0) {
    throw new Error(
      `Unknown citation key(s) in ${filepath}: ${missing.join(", ")}\n` +
        `Add matching entries to the \`sources\` frontmatter array.`
    );
  }
}

/**
 * Format a source for display in a tooltip or inline cite link.
 * Example output: "S5II Owner's Manual, p.412 (official)"
 */
export function formatSource(source: Source): string {
  const parts = [source.name];
  if (source.ref) parts.push(source.ref);
  return `${parts.join(", ")} (${source.type})`;
}
