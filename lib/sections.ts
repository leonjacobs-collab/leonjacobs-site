/**
 * Single source of truth for content sections.
 *
 * ➜ To add a new section, edit sections.json — it propagates to:
 *   - Next.js site (post scanning, routing, nav)
 *   - Editor CMS (section dropdown, file paths)
 */
import sectionsJson from "./sections.json";

export const SECTIONS = sectionsJson as readonly string[];

export type Section = (typeof sectionsJson)[number];
