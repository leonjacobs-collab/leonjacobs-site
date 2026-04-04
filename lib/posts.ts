import fs from "fs";
import path from "path";
import matter from "gray-matter";

import { SECTIONS, type Section } from "./sections";

const CONTENT_DIR = path.join(process.cwd(), "content");
const POST_EXTENSIONS = [".mdx", ".md"] as const;

export type { Section };

export interface PostMeta {
  slug: string;
  section: Section;
  title: string;
  date: string;
  description: string;
  tags: string[];
  draft: boolean;
  layout?: string;
}

function isPostFile(filename: string): boolean {
  return POST_EXTENSIONS.some((ext) => filename.endsWith(ext));
}

function stripPostExtension(filename: string): string {
  for (const ext of POST_EXTENSIONS) {
    if (filename.endsWith(ext)) return filename.slice(0, -ext.length);
  }
  return filename;
}

/**
 * Scan all section directories under content/ and return every post.
 * Includes drafts — callers should filter with `.filter(p => !p.draft)` for public pages.
 */
export function getAllPosts(): PostMeta[] {
  const posts: PostMeta[] = [];

  for (const section of SECTIONS) {
    const dir = path.join(CONTENT_DIR, section);
    if (!fs.existsSync(dir)) continue;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files = entries.filter((e) => e.isFile() && isPostFile(e.name)).map((e) => e.name);

    // Deduplicate: if both foo.mdx and foo.md exist, prefer .mdx
    const seen = new Map<string, string>();
    for (const file of files) {
      const slug = stripPostExtension(file);
      if (!seen.has(slug)) seen.set(slug, file);
    }

    for (const [slug, file] of seen.entries()) {
      const raw = fs.readFileSync(path.join(dir, file), "utf-8");
      const { data } = matter(raw);

      posts.push({
        slug,
        section: (data.section as Section) || section,
        title: (data.title as string) ?? slug,
        date: (data.date as string) ?? "",
        description: (data.description as string) ?? "",
        tags: (data.tags as string[]) ?? [],
        draft: data.draft !== false,
        layout: (data.layout as string) ?? undefined,
      });
    }

    // Also scan subdirectories for folder-based posts (dir/slug/index.mdx)
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const slug = entry.name;
      if (seen.has(slug)) continue; // already have a flat file with this slug
      const indexPath = path.join(dir, slug, "index.mdx");
      if (!fs.existsSync(indexPath)) continue;
      const raw = fs.readFileSync(indexPath, "utf-8");
      const { data } = matter(raw);
      posts.push({
        slug,
        section: (data.section as Section) || section,
        title: (data.title as string) ?? slug,
        date: (data.date as string) ?? "",
        description: (data.description as string) ?? "",
        tags: (data.tags as string[]) ?? [],
        draft: data.draft !== false,
        layout: (data.layout as string) ?? undefined,
      });
    }
  }

  // Also scan legacy content/posts/ if it exists and has MDX files
  const legacyDir = path.join(CONTENT_DIR, "posts");
  if (fs.existsSync(legacyDir)) {
    const legacyFiles = fs.readdirSync(legacyDir).filter(isPostFile);
    const seen = new Map<string, string>();
    for (const file of legacyFiles) {
      const slug = stripPostExtension(file);
      if (!seen.has(slug)) seen.set(slug, file);
    }
    for (const [slug, file] of seen.entries()) {
      // Skip if we already have this slug from a section directory
      if (posts.some((p) => p.slug === slug)) continue;

      const raw = fs.readFileSync(path.join(legacyDir, file), "utf-8");
      const { data } = matter(raw);

      posts.push({
        slug,
        section: (data.section as Section) || "writing",
        title: (data.title as string) ?? slug,
        date: (data.date as string) ?? "",
        description: (data.description as string) ?? "",
        tags: (data.tags as string[]) ?? [],
        draft: data.draft !== false,
      });
    }
  }

  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

/** Get all published (non-draft) posts */
export function getPublishedPosts(): PostMeta[] {
  return getAllPosts().filter((p) => !p.draft);
}

/** Get all unique tags from published posts */
export function getAllTags(): string[] {
  const posts = getPublishedPosts();
  const tagSet = new Set<string>();
  for (const post of posts) {
    for (const tag of post.tags) {
      tagSet.add(tag.toLowerCase());
    }
  }
  return Array.from(tagSet).sort();
}

/** Get published posts matching a tag */
export function getPostsByTag(tag: string): PostMeta[] {
  const needle = tag.toLowerCase();
  return getPublishedPosts().filter((post) =>
    post.tags.some((t) => t.toLowerCase() === needle)
  );
}

/** Resolve a slug to its file path, searching all sections */
function resolvePostPath(slug: string): { filePath: string; section: Section } | null {
  for (const section of SECTIONS) {
    for (const ext of POST_EXTENSIONS) {
      const filePath = path.join(CONTENT_DIR, section, `${slug}${ext}`);
      if (fs.existsSync(filePath)) return { filePath, section };
    }
    // Folder-based: content/{section}/{slug}/index.mdx
    const indexPath = path.join(CONTENT_DIR, section, slug, "index.mdx");
    if (fs.existsSync(indexPath)) return { filePath: indexPath, section };
  }
  // Legacy fallback
  for (const ext of POST_EXTENSIONS) {
    const filePath = path.join(CONTENT_DIR, "posts", `${slug}${ext}`);
    if (fs.existsSync(filePath)) return { filePath, section: "writing" };
  }
  return null;
}

export function getPostBySlug(slug: string) {
  const resolved = resolvePostPath(slug);
  if (!resolved) return null;

  const raw = fs.readFileSync(resolved.filePath, "utf-8");
  const { data, content } = matter(raw);

  return {
    meta: {
      slug,
      section: (data.section as Section) || resolved.section,
      title: (data.title as string) ?? slug,
      date: (data.date as string) ?? "",
      description: (data.description as string) ?? "",
      tags: (data.tags as string[]) ?? [],
      draft: data.draft !== false,
      layout: (data.layout as string) ?? undefined,
    } satisfies PostMeta,
    content,
  };
}
