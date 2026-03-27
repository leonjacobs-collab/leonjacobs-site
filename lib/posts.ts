import fs from "fs";
import path from "path";
import matter from "gray-matter";

const POSTS_DIR = path.join(process.cwd(), "content", "posts");
const POST_EXTENSIONS = [".mdx", ".md"] as const;

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  description: string;
  tags?: string[];
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

/** Resolve a slug to a file path, preferring .mdx over .md */
function resolvePostPath(slug: string): string | null {
  for (const ext of POST_EXTENSIONS) {
    const filePath = path.join(POSTS_DIR, `${slug}${ext}`);
    if (fs.existsSync(filePath)) return filePath;
  }
  return null;
}

export function getAllPosts(): PostMeta[] {
  if (!fs.existsSync(POSTS_DIR)) return [];

  const files = fs.readdirSync(POSTS_DIR).filter(isPostFile);

  // Deduplicate: if both foo.mdx and foo.md exist, prefer .mdx
  const seen = new Map<string, string>();
  for (const file of files) {
    const slug = stripPostExtension(file);
    if (!seen.has(slug)) seen.set(slug, file);
  }

  const posts = Array.from(seen.entries()).map(([slug, file]) => {
    const raw = fs.readFileSync(path.join(POSTS_DIR, file), "utf-8");
    const { data } = matter(raw);

    return {
      slug,
      title: (data.title as string) ?? slug,
      date: (data.date as string) ?? "",
      description: (data.description as string) ?? "",
      tags: (data.tags as string[]) ?? [],
    };
  });

  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function getAllTags(): string[] {
  const posts = getAllPosts();
  const tagSet = new Set<string>();
  for (const post of posts) {
    for (const tag of post.tags ?? []) {
      tagSet.add(tag.toLowerCase());
    }
  }
  return Array.from(tagSet).sort();
}

export function getPostsByTag(tag: string): PostMeta[] {
  const needle = tag.toLowerCase();
  return getAllPosts().filter((post) =>
    (post.tags ?? []).some((t) => t.toLowerCase() === needle)
  );
}

export function getPostBySlug(slug: string) {
  const filePath = resolvePostPath(slug);
  if (!filePath) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  return {
    meta: {
      slug,
      title: (data.title as string) ?? slug,
      date: (data.date as string) ?? "",
      description: (data.description as string) ?? "",
      tags: (data.tags as string[]) ?? [],
    } satisfies PostMeta,
    content,
  };
}
