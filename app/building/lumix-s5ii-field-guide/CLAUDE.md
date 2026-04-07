# CLAUDE.md — Lumix S5II Field Guide

This file is for Claude Code (and any other AI assistant) working on this section of the site. **Read this first.** It will save us both time.

## What this is

A self-contained section of leonmay.be that lives at `/building/lumix-s5ii-field-guide`. It is a content-driven micro-app for Panasonic Lumix S5II owners — specifically Leon, but built so other owners can use it too. It is **not** a blog. It is not a wiki. It is a small, queryable knowledge base with purpose-built interactive surfaces sitting on top of it.

The four mini-apps:

1. **Hidden Gems Browser** — filterable directory of menu-buried features. Status: reference implementation. Use this as the pattern for the others.
2. **Scene → Settings Recommender** — pick a shooting scenario, get a starting exposure triangle, AF mode, lens picks, and watch-outs. Status: stub.
3. **Lens Decision Helper** — "I'm shooting X, I own Y and Z, what should I grab?" Status: stub.
4. **Troubleshooting Decision Tree** — symptom → branching questions → likely causes → fixes. Status: stub.

Plus a fifth, simpler surface:

5. **LUTs & Community Content Directory** — tagged, filterable list of LUTs, presets, and profiles with creator attribution. Status: stub with placeholder data.

## Where things live

```
app/building/lumix-s5ii-field-guide/   ← all routes for the field guide
  page.tsx                              ← landing page (instrument-panel grid of the 5 apps)
  layout.tsx                            ← section-specific layout if needed (currently inherits root)
  gems/                                 ← Hidden Gems Browser (REFERENCE IMPLEMENTATION)
  scenes/                               ← Scene Recommender (stub)
  lenses/                               ← Lens Helper (stub)
  troubleshoot/                         ← Troubleshooting Tree (stub)
  luts/                                 ← LUTs Directory (stub)
  components/                           ← components scoped to this section only
    InstrumentPanel.tsx                 ← shared dashboard-grid wrapper
    GemCard.tsx                         ← reference card component
    FilterBar.tsx                       ← shared filter pattern
    SourceCitation.tsx                  ← inline citation rendering
    ConflictBadge.tsx                   ← "sources disagree" badge
  CLAUDE.md                             ← this file

lib/field-guide/                        ← all data-loading and validation logic
  schemas.ts                            ← Zod schemas for every content type
  loader.ts                             ← reads /content/lumix-s5ii/**, validates, returns typed data
  types.ts                              ← exported TypeScript types derived from schemas
  citation.ts                           ← helpers for rendering source citations
  conflict.ts                           ← helpers for detecting and rendering source conflicts

content/lumix-s5ii/                     ← all field-guide content as markdown + frontmatter
  gems/*.md
  scenes/*.md
  lenses/lenses.json                    ← single JSON file, refreshed by scraper
  troubleshoot/*.md
  luts/*.md

scripts/
  scrape-lmount-lenses.mjs              ← fetches l-mount.com, writes lenses.json
  new-fg-content.mjs                    ← authoring CLI for scaffolding new content files

.github/workflows/
  refresh-lenses.yml                    ← scheduled GitHub Action that runs the scraper monthly
```

## Hard rules

These are non-negotiable. The whole point of building this inside the existing repo is visual and structural cohesion with leonmay.be.

### Styling

1. **Use only the existing design tokens from `globals.css`.** Variables like `--bg`, `--bg-raised`, `--bg-sunken`, `--fg`, `--fg-muted`, `--fg-faint`, `--accent`, `--border`, `--sp-*`, `--text-*`, `--shadow-raised`, `--shadow-sunken`, `--shadow-glow`. **Do not introduce new CSS variables, new fonts, new colors, or any new design tokens.** If you genuinely need a new token, raise it as a comment in the PR — do not add it silently.
2. **Departure Mono only.** No new font imports. The font is already loaded in the root layout.
3. **Use existing utility classes from `globals.css` where they exist:** `.container`, `.card`, `.tag`, `.btn`, `.divider`, `.prose`, `.tag-clickable`, `.search-form`, `.search-input`, `.search-btn`. Add component-scoped CSS modules for things that don't have an existing class — never inline `<style>` tags, never new global classes.
4. **No Tailwind. No CSS-in-JS libraries.** The site uses plain CSS with design tokens. Match that.
5. **Both light and dark themes must work.** Test by toggling. If you write a custom color, you've broken the theme contract.
6. **Lean into the instrument-panel aesthetic.** Three-letter ALL CAPS section codes (`GEM`, `SCN`, `LNS`, `TRB`, `LUT`), uppercase letter-spaced labels for utility text, ASCII progress bars where appropriate, neumorphic cards. The Artemis dashboard at `/experimenting/artemis-dashboard` is the tonal reference. A camera is an instrument; treat it like one.

### Content & data

