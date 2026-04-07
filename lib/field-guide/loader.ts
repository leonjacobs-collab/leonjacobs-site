import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";
import {
  GemSchema,
  SceneSchema,
  TroubleshootSchema,
  LutSchema,
  LensListSchema,
  type Gem,
  type Scene,
  type Troubleshoot,
  type Lut,
  type LensList,
} from "./schemas";

/**
 * Loader for Lumix S5II Field Guide content.
 *
 * Runs at build time only — Next.js will execute this during static
 * generation and bake the results into the page bundles. There is no
 * runtime fetching of content files.
 *
 * Validation is strict: any malformed file fails the build with a
 * helpful error pointing at the offending file and field. Do not
 * weaken validation to make a broken file build.
 */

const CONTENT_ROOT = path.join(process.cwd(), "content", "lumix-s5ii");

// ─────────────────────────────────────────────────────────────────────
// Generic loader
// ─────────────────────────────────────────────────────────────────────

interface LoadedFile<T> {
  data: T;
  body: string;
  filepath: string;
}

function loadMarkdownDir<S extends z.ZodTypeAny>(
  subdir: string,
  schema: S
): LoadedFile<z.output<S>>[] {
  const dir = path.join(CONTENT_ROOT, subdir);
  if (!fs.existsSync(dir)) {
    throw new Error(
      `Field guide content directory missing: ${dir}\n` +
        `Did you forget to add a content folder?`
    );
  }

  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .sort();

  const loaded: LoadedFile<z.output<S>>[] = [];
  const seenIds = new Set<string>();

  for (const file of files) {
    const filepath = path.join(dir, file);
    const raw = fs.readFileSync(filepath, "utf8");
    const { data, content } = matter(raw);

    const result = schema.safeParse(data);
    if (!result.success) {
      const issues = result.error.issues
        .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
        .join("\n");
      throw new Error(
        `Invalid frontmatter in ${path.relative(process.cwd(), filepath)}:\n${issues}`
      );
    }

    const parsed = result.data;
    const id = (parsed as { id: string }).id;

    // Check filename matches id
    const expectedFilename = `${id}.md`;
    if (file !== expectedFilename) {
      throw new Error(
        `Filename/id mismatch in ${file}: id is "${id}" but filename should be "${expectedFilename}"`
      );
    }

    // Check id uniqueness
    if (seenIds.has(id)) {
      throw new Error(
        `Duplicate id "${id}" found in ${path.relative(process.cwd(), filepath)}`
      );
    }
    seenIds.add(id);

    loaded.push({ data: parsed, body: content, filepath });
  }

  return loaded;
}

// ─────────────────────────────────────────────────────────────────────
// Content type loaders
// ─────────────────────────────────────────────────────────────────────

let _gemsCache: LoadedFile<Gem>[] | null = null;
let _scenesCache: LoadedFile<Scene>[] | null = null;
let _troubleshootCache: LoadedFile<Troubleshoot>[] | null = null;
let _lutsCache: LoadedFile<Lut>[] | null = null;
let _lensesCache: LensList | null = null;

export function getAllGems(): LoadedFile<Gem>[] {
  if (_gemsCache) return _gemsCache;
  _gemsCache = loadMarkdownDir("gems", GemSchema);
  return _gemsCache;
}

export function getAllScenes(): LoadedFile<Scene>[] {
  if (_scenesCache) return _scenesCache;
  _scenesCache = loadMarkdownDir("scenes", SceneSchema);
  return _scenesCache;
}

export function getAllTroubleshootNodes(): LoadedFile<Troubleshoot>[] {
  if (_troubleshootCache) return _troubleshootCache;
  _troubleshootCache = loadMarkdownDir("troubleshoot", TroubleshootSchema);
  // Validate parent/child references
  const ids = new Set(_troubleshootCache.map((n) => n.data.id));
  for (const node of _troubleshootCache) {
    if (node.data.parent && !ids.has(node.data.parent)) {
      throw new Error(
        `Troubleshoot node "${node.data.id}" has unknown parent "${node.data.parent}"`
      );
    }
    for (const child of node.data.children) {
      if (!ids.has(child)) {
        throw new Error(
          `Troubleshoot node "${node.data.id}" has unknown child "${child}"`
        );
      }
    }
  }
  return _troubleshootCache;
}

export function getAllLuts(): LoadedFile<Lut>[] {
  if (_lutsCache) return _lutsCache;
  _lutsCache = loadMarkdownDir("luts", LutSchema);
  return _lutsCache;
}

export function getLensList(): LensList {
  if (_lensesCache) return _lensesCache;
  const filepath = path.join(CONTENT_ROOT, "lenses", "lenses.json");
  if (!fs.existsSync(filepath)) {
    throw new Error(
      `Lens list not found: ${filepath}\n` +
        `Run \`npm run fg:scrape-lenses\` to generate it.`
    );
  }
  const raw = JSON.parse(fs.readFileSync(filepath, "utf8"));
  const result = LensListSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid lens list:\n${issues}`);
  }
  _lensesCache = result.data;
  return _lensesCache;
}

// ─────────────────────────────────────────────────────────────────────
// Convenience accessors
// ─────────────────────────────────────────────────────────────────────

export function getGemById(id: string): LoadedFile<Gem> | null {
  return getAllGems().find((g) => g.data.id === id) ?? null;
}

export function getSceneById(id: string): LoadedFile<Scene> | null {
  return getAllScenes().find((s) => s.data.id === id) ?? null;
}

export function getTroubleshootRootNodes(): LoadedFile<Troubleshoot>[] {
  return getAllTroubleshootNodes().filter((n) => n.data.node_type === "root");
}

/**
 * Returns every unique tag across every content type. Useful for
 * the landing page tag cloud and for building autocomplete UIs.
 */
export function getAllFieldGuideTags(): string[] {
  const tags = new Set<string>();
  for (const g of getAllGems()) g.data.tags.forEach((t) => tags.add(t));
  for (const s of getAllScenes()) s.data.tags.forEach((t) => tags.add(t));
  for (const t of getAllTroubleshootNodes()) t.data.tags.forEach((tag) => tags.add(tag));
  for (const l of getAllLuts()) l.data.tags.forEach((t) => tags.add(t));
  return Array.from(tags).sort();
}
