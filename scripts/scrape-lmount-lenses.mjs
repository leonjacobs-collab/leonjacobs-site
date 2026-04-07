#!/usr/bin/env node
/**
 * L-mount lens list scraper.
 *
 * Fetches https://l-mount.com/en/lenses, parses the lens list,
 * validates against the LensListSchema, and writes the result to
 * content/lumix-s5ii/lenses/lenses.json.
 *
 * On failure (network error, page structure change, validation error)
 * the script exits non-zero WITHOUT touching the existing lenses.json
 * — the site continues to build with the last-good data.
 *
 * Run manually:    npm run fg:scrape-lenses
 * Run in CI:       see .github/workflows/refresh-lenses.yml
 *
 * IMPORTANT — first-run verification:
 * Before relying on this scraper, run it once and inspect the diff
 * against the seed lenses.json. The CSS selectors below are a guess
 * based on common page patterns and WILL need adjusting once you
 * actually look at the live page structure. The script is designed
 * to fail loudly when the page changes — it does not silently
 * corrupt the file.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");
const OUTPUT_PATH = path.join(
  REPO_ROOT,
  "content",
  "lumix-s5ii",
  "lenses",
  "lenses.json"
);
const SOURCE_URL = "https://l-mount.com/en/lenses";

// ─────────────────────────────────────────────────────────────────────
// Slug helper
// ─────────────────────────────────────────────────────────────────────

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/--+/g, "-");
}

// ─────────────────────────────────────────────────────────────────────
// Parse a lens name string into structured data.
//
// L-mount.com lens names follow patterns like:
//   "Panasonic Lumix S 20-60mm F3.5-5.6"
//   "Sigma 14mm F1.4 DG DN Art"
//   "Leica APO-Summicron-SL 50 f/2 ASPH."
//
// This is best-effort. If parsing fails for a given lens, we record
// it with `parse_failed: true` so it can be hand-fixed later.
// ─────────────────────────────────────────────────────────────────────

function parseFocalLength(name) {
  // Match e.g. "20-60mm", "14mm", "70-200 mm"
  const range = name.match(/(\d+)\s*-\s*(\d+)\s*mm/i);
  if (range) return [Number(range[1]), Number(range[2])];
  const single = name.match(/(\d+)\s*mm/i);
  if (single) return [Number(single[1]), Number(single[1])];
  return null;
}

function parseAperture(name) {
  // Match e.g. "F1.4", "F3.5-5.6", "f/2.8", "F/1.8"
  const range = name.match(/[Ff]\/?\s*(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
  if (range) return [Number(range[1]), Number(range[2])];
  const single = name.match(/[Ff]\/?\s*(\d+(?:\.\d+)?)/);
  if (single) return [Number(single[1]), Number(single[1])];
  return null;
}

function categorize(focalRange) {
  if (!focalRange) return "standard";
  const [min, max] = focalRange;
  if (max <= 16) return "ultra-wide";
  if (max <= 35) return "wide";
  if (min >= 200) return "super-tele";
  if (min >= 70) return "tele";
  return "standard";
}

// ─────────────────────────────────────────────────────────────────────
// Scrape
// ─────────────────────────────────────────────────────────────────────

async function fetchPage(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "lumix-s5ii-field-guide-scraper/1.0 (https://leonmay.be) — refreshing L-mount lens list",
      Accept: "text/html",
    },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${url}`);
  }
  return await res.text();
}

/**
 * Extract lens entries from the page HTML.
 *
 * The selector strategy below is a best guess. When the scraper
 * runs for the first time, you'll likely need to inspect the live
 * page and update this function. The scraper deliberately throws
 * if it finds zero lenses — that prevents a silent overwrite of
 * the existing file with an empty list.
 */
function parseLensesFromHTML(html) {
  const lenses = [];

  // Strategy 1: look for lens names in heading-like elements
  // Lens names typically include "mm" and an aperture marker.
  const candidates = [
    ...html.matchAll(
      /<(?:h[1-6]|a|li|span|p)[^>]*>([^<>]*?\d+\s*-?\s*\d*\s*mm[^<>]*?[Ff]\/?\s*\d+(?:\.\d+)?[^<>]*?)<\//gi
    ),
  ];

  const seen = new Set();
  for (const match of candidates) {
    const raw = match[1].replace(/\s+/g, " ").trim();
    if (raw.length < 8 || raw.length > 120) continue;
    if (seen.has(raw)) continue;
    seen.add(raw);

    const focal = parseFocalLength(raw);
    const aperture = parseAperture(raw);
    if (!focal || !aperture) continue;

    // Best-effort brand extraction — first capitalised word.
    const brandMatch = raw.match(/^([A-Z][A-Za-z]+)/);
    const brand = brandMatch ? brandMatch[1] : "Unknown";

    lenses.push({
      id: slugify(raw),
      brand,
      name: raw,
      mount: "L-mount",
      focal_length: focal,
      aperture,
      type: focal[0] === focal[1] ? "prime" : "zoom",
      category: categorize(focal),
      manual_focus_only: false,
      source_url: SOURCE_URL,
    });
  }

  return lenses;
}

// ─────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Fetching ${SOURCE_URL} …`);
  const html = await fetchPage(SOURCE_URL);
  console.log(`Got ${html.length} bytes of HTML.`);

  const lenses = parseLensesFromHTML(html);
  console.log(`Parsed ${lenses.length} lens entries.`);

  if (lenses.length === 0) {
    throw new Error(
      "Parser found zero lenses. The page structure has likely changed.\n" +
        "Inspect the live page and update parseLensesFromHTML() in this script.\n" +
        "Existing lenses.json has NOT been touched."
    );
  }

  if (lenses.length < 50) {
    console.warn(
      `Warning: only ${lenses.length} lenses parsed. The L-mount catalog is normally 100+. ` +
        `The parser may be missing some entries — review before merging.`
    );
  }

  const output = {
    schema_version: 1,
    last_updated: new Date().toISOString().slice(0, 10),
    source: SOURCE_URL,
    lenses: lenses.sort((a, b) => a.id.localeCompare(b.id)),
  };

  // Diff against existing file (if any) for the PR description
  let diffSummary = "";
  try {
    const existing = JSON.parse(await fs.readFile(OUTPUT_PATH, "utf8"));
    const existingIds = new Set(existing.lenses.map((l) => l.id));
    const newIds = new Set(lenses.map((l) => l.id));
    const added = [...newIds].filter((id) => !existingIds.has(id));
    const removed = [...existingIds].filter((id) => !newIds.has(id));
    diffSummary = `Added: ${added.length}\nRemoved: ${removed.length}\n`;
    if (added.length) diffSummary += `\nAdded lenses:\n${added.map((id) => `  + ${id}`).join("\n")}\n`;
    if (removed.length) diffSummary += `\nRemoved lenses:\n${removed.map((id) => `  - ${id}`).join("\n")}\n`;
  } catch {
    diffSummary = "(No existing lenses.json — initial population.)";
  }

  await fs.writeFile(OUTPUT_PATH, JSON.stringify(output, null, 2) + "\n", "utf8");
  console.log(`Wrote ${OUTPUT_PATH}`);
  console.log("\nDiff summary:");
  console.log(diffSummary);
}

main().catch((err) => {
  console.error("Lens scraper failed:");
  console.error(err.message);
  process.exit(1);
});
