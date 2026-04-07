import { z } from "zod";

/**
 * Zod schemas for all Lumix S5II Field Guide content types.
 *
 * These schemas validate frontmatter at build time. Bad frontmatter
 * fails the build — this is intentional. Do not relax validation to
 * make a broken file build; fix the file.
 *
 * TypeScript types are derived via z.infer at the bottom of this file.
 * Do not duplicate the types by hand.
 */

// ─────────────────────────────────────────────────────────────────────
// Shared building blocks
// ─────────────────────────────────────────────────────────────────────

const SourceTypeSchema = z.enum(["official", "creator", "community", "firsthand"]);

export const SourceSchema = z.object({
  /** Short slug used as the footnote key in body markdown, e.g. "manual", "stalman" */
  key: z.string().regex(/^[a-z0-9-]+$/, "key must be lowercase slug"),
  /** Human-readable source name, e.g. "S5II Owner's Manual" */
  name: z.string().min(1),
  /** Optional reference: page number, timestamp, URL fragment, etc. */
  ref: z.string().optional(),
  /** Optional URL to the source */
  url: z.string().url().optional(),
  type: SourceTypeSchema,
});

export const ConflictSchema = z.object({
  claim: z.string().min(1),
  counter: z.string().min(1),
  /** Editorial resolution. null = unresolved, surface both views neutrally. */
  resolution: z.string().nullable(),
  /** Which source keys are involved (must exist in the file's `sources` array) */
  source_keys: z.array(z.string()).min(2),
});

const ISODateSchema = z.preprocess(
  (val) => (val instanceof Date ? val.toISOString().slice(0, 10) : val),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "last_updated must be YYYY-MM-DD")
);

/** Fields every content file must have. */
const BaseContentSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, "id must be a lowercase slug"),
  title: z.string().min(1),
  tags: z.array(z.string()).default([]),
  last_updated: ISODateSchema,
  sources: z.array(SourceSchema).min(1, "at least one source is required"),
  conflicts: z.array(ConflictSchema).default([]),
});

// ─────────────────────────────────────────────────────────────────────
// Hidden Gems
// ─────────────────────────────────────────────────────────────────────

export const GemSchema = BaseContentSchema.extend({
  type: z.literal("gem"),
  menu_path: z.string().min(1),
  use_cases: z.array(z.string()).default([]),
  applies_to: z.enum(["photo", "video", "both"]),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  why_it_matters: z.string().min(10).max(280),
  /** How buried is it in the menu system? 1 = top-level, 5 = "you'll never find this" */
  menu_depth: z.number().int().min(1).max(5),
});

// ─────────────────────────────────────────────────────────────────────
// Scenes (Scene → Settings Recommender)
// ─────────────────────────────────────────────────────────────────────

const ExposureRangeSchema = z.object({
  iso_min: z.number().int().min(50).max(204800).optional(),
  iso_max: z.number().int().min(50).max(204800).optional(),
  shutter_min: z.string().optional(), // e.g. "1/200" or "20s"
  shutter_max: z.string().optional(),
  aperture_pref: z.enum(["wide", "moderate", "narrow", "any"]).optional(),
});

const AFRecommendationSchema = z.object({
  focus_mode: z.enum(["AFS", "AFC", "MF"]),
  af_area: z.string(), // e.g. "Full Area AF", "One Area Plus", "Tracking"
  detection: z.enum(["human", "animal", "vehicle", "off"]).optional(),
});

export const SceneSchema = BaseContentSchema.extend({
  type: z.literal("scene"),
  scene_category: z.enum([
    "low-light",
    "action",
    "landscape",
    "portrait",
    "astro",
    "video",
    "macro",
    "street",
    "travel",
    "vlog",
  ]),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  applies_to: z.enum(["photo", "video", "both"]),
  /** One-sentence summary of the recommendation */
  summary: z.string().min(10).max(200),
  exposure: ExposureRangeSchema,
  autofocus: AFRecommendationSchema,
  stabilization: z.string().optional(),
  white_balance: z.string().optional(),
  recommended_lens_categories: z
    .array(z.enum(["wide", "ultra-wide", "standard", "tele", "macro", "fast-prime", "anamorphic"]))
    .default([]),
  /** Free-text warnings the user should know about. Each is one sentence. */
  warnings: z.array(z.string()).default([]),
  /** Optional Custom Mode (C1/C2/C3) preset name to save this as */
  custom_mode_recipe: z.string().optional(),
});

