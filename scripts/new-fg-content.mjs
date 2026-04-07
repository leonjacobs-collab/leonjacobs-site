#!/usr/bin/env node
/**
 * Field Guide content authoring CLI.
 *
 * Usage:
 *   npm run fg:new -- gem
 *   npm run fg:new -- scene
 *   npm run fg:new -- troubleshoot
 *   npm run fg:new -- lut
 *
 * Prompts for the required fields, generates a slug, scaffolds a
 * markdown file with valid frontmatter, and opens it in $EDITOR
 * (or VS Code if EDITOR is not set).
 *
 * Do not hand-write content files. The CLI prevents schema
 * violations that the build-time validator would otherwise reject.
 */

import fs from "node:fs/promises";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");
const CONTENT_ROOT = path.join(REPO_ROOT, "content", "lumix-s5ii");

// ─────────────────────────────────────────────────────────────────────
// Utility
// ─────────────────────────────────────────────────────────────────────

function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function prompt(rl, question, defaultValue = "") {
  const suffix = defaultValue ? ` [${defaultValue}]` : "";
  const answer = await rl.question(`${question}${suffix}: `);
  return answer.trim() || defaultValue;
}

async function promptChoice(rl, question, choices) {
  console.log(`${question}`);
  choices.forEach((c, i) => console.log(`  ${i + 1}. ${c}`));
  while (true) {
    const answer = await rl.question("Choose: ");
    const n = parseInt(answer.trim(), 10);
    if (n >= 1 && n <= choices.length) return choices[n - 1];
    console.log("Invalid choice, try again.");
  }
}

