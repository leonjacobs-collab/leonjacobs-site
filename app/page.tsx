import { getAllTags } from "@/lib/posts";
import { SearchField } from "./components/SearchField";
import Masthead from "./components/Masthead";

export default function Home() {
  const tags = getAllTags();

  return (
    <main className="container" style={{ paddingTop: "var(--sp-8)", paddingBottom: "var(--sp-12)" }}>
      <Masthead />

      <p
        style={{
          fontSize: "var(--text-lg)",
          color: "var(--fg-muted)",
          maxWidth: "55ch",
          marginBottom: "var(--sp-6)",
          lineHeight: "var(--leading-snug)",
          textAlign: "center",
          margin: "0 auto var(--sp-6)",
        }}
      >
        Creative &amp; Experience Director at Empathy Lab.
        <br />
        Professional overthinker, robot wrangler of wayward intelligence,
        and arranger of letters in a satisfying order and the first of his name.
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
