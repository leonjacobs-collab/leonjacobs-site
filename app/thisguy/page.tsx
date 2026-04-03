import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "This Guy",
  description: "About Leon Jacobs — creative experience designer with over 30 years as a creative professional.",
};

export default function ThisGuy() {
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
          marginBottom: "var(--sp-6)",
        }}
      >
        About Leon Jacobs
      </h1>

      <p
        style={{
          fontSize: "var(--text-lg)",
          color: "var(--fg-muted)",
          maxWidth: "60ch",
          lineHeight: "var(--leading-body)",
          marginBottom: "var(--sp-10)",
        }}
      >
        I&rsquo;m a creative experience designer with over 30 years experience as a
        creative professional. I&rsquo;ve worked with some of the world&rsquo;s biggest
        brands, and collaborated with some of the best creative minds of the last and
        new millennium. Big statement, but yeah, having had to live through the Y2K
        debacle has to come with some upside.
      </p>

      <hr className="divider" />

      <ul
        style={{
          listStyle: "none",
          padding: 0,
          display: "flex",
          flexDirection: "column",
          gap: "var(--sp-3)",
          fontSize: "var(--text-sm)",
        }}
      >
        <li>
          <span style={{ color: "var(--fg-faint)", marginRight: "var(--sp-2)" }}>LinkedIn</span>
          <a
            href="https://www.linkedin.com/in/leonjacobs"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--accent)" }}
          >
            linkedin.com/in/leonjacobs
          </a>
        </li>
        <li>
          <span style={{ color: "var(--fg-faint)", marginRight: "var(--sp-2)" }}>Instagram</span>
          <a
            href="https://www.instagram.com/leonjacobs"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--accent)" }}
          >
            @leonjacobs
          </a>
        </li>
        <li>
          <span style={{ color: "var(--fg-faint)", marginRight: "var(--sp-2)" }}>Contact</span>
          <a
            href="mailto:leon@leonmay.be"
            style={{ color: "var(--accent)" }}
          >
            leon@leonmay.be
          </a>
        </li>
      </ul>
    </main>
  );
}
