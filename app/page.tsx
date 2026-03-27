import { getAllTags } from "@/lib/posts";
import { SearchField } from "./components/SearchField";

export default function Home() {
  const tags = getAllTags();

  return (
    <main className="container" style={{ paddingTop: "var(--sp-16)", paddingBottom: "var(--sp-12)" }}>
      <div style={{ marginBottom: "var(--sp-2)" }}>
        <span className="tag">v2.0</span>
      </div>

      <h1
        style={{
          fontSize: "var(--text-3xl)",
          lineHeight: "var(--leading-tight)",
          marginBottom: "var(--sp-4)",
        }}
      >
        Leon Jacobs
      </h1>

      <p
        style={{
          fontSize: "var(--text-lg)",
          color: "var(--fg-muted)",
          maxWidth: "55ch",
          marginBottom: "var(--sp-6)",
          lineHeight: "var(--leading-snug)",
        }}
      >
        Creative &amp; Experience Director at Empathy Lab.
        <br />
        Professional overthinker, robot wrangler of wayward intelligence,
        and arranger of letters in a satisfying order.
      </p>

      <SearchField tags={tags} />

      <hr className="divider" />

      <footer
        style={{
          fontSize: "var(--text-sm)",
          color: "var(--fg-faint)",
        }}
      >
        &copy; {new Date().getFullYear()} Leon Jacobs
      </footer>
    </main>
  );
}
