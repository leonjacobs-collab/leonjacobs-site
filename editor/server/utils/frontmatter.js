import matter from "gray-matter";

/**
 * Parse an MDX string into { data (frontmatter), content (body) }.
 */
export function parse(raw) {
  const { data, content } = matter(raw);
  return { data, content };
}

/**
 * Serialize frontmatter object + markdown body back into an MDX string.
 */
export function serialize(data, body) {
  return matter.stringify(body, data);
}

/**
 * Generate a slug from a title string.
 */
export function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