// ─────────────────────────────────────────────────────────────────────
// Lenses
//
// Lenses are stored as a single JSON file (refreshed by the scraper),
// not as individual markdown files. The schema validates the JSON shape.
// ─────────────────────────────────────────────────────────────────────

export const LensEntrySchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  brand: z.string(),
  name: z.string(),
  mount: z.literal("L-mount"),
  /** Focal length range as [min, max]; for primes, min === max */
  focal_length: z.tuple([z.number(), z.number()]),
  /** Aperture range as [wide, narrow]; for fixed-aperture, wide === narrow */
  aperture: z.tuple([z.number(), z.number()]),
  type: z.enum(["prime", "zoom"]),
  category: z.enum([
    "ultra-wide",
    "wide",
    "standard",
    "tele",
    "super-tele",
    "macro",
    "fisheye",
    "anamorphic",
  ]),
  weight_g: z.number().int().optional(),
  manual_focus_only: z.boolean().default(false),
  /** Free-form notes if there's something noteworthy about the lens */
  notes: z.string().optional(),
  /** Where the data came from on this run */
  source_url: z.string().url().optional(),
});

export const LensListSchema = z.object({
  schema_version: z.literal(1),
  last_updated: ISODateSchema,
  source: z.string().url(),
  lenses: z.array(LensEntrySchema),
});

// ─────────────────────────────────────────────────────────────────────
// Troubleshoot tree nodes
// ─────────────────────────────────────────────────────────────────────

export const TroubleshootSchema = BaseContentSchema.extend({
  type: z.literal("troubleshoot"),
  node_type: z.enum(["root", "question", "cause", "fix"]),
  /** Only required on root nodes */
  symptom: z.string().optional(),
  /** Parent node id; null for root nodes */
  parent: z.string().nullable(),
  /** Child node ids in display order; empty for fix/cause leaf nodes */
  children: z.array(z.string()).default([]),
  /** For question nodes: the question being asked */
  question: z.string().optional(),
  /** For cause nodes: a one-sentence summary of the likely cause */
  cause_summary: z.string().optional(),
  /** Affects which apps the node belongs to */
  applies_to: z.enum(["photo", "video", "both"]),
});

// ─────────────────────────────────────────────────────────────────────
// LUTs & community content
// ─────────────────────────────────────────────────────────────────────

export const LutSchema = BaseContentSchema.extend({
  type: z.literal("lut"),
  creator: z.string().min(1),
  creator_url: z.string().url().optional(),
  download_url: z.string().url(),
  license: z.enum(["free", "donationware", "paid"]),
  built_for: z.array(
    z.enum([
      "v-log",
      "cinelike-d2",
      "cinelike-v2",
      "natural",
      "standard",
      "709-like",
      "any",
    ])
  ),
  look: z.array(z.string()).default([]),
  /** Optional one-line description from the creator */
  description: z.string().optional(),
});

// ─────────────────────────────────────────────────────────────────────
// Discriminated union of all content types
// ─────────────────────────────────────────────────────────────────────

export const ContentSchema = z.discriminatedUnion("type", [
  GemSchema,
  SceneSchema,
  TroubleshootSchema,
  LutSchema,
]);

// ─────────────────────────────────────────────────────────────────────
// TypeScript types — derived from schemas, never duplicated
// ─────────────────────────────────────────────────────────────────────

export type Source = z.infer<typeof SourceSchema>;
export type Conflict = z.infer<typeof ConflictSchema>;
export type Gem = z.infer<typeof GemSchema>;
export type Scene = z.infer<typeof SceneSchema>;
export type Lens = z.infer<typeof LensEntrySchema>;
export type LensList = z.infer<typeof LensListSchema>;
export type Troubleshoot = z.infer<typeof TroubleshootSchema>;
export type Lut = z.infer<typeof LutSchema>;
export type Content = z.infer<typeof ContentSchema>;
