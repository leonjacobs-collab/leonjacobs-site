import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import remarkGfm from "remark-gfm";
import rehypePrettyCode from "rehype-pretty-code";
import { getAllPosts, getPostBySlug } from "@/lib/posts";

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.meta.title,
    description: post.meta.description,
  };
}

export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const { default: MDXContent } = await evaluate(post.content, {
    ...runtime,
    remarkPlugins: [remarkGfm],
    rehypePlugins: [[rehypePrettyCode, { theme: "vitesse-dark", keepBackground: true }]],
  });

  return (
    <main
      className="container"
      style={{ paddingTop: "var(--sp-8)", paddingBottom: "var(--sp-12)" }}
    >
      <Link
        href="/blogging"
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
        <h1 style={{ fontSize: "var(--text-2xl)", marginBottom: "var(--sp-1)" }}>
          {post.meta.title}
        </h1>
        <time
          dateTime={post.meta.date}
          style={{ fontSize: "var(--text-sm)", color: "var(--fg-faint)" }}
        >
          {post.meta.date}
        </time>
        {post.meta.tags && post.meta.tags.length > 0 && (
          <div style={{ display: "flex", gap: "var(--sp-1)", marginTop: "var(--sp-2)" }}>
            {post.meta.tags.map((tag) => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        )}
      </header>

      <hr className="divider" />

      <article className="prose">
        <MDXContent />
      </article>
    </main>
  );
}
