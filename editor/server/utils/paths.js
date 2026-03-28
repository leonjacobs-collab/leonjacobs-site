import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Root of the Next.js site (two levels up from editor/server/utils/) */
export const SITE_ROOT = path.resolve(__dirname, "..", "..", "..");

/** Valid content sections — reads from the single source of truth */
export const SECTIONS = JSON.parse(
  fs.readFileSync(path.join(SITE_ROOT, "lib", "sections.json"), "utf-8")
);

/** Legacy posts directory (pre-section migration) */
export const LEGACY_POSTS_DIR = path.join(SITE_ROOT, "content", "posts");

/** Resolve the content directory for a section */
export function contentDir(section) {
  return path.join(SITE_ROOT, "content", section);
}

/** Resolve the image directory for a section/slug combo */
export function imageDir(section, slug) {
  return path.join(SITE_ROOT, "public", "images", section, slug);
}

/** Resolve the .trash directory for soft deletes */
export function trashDir() {
  return path.join(SITE_ROOT, ".trash");
}
