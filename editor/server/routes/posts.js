import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import { SECTIONS, LEGACY_POSTS_DIR, contentDir, trashDir } from "../utils/paths.js";
import { parse, serialize, slugify } from "../utils/frontmatter.js";

const router = Router();

/** Scan a directory for .mdx files and return frontmatter array */
function scanDir(dir, section) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => {
      const raw = fs.readFileSync(path.join(dir, f), "utf-8");
      const { data } = parse(raw);
      const slug = f.replace(/\.mdx$/, "");
      return {
        slug,
        section: data.section || section,
        title: data.title || slug,
        date: data.date || "",
        description: data.description || "",
        tags: data.tags || [],
        draft: data.draft !== false,
        code: data.code || slug.slice(0, 3).toUpperCase(),
      };
    });
}

/**
 * GET /api/posts?section=writing
 * List all posts, optionally filtered by section.
 */
router.get("/", (req, res) => {
  const filter = req.query.section;
  let posts = [];

  for (const section of SECTIONS) {
    posts.push(...scanDir(contentDir(section), section));
  }
  // Also scan legacy content/posts/ directory
  posts.push(...scanDir(LEGACY_POSTS_DIR, "writing"));

  if (filter) {
    posts = posts.filter((p) => p.section === filter);
  }

  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  res.json(posts);
});

/**
 * GET /api/posts/:section/:slug
 * Read a full post (frontmatter + body).
 */
router.get("/:section/:slug", (req, res) => {
  const { section, slug } = req.params;
  const filePath = path.join(contentDir(section), `${slug}.mdx`);
  // Fallback to legacy
  const legacyPath = path.join(LEGACY_POSTS_DIR, `${slug}.mdx`);
  const target = fs.existsSync(filePath) ? filePath : fs.existsSync(legacyPath) ? legacyPath : null;

  if (!target) return res.status(404).json({ error: "Post not found" });

  const raw = fs.readFileSync(target, "utf-8");
  const { data, content } = parse(raw);
  res.json({ frontmatter: data, body: content, path: target });
});

/**
 * POST /api/posts
 * Create a new post. Body: { title, section, tags, date, description, draft, code, body }
 */
router.post("/", (req, res) => {
  const { title, section = "writing", tags, date, description, draft = true, code, body = "" } = req.body;
  if (!title) return res.status(400).json({ error: "Title is required" });

  const slug = slugify(title);
  const dir = contentDir(section);
  fs.mkdirSync(dir, { recursive: true });

  const filePath = path.join(dir, `${slug}.mdx`);
  if (fs.existsSync(filePath)) {
    return res.status(409).json({ error: "Post already exists" });
  }

  const frontmatter = {
    title,
    date: date || new Date().toISOString().slice(0, 10),
    description: description || "",
    section,
    tags: tags || [],
    draft: draft !== false,
    code: code || slug.slice(0, 3).toUpperCase(),
  };

  fs.writeFileSync(filePath, serialize(frontmatter, body), "utf-8");
  res.status(201).json({ slug, section, path: filePath });
});

/**
 * PUT /api/posts/:section/:slug
 * Update an existing post.
 */
router.put("/:section/:slug", (req, res) => {
  const { section, slug } = req.params;
  const { frontmatter, body } = req.body;

  const filePath = path.join(contentDir(section), `${slug}.mdx`);
  const legacyPath = path.join(LEGACY_POSTS_DIR, `${slug}.mdx`);

  // If section changed, write to new location
  const targetDir = contentDir(frontmatter?.section || section);
  const targetSlug = frontmatter?.slug || slug;
  const targetPath = path.join(targetDir, `${targetSlug}.mdx`);

  fs.mkdirSync(targetDir, { recursive: true });

  const fm = {
    title: frontmatter?.title || slug,
    date: frontmatter?.date || new Date().toISOString().slice(0, 10),
    description: frontmatter?.description || "",
    section: frontmatter?.section || section,
    tags: frontmatter?.tags || [],
    draft: frontmatter?.draft !== false,
    code: frontmatter?.code || targetSlug.slice(0, 3).toUpperCase(),
  };

  fs.writeFileSync(targetPath, serialize(fm, body || ""), "utf-8");

  // If slug/section changed, remove old file
  if (targetPath !== filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  } else if (targetPath !== legacyPath && fs.existsSync(legacyPath)) {
    fs.unlinkSync(legacyPath);
  }

  res.json({ slug: targetSlug, section: fm.section, path: targetPath });
});

/**
 * DELETE /api/posts/:section/:slug
 * Soft-delete: move to .trash/ folder.
 */
router.delete("/:section/:slug", (req, res) => {
  const { section, slug } = req.params;
  const filePath = path.join(contentDir(section), `${slug}.mdx`);
  const legacyPath = path.join(LEGACY_POSTS_DIR, `${slug}.mdx`);
  const source = fs.existsSync(filePath) ? filePath : fs.existsSync(legacyPath) ? legacyPath : null;

  if (!source) return res.status(404).json({ error: "Post not found" });

  const trash = trashDir();
  fs.mkdirSync(trash, { recursive: true });
  const dest = path.join(trash, `${section}--${slug}.mdx`);
  fs.renameSync(source, dest);
  res.json({ message: "Moved to trash", trash: dest });
});

export default router;
