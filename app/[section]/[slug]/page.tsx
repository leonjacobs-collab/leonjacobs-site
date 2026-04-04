import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import remarkGfm from "remark-gfm";
import rehypePrettyCode from "rehype-pretty-code";
import { getPublishedPosts, getPostBySlug } from "@/lib/posts";
import { SECTIONS } from "@/lib/sections";
import AsciiArt from "@/app/components/AsciiArt";
import ArtemisDashboard from "@/content/experimenting/artemis-dashboard/components/ArtemisDashboard";

export function generateStaticParams() {
  return getPublishedPosts().map((post) => ({
    section: post.section,
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ section: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.meta.title,
    description: post.meta.description,
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ section: string; slug: string }>;
}) {
  const { section, slug } = await params;

  // Only handle valid content sections — let other routes through
  if (!SECTIONS.includes(section)) notFound();

  const post = getPostBySlug(slug);
  if (!post) notFound();

  // If the post exists but under a different section, still show it
  // (the slug is the unique identifier)

  const { default: MDXContent } = await evaluate(post.content, {
    ...runtime,
    remarkPlugins: [remarkGfm],
    rehypePlugins: [[rehypePrettyCode, { theme: "vitesse-dark", keepBackground: true }]],
  });

  const mdxComponents = { AsciiArt, ArtemisDashboard };

  // canvas-full: render the MDX component edge-to-edge with no site chrome
  if (post.meta.layout === "canvas-full") {
    return <MDXContent components={mdxComponents} />;
  }

  return (
    <main
      className="container"
      style={{ paddingTop: "var(--sp-8)", paddingBottom: "var(--sp-12)" }}
    >
      <Link
        href="/archive"
        style={{
          display: "inline-block",
          fontSize: "var(--text-sm)",
          color: "var(--fg-muted)",
          marginBottom: "var(--sp-6)",
        }}
      >
        &larr; All posts
      </Link>

      <header style={{ marginBottom: "var(--sp-6)" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "var(--sp-2)", marginBottom: "var(--sp-1)" }}>
          <span className="tag">{post.meta.section}</span>
        </div>
        <h1 style={{ fontSize: "var(--text-2xl)", marginBottom: "var(--sp-1)" }}>
          {post.meta.title}
        </h1>
        <time
          dateTime={post.meta.date}
          style={{ fontSize: "var(--text-sm)", color: "var(--fg-faint)" }}
        >
          {post.meta.date}
        </time>
        {post.meta.tags.length > 0 && (
          <div style={{ display: "flex", gap: "var(--sp-1)", marginTop: "var(--sp-2)" }}>
            {post.meta.tags.map((tag) => (
              <Link
                key={tag}
                href={`/archive?tag=${encodeURIComponent(tag)}`}
                className="tag tag-clickable"
                style={{ textDecoration: "none" }}
              >
                {tag}
              </Link>
            ))}
          </div>
        )}
      </header>

      <hr className="divider" />

      <article className="prose">
        <MDXContent components={mdxComponents} />
      </article>
    </main>
  );
}