7. **All content lives in `/content/lumix-s5ii/`** as markdown files with YAML frontmatter (or, for lenses, a single JSON file). **Never** embed content inside component files.
8. **Every content file must validate against its Zod schema in `lib/field-guide/schemas.ts`.** Validation runs at build time. Bad frontmatter fails the build — this is intentional.
9. **Every claim about the camera must cite its source** in the `sources` frontmatter array. Sources have a `name`, optional `ref` (page number, timestamp, URL fragment), and a `type` (`official` for the manual, `creator` for video/article authors, `community` for forum posts, `firsthand` for Leon's own testing).
10. **When sources disagree, use the `conflicts` frontmatter array** to record the disagreement with `claim`, `counter`, and (optionally) a `resolution`. This drives the conflict-badge UI in the recommender output. If `resolution` is null, the badge stays neutral and surfaces both views. **Calculators and lookup tables must never carry conflicts** — if there's a disagreement, resolve it editorially before publishing.
11. **The `id` field in every file must be a unique slug** matching the filename without the `.md` extension. The loader will reject duplicates.

### Architecture

12. **Static-only.** Everything renders at build time. No API routes, no server functions, no client-side fetching of data files. Content gets compiled into a typed index that components import directly.
13. **Filtering happens in the browser** against the pre-built index. The index is small (a few hundred KB at most). Use `useState` and `useMemo` — no state libraries.
14. **Do not introduce a database, a CMS, or any external content service.** The whole point is that content lives in markdown files in this repo.
15. **Do not couple the field guide to leonmay.be's blog/posts system.** They are separate. The field guide does not appear in `/lib/posts.ts`, does not show up in tag clouds, does not appear in the RSS feed.
16. **All routes must be statically generated.** Use Next.js's default static generation. No `dynamic = 'force-dynamic'`. No `revalidate`.

### MDX vs plain markdown

17. The root `next.config.ts` has MDX enabled, but field-guide content is **plain markdown parsed at build time with `gray-matter`** — not MDX rendered as components. The reasons: it keeps content portable, it makes the authoring CLI trivial, and it means contributors don't need to know JSX. The body of each file is just markdown prose; the frontmatter does the structural work.

## Citation conventions

In the body of a content file, cite sources inline like this:

```markdown
Set Dual Native ISO to HIGH for clean low-light shooting [^manual].
Tyler Stalman confirms the dual-gain sensor cleans up noticeably at ISO 4000 [^stalman].

[^manual]: S5II Owner's Manual, p.412
[^stalman]: Tyler Stalman — "How I Shoot the Lumix S5II" video transcript
```

The footnote keys must match `name` slugs in the frontmatter `sources` array. The renderer will turn these into hover/click cite links with full source info, using the existing accent color and `text-shadow` glow.

## Conflict callout convention

When the manual and a creator disagree, surface it like this in the body:

```markdown
> **Sources disagree.** The manual recommends X for general use [^manual], but
> Stalman argues Y is better in practice because the buffer behaves differently [^stalman].
> For this guide, we recommend X for stills and Y for video.
```

And mirror it in frontmatter:

```yaml
conflicts:
  - claim: "Manual recommends X for general use"
    counter: "Stalman argues Y is better in practice because the buffer behaves differently"
    resolution: "Use X for stills, Y for video"
```

The frontmatter version drives the UI badge. The prose version lives in the article body for readers.

## Adding new content

Use the CLI:

```bash
npm run fg:new -- gem
npm run fg:new -- scene
npm run fg:new -- troubleshoot
npm run fg:new -- lut
```

The CLI prompts for required fields, generates a slug, scaffolds a markdown file with valid frontmatter, and opens it in `$EDITOR`. **Do not hand-write content files** unless you're fixing a typo — the CLI prevents schema violations.

## How to add a new mini-app

1. Create `app/building/lumix-s5ii-field-guide/<app-name>/page.tsx`.
2. Add a new content type if needed: schema in `lib/field-guide/schemas.ts`, folder in `content/lumix-s5ii/`, loader entry in `lib/field-guide/loader.ts`.
3. Add a corresponding case in `scripts/new-fg-content.mjs`.
4. Build the page using the same patterns as the Hidden Gems browser: `InstrumentPanel` wrapper, `FilterBar` for filters, content cards using neumorphic styling from `globals.css`.
5. Add a tile for it on the field guide landing page (`app/building/lumix-s5ii-field-guide/page.tsx`).

## Things not to do

- Do not create a search bar that does free-text search across all content. Filters are structured. If users want free-text search across leonmay.be, they have the existing site search at the root.
- Do not add analytics, tracking, or telemetry of any kind.
- Do not add comment systems, accounts, or user-generated content uploads. If a community member wants to contribute a LUT, they open a PR.
- Do not auto-update the L-mount lens list outside the GitHub Action. No client-side scraping. No third-party APIs.
- Do not add images you generated. Camera reference images, if needed, must be photos taken by Leon or properly licensed.
- Do not write content based on your training data about the S5II. Cite the manual or one of the transcripts in `/mnt/project/` (or, in the live repo, the equivalent source material that you've been given).
- Do not put TypeScript types and Zod schemas in different files — derive types from schemas using `z.infer`.

## Open questions / known TODOs

- The L-mount scraper has a fallback path if the page structure changes. Verify it on first run before relying on it. If the scraper fails, the site still builds — it just uses the last-good `lenses.json`.
- The Lens Decision Helper needs a "lenses I own" mechanism. The current plan: localStorage-backed inventory, no account required. To be implemented.
- The Troubleshooting Tree currently has only 5 worked nodes as a worked example. Expand as real problems surface.
- LUTs directory has placeholder entries only. Real entries depend on Leon curating them.