async function promptList(rl, question) {
  const answer = await rl.question(`${question} (comma-separated): `);
  return answer
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────
// Scaffolders
// ─────────────────────────────────────────────────────────────────────

async function scaffoldGem(rl) {
  const title = await prompt(rl, "Gem title");
  const id = slugify(title);
  const menu_path = await prompt(rl, "Menu path (e.g. [Custom] > [Monitor] > [Sheer Overlay])");
  const applies_to = await promptChoice(rl, "Applies to:", ["photo", "video", "both"]);
  const difficulty = await promptChoice(rl, "Difficulty:", ["beginner", "intermediate", "advanced"]);
  const menu_depth = parseInt(await prompt(rl, "Menu depth (1-5)", "3"), 10);
  const why_it_matters = await prompt(rl, "Why it matters (one sentence, max 280 chars)");
  const tags = await promptList(rl, "Tags");
  const use_cases = await promptList(rl, "Use cases");

  return {
    id,
    subdir: "gems",
    frontmatter: {
      id,
      type: "gem",
      title,
      tags,
      last_updated: today(),
      sources: [
        { key: "manual", name: "S5II Owner's Manual", ref: "TODO", type: "official" },
      ],
      menu_path,
      use_cases,
      applies_to,
      difficulty,
      menu_depth,
      why_it_matters,
      conflicts: [],
    },
    body: "Replace this body with the gem explanation. Cite sources inline like this [^manual].\n",
  };
}

async function scaffoldScene(rl) {
  const title = await prompt(rl, "Scene title");
  const id = slugify(title);
  const summary = await prompt(rl, "One-sentence summary");
  const scene_category = await promptChoice(rl, "Scene category:", [
    "low-light", "action", "landscape", "portrait", "astro",
    "video", "macro", "street", "travel", "vlog",
  ]);
  const difficulty = await promptChoice(rl, "Difficulty:", ["beginner", "intermediate", "advanced"]);
  const applies_to = await promptChoice(rl, "Applies to:", ["photo", "video", "both"]);
  const tags = await promptList(rl, "Tags");

  return {
    id,
    subdir: "scenes",
    frontmatter: {
      id,
      type: "scene",
      title,
      tags,
      last_updated: today(),
      sources: [
        { key: "manual", name: "S5II Owner's Manual", type: "official" },
      ],
      scene_category,
      difficulty,
      applies_to,
      summary,
      exposure: {
        iso_min: null,
        iso_max: null,
        shutter_min: null,
        aperture_pref: "any",
      },
      autofocus: {
        focus_mode: "AFC",
        af_area: "Full Area AF",
        detection: "off",
      },
      stabilization: "TODO",
      white_balance: "TODO",
      recommended_lens_categories: [],
      warnings: [],
      conflicts: [],
    },
    body: "## The setup\n\nReplace this body with the scene walkthrough.\n\n## In the field\n\n…\n",
  };
}

async function scaffoldTroubleshoot(rl) {
  const title = await prompt(rl, "Node title");
  const id = slugify(title);
  const node_type = await promptChoice(rl, "Node type:", ["root", "question", "cause", "fix"]);
  const applies_to = await promptChoice(rl, "Applies to:", ["photo", "video", "both"]);
  const tags = await promptList(rl, "Tags");

  const fm = {
    id,
    type: "troubleshoot",
    title,
    tags,
    last_updated: today(),
    sources: [
      { key: "manual", name: "S5II Owner's Manual", type: "official" },
    ],
    node_type,
    parent: node_type === "root" ? null : "TODO",
    children: [],
    applies_to,
    conflicts: [],
  };

  if (node_type === "root") {
    fm.symptom = await prompt(rl, "Symptom (one sentence)");
  } else if (node_type === "question") {
    fm.question = await prompt(rl, "The question to ask the user");
  } else if (node_type === "cause") {
    fm.cause_summary = await prompt(rl, "Cause summary (one sentence)");
  }

  return {
    id,
    subdir: "troubleshoot",
    frontmatter: fm,
    body: "Replace this body with explanation appropriate for the node type.\n",
  };
}

async function scaffoldLut(rl) {
  const title = await prompt(rl, "LUT title");
  const id = slugify(title);
  const creator = await prompt(rl, "Creator name");
  const download_url = await prompt(rl, "Download URL");
  const license = await promptChoice(rl, "License:", ["free", "donationware", "paid"]);
  const built_for = await promptList(rl, "Built for (e.g. v-log, cinelike-d2)");
  const look = await promptList(rl, "Look tags (e.g. warm, cinematic)");
  const tags = await promptList(rl, "Filter tags");

  return {
    id,
    subdir: "luts",
    frontmatter: {
      id,
      type: "lut",
      title,
      tags,
      last_updated: today(),
      sources: [
        { key: "creator", name: creator, type: "creator" },
      ],
      creator,
      download_url,
      license,
      built_for,
      look,
      conflicts: [],
    },
    body: "Optional notes about how to use the LUT.\n",
  };
}

// ─────────────────────────────────────────────────────────────────────
// Frontmatter writer
// ─────────────────────────────────────────────────────────────────────

/** Minimal YAML serializer for our frontmatter shape — gray-matter
 *  is happy with whatever the build-time loader produces, so we keep
 *  this stupid simple instead of pulling in js-yaml as a dependency. */
function toYaml(obj, indent = 0) {
  const pad = "  ".repeat(indent);
  const lines = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v === null) {
      lines.push(`${pad}${k}: null`);
    } else if (Array.isArray(v)) {
      if (v.length === 0) {
        lines.push(`${pad}${k}: []`);
      } else if (typeof v[0] === "object" && v[0] !== null) {
        lines.push(`${pad}${k}:`);
        for (const item of v) {
          const itemLines = toYaml(item, indent + 1).split("\n");
          itemLines[0] = itemLines[0].replace(/^( *)/, "$1- ");
          lines.push(itemLines.join("\n"));
        }
      } else {
        lines.push(`${pad}${k}: [${v.map((x) => JSON.stringify(x)).join(", ")}]`);
      }
    } else if (typeof v === "object") {
      lines.push(`${pad}${k}:`);
      lines.push(toYaml(v, indent + 1));
    } else if (typeof v === "string") {
      const needsQuoting = /[:#\[\]{}>|*&!%@`,]|^\s|\s$/.test(v);
      lines.push(`${pad}${k}: ${needsQuoting ? JSON.stringify(v) : v}`);
    } else {
      lines.push(`${pad}${k}: ${v}`);
    }
  }
  return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────

async function main() {
  const type = process.argv[2];
  const validTypes = ["gem", "scene", "troubleshoot", "lut"];
  if (!validTypes.includes(type)) {
    console.error(`Usage: npm run fg:new -- <${validTypes.join("|")}>`);
    process.exit(1);
  }

  const rl = readline.createInterface({ input, output });

  let result;
  try {
    if (type === "gem") result = await scaffoldGem(rl);
    else if (type === "scene") result = await scaffoldScene(rl);
    else if (type === "troubleshoot") result = await scaffoldTroubleshoot(rl);
    else if (type === "lut") result = await scaffoldLut(rl);
  } finally {
    rl.close();
  }

  const filepath = path.join(CONTENT_ROOT, result.subdir, `${result.id}.md`);
  if (await fileExists(filepath)) {
    console.error(`File already exists: ${filepath}`);
    process.exit(1);
  }

  const fileContent = `---\n${toYaml(result.frontmatter)}\n---\n\n${result.body}`;
  await fs.mkdir(path.dirname(filepath), { recursive: true });
  await fs.writeFile(filepath, fileContent, "utf8");

  console.log(`\nCreated: ${path.relative(REPO_ROOT, filepath)}`);
  console.log("Opening in editor…");

  const editor = process.env.EDITOR || "code";
  spawn(editor, [filepath], { stdio: "inherit", detached: true }).unref();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
