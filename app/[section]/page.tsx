import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedPosts } from "@/lib/posts";
import { SECTIONS } from "@/lib/sections";

export function generateStaticParams() {
  return SECTIONS.map((section) => ({ section }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ section: string }>;
}): Promise<Metadata> {
  const { section } = await params;
  if (!SECTIONS.includes(section as Section)) return {};
  return { title: section.charAt(0).toUpperCase() + section.slice(1) };
}

export default async function SectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;

  if (!SECTIONS.includes(section as Section)) notFound();

  const posts = getPublishedPosts().filter((p) => p.section === section);

  return (
    <main
      className="container"
      style={{ paddingTop: "var(--sp-8)", paddingBottom: "var(--sp-12)" }}
    >
      <Link
        href="/"
        style={{
          display: "inline-block",
          fontSize: "var(--text-sm)",
          color: "var(--fg-muted)",
          marginBottom: "var(--sp-6)",
        }}
      >
        &larr; Home
      </Link>

      <h1
        style={{
          fontSize: "var(--text-2xl)",
          marginBottom: "var(--sp-4)",
        }}
      >
        {section}
      </h1>

      {posts.length === 0 ? (
        <p style={{ color: "var(--fg-muted)" }}>
          Nothing here yet. Check back soon.
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {posts.map((post) => (
            <li key={post.slug} style={{ marginBottom: "var(--sp-2)" }}>
              <Link
                href={`/${post.section}/${post.slug}`}
                className="card"
                style={{
                  display: "block",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: "var(--sp-2)",
                    flexWrap: "wrap",
                    marginBottom: "var(--sp-1)",
                  }}
                >
                  <span style={{ fontSize: "var(--text-lg)", color: "var(--fg)" }}>
                    {post.title}
                  </span>
                  <time
                    dateTime={post.date}
                    style={{ fontSize: "var(--text-xs)", color: "var(--fg-faint)", whiteSpace: "nowrap" }}
                  >
                    {post.date}
                  </time>
                </div>
                {post.description && (
                  <p style={{ fontSize: "var(--text-sm)", color: "var(--fg-muted)", margin: 0 }}>
                    {post.description}
                  </p>
                )}
                {post.tags.length > 0 && (
                  <div style={{ display: "flex", gap: "var(--sp-1)", marginTop: "var(--sp-1)" }}>
                    {post.tags.map((t) => (
                      <span key={t} className="tag">{t}</span>
                    ))}
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
