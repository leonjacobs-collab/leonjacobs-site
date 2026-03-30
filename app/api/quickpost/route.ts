import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/quickpost
 *
 * Creates a new blog post by committing an MDX file to GitHub.
 * Designed to be called from iOS Shortcuts, a bookmarklet, or curl.
 *
 * Headers:
 *   Authorization: Bearer <QUICKPOST_KEY>
 *
 * Body (JSON):
 *   title:       string (required)
 *   body:        string (required — the markdown content)
 *   section:     string (optional, defaults to "writing")
 *   tags:        string[] (optional)
 *   description: string (optional)
 *   draft:       boolean (optional, defaults to false)
 *   imageUrl:    string (optional — external URL to reference)
 */

const GITHUB_REPO = "leonjacobs-collab/leonjacobs-site";
const CONTENT_PATH_PREFIX = "content";
const BRANCH = "main";

// Nested repo: the actual content lives inside leonjacobs-site/
const REPO_PREFIX = "leonjacobs-site";

const VALID_SECTIONS = [
  "blogging", "writing", "building", "experimenting",
  "designing", "showcasing", "photographing",
];

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toBase64(str: string): string {
  return Buffer.from(str, "utf-8").toString("base64");
}

export async function POST(req: NextRequest) {
  // ── Auth ──
  const authHeader = req.headers.get("authorization");
  const expectedKey = process.env.QUICKPOST_KEY;

  if (!expectedKey) {
    return NextResponse.json(
      { error: "QUICKPOST_KEY not configured on server" },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${expectedKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Parse body ──
  let payload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    title,
    body,
    section = "writing",
    tags = [],
    description = "",
    draft = false,
    imageUrl,
  } = payload;

  if (!title || !body) {
    return NextResponse.json(
      { error: "title and body are required" },
      { status: 400 }
    );
  }

  if (!VALID_SECTIONS.includes(section)) {
    return NextResponse.json(
      { error: `Invalid section. Valid: ${VALID_SECTIONS.join(", ")}` },
      { status: 400 }
    );
  }

  // ── Build MDX content ──
  const slug = slugify(title);
  const date = new Date().toISOString().slice(0, 10);
  const code = slug.slice(0, 3).toUpperCase();

  let mdxBody = body;
  if (imageUrl) {
    mdxBody = `![${title}](${imageUrl})\n\n${body}`;
  }

  const frontmatter = [
    "---",
    `title: "${title.replace(/"/g, '\\"')}"`,
    `date: "${date}"`,
    `description: "${description.replace(/"/g, '\\"')}"`,
    `section: ${section}`,
    `tags: [${tags.map((t: string) => `"${t}"`).join(", ")}]`,
    `draft: ${draft}`,
    `code: ${code}`,
    "---",
  ].join("\n");

  const mdxContent = `${frontmatter}\n\n${mdxBody}\n`;

  // ── Commit to GitHub ──
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    return NextResponse.json(
      { error: "GITHUB_TOKEN not configured on server" },
      { status: 500 }
    );
  }

  const filePath = `${REPO_PREFIX}/${CONTENT_PATH_PREFIX}/${section}/${slug}.mdx`;
  const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`;

  const ghRes = await fetch(apiUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${githubToken}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: `quickpost: ${title}`,
      content: toBase64(mdxContent),
      branch: BRANCH,
    }),
  });

  if (!ghRes.ok) {
    const err = await ghRes.json().catch(() => ({}));
    return NextResponse.json(
      {
        error: "GitHub API error",
        status: ghRes.status,
        detail: err.message || "Unknown error",
      },
      { status: 502 }
    );
  }

  const result = await ghRes.json();

  return NextResponse.json({
    success: true,
    slug,
    section,
    date,
    url: `https://leonmay.be/${section}/${slug}`,
    commit: result.commit?.sha?.slice(0, 7),
  });
}
