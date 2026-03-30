import { useEffect, useState } from "react";

/** Placeholder for <AsciiArt> in the editor preview (renderToString is sync) */
function AsciiArtPreview({ src, cols, ramp, mode, speed, invert }) {
  return (
    <div
      style={{
        border: "1px dashed #3a3a3a",
        background: "#1a1a1a",
        padding: "24px 16px",
        margin: "16px 0",
        textAlign: "center",
        fontFamily: "'Departure Mono', monospace",
      }}
    >
      <div style={{ fontSize: "20px", opacity: 0.3, marginBottom: 8 }}>▓</div>
      <div style={{ fontSize: "11px", color: "#8e8e8e", letterSpacing: "0.12em" }}>
        ASCII ART
      </div>
      <div style={{ fontSize: "10px", color: "#5a5a5a", marginTop: 6 }}>
        {src} · {cols || 100} cols · {ramp || "departure"} · {mode || "cascade"}
      </div>
    </div>
  );
}

/**
 * Live MDX preview panel.
 * Compiles MDX client-side using @mdx-js/mdx and renders with React.
 * Falls back to raw markdown display on compile errors.
 */
export default function Preview({ markdown, frontmatter }) {
  const [html, setHtml] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!markdown) {
      setHtml("");
      setError(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        // Dynamic import to avoid SSR/bundling issues
        const { compile } = await import("@mdx-js/mdx");
        const remarkGfm = (await import("remark-gfm")).default;

        const compiled = await compile(markdown, {
          outputFormat: "function-body",
          remarkPlugins: [remarkGfm],
        });

        // Evaluate the compiled MDX
        const { run } = await import("@mdx-js/mdx");
        const React = await import("react");
        const { renderToString } = await import("react-dom/server");
        const runtime = await import("react/jsx-runtime");

        const { default: Content } = await run(compiled, {
          ...runtime,
          baseUrl: import.meta.url,
        });

        const rendered = renderToString(
          React.createElement(Content, { components: { AsciiArt: AsciiArtPreview } })
        );
        setHtml(rendered);
        setError(null);
      } catch (err) {
        setError(err.message);
        // Keep showing last good render
      }
    }, 300); // debounce

    return () => clearTimeout(timer);
  }, [markdown]);

  return (
    <div style={styles.wrapper}>
      {/* Preview header bar */}
      <div style={styles.header}>
        <span style={styles.headerLabel}>Preview</span>
        {error && <span style={styles.errorBadge}>ERR</span>}
      </div>

      {/* Rendered content */}
      <div style={styles.content}>
        {frontmatter?.title && (
          <div style={styles.titleBlock}>
            <h1 style={styles.title}>{frontmatter.title}</h1>
            {frontmatter.date && <time style={styles.date}>{frontmatter.date}</time>}
            {frontmatter.tags?.length > 0 && (
              <div style={styles.tags}>
                {frontmatter.tags.map((t) => (
                  <span key={t} className="tag-pill">{t}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {error && (
          <pre style={styles.errorBlock}>{error}</pre>
        )}

        <div
          className="preview-prose"
          style={styles.prose}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    borderLeft: "1px solid var(--smoke)",
    background: "#1e1e1e",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "0 var(--sp-2)",
    height: 32,
    background: "var(--carbon)",
    borderBottom: "1px solid var(--smoke)",
    flexShrink: 0,
  },
  headerLabel: {
    fontSize: "var(--text-xs)",
    color: "var(--ash)",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
  },
  errorBadge: {
    fontSize: "var(--text-xs)",
    color: "var(--red)",
    border: "1px solid var(--red)",
    padding: "1px 6px",
    letterSpacing: "0.08em",
  },
  content: {
    flex: 1,
    overflow: "auto",
    padding: "var(--sp-2) var(--sp-3)",
  },
  titleBlock: {
    marginBottom: "var(--sp-2)",
    paddingBottom: "var(--sp-2)",
    borderBottom: "1px solid var(--smoke)",
  },
  title: {
    fontSize: "var(--text-xl)",
    color: "var(--enamel)",
    fontWeight: "normal",
    marginBottom: 4,
  },
  date: {
    fontSize: "var(--text-xs)",
    color: "var(--ash)",
  },
  tags: {
    display: "flex",
    gap: 6,
    marginTop: 8,
  },
  errorBlock: {
    fontFamily: "var(--font-mono)",
    fontSize: "var(--text-xs)",
    color: "var(--red)",
    background: "rgba(239, 68, 68, 0.1)",
    border: "1px solid var(--red)",
    padding: "var(--sp-1)",
    marginBottom: "var(--sp-2)",
    overflow: "auto",
    whiteSpace: "pre-wrap",
  },
  prose: {
    color: "var(--cement)",
    fontSize: "var(--text-sm)",
    lineHeight: 1.7,
  },
};
