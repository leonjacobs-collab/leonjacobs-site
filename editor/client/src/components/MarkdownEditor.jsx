import { useEffect, useRef, useCallback } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLine } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { oneDark } from "@codemirror/theme-one-dark";

/** Custom DepartureMono theme layer on top of oneDark */
const departureTheme = EditorView.theme({
  "&": {
    fontSize: "14px",
    fontFamily: "'Departure Mono', 'SF Mono', 'Fira Code', monospace",
    height: "100%",
    background: "#1a1a1a",
  },
  ".cm-scroller": {
    fontFamily: "'Departure Mono', 'SF Mono', 'Fira Code', monospace",
    overflow: "auto",
  },
  ".cm-content": {
    caretColor: "#ffa133",
    padding: "11px 0",
  },
  ".cm-cursor": {
    borderLeftColor: "#ffa133",
    borderLeftWidth: "2px",
  },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": {
    background: "rgba(255, 161, 51, 0.2) !important",
  },
  ".cm-activeLine": {
    background: "rgba(255, 255, 255, 0.03)",
  },
  ".cm-gutters": {
    background: "#1a1a1a",
    borderRight: "1px solid #3a3a3a",
    color: "#8e8e8e",
  },
  ".cm-activeLineGutter": {
    color: "#ffa133",
    background: "transparent",
  },
});

/* ── Toolbar button definitions ─────────────────────────── */

const TOOLBAR = [
  { label: "H1", title: "Heading 1", action: "heading1" },
  { label: "H2", title: "Heading 2", action: "heading2" },
  { label: "H3", title: "Heading 3", action: "heading3" },
  { sep: true },
  { label: "B", title: "Bold", action: "bold", style: { fontWeight: "bold" } },
  { label: "I", title: "Italic", action: "italic", style: { fontStyle: "italic" } },
  { label: "S", title: "Strikethrough", action: "strike", style: { textDecoration: "line-through" } },
  { sep: true },
  { label: "•", title: "Bullet list", action: "ul" },
  { label: "1.", title: "Numbered list", action: "ol" },
  { label: "❝", title: "Blockquote", action: "quote" },
  { sep: true },
  { label: "`", title: "Inline code", action: "code" },
  { label: "```", title: "Code block", action: "codeblock" },
  { label: "~~~", title: "Fenced code (with language)", action: "fenced" },
  { sep: true },
  { label: "—", title: "Horizontal rule", action: "hr" },
  { label: "🔗", title: "Link", action: "link" },
  { label: "🖼", title: "Image", action: "image" },
  { sep: true },
  { label: "📋", title: "Table", action: "table" },
];

/**
 * Apply a formatting action to the CodeMirror EditorView.
 */
function applyAction(view, action) {
  if (!view) return;
  view.focus();

  const { state } = view;
  const { from, to } = state.selection.main;
  const selected = state.sliceDoc(from, to);
  const line = state.doc.lineAt(from);
  const atLineStart = from === line.from;

  let insert;
  let newFrom, newTo;

  switch (action) {
    case "heading1":
      if (atLineStart || from === to) {
        insert = `# ${selected || "Heading"}`;
        newFrom = from + 2;
        newTo = from + 2 + (selected || "Heading").length;
      } else {
        insert = `\n# ${selected || "Heading"}`;
        newFrom = from + 3;
        newTo = from + 3 + (selected || "Heading").length;
      }
      break;
    case "heading2":
      if (atLineStart || from === to) {
        insert = `## ${selected || "Heading"}`;
        newFrom = from + 3;
        newTo = from + 3 + (selected || "Heading").length;
      } else {
        insert = `\n## ${selected || "Heading"}`;
        newFrom = from + 4;
        newTo = from + 4 + (selected || "Heading").length;
      }
      break;
    case "heading3":
      if (atLineStart || from === to) {
        insert = `### ${selected || "Heading"}`;
        newFrom = from + 4;
        newTo = from + 4 + (selected || "Heading").length;
      } else {
        insert = `\n### ${selected || "Heading"}`;
        newFrom = from + 5;
        newTo = from + 5 + (selected || "Heading").length;
      }
      break;
    case "bold":
      insert = `**${selected || "bold text"}**`;
      newFrom = from + 2;
      newTo = from + 2 + (selected || "bold text").length;
      break;
    case "italic":
      insert = `*${selected || "italic text"}*`;
      newFrom = from + 1;
      newTo = from + 1 + (selected || "italic text").length;
      break;
    case "strike":
      insert = `~~${selected || "strikethrough"}~~`;
      newFrom = from + 2;
      newTo = from + 2 + (selected || "strikethrough").length;
      break;
    case "code":
      insert = `\`${selected || "code"}\``;
      newFrom = from + 1;
      newTo = from + 1 + (selected || "code").length;
      break;
    case "codeblock":
      insert = `\n\`\`\`\n${selected || "code here"}\n\`\`\`\n`;
      newFrom = from + 5;
      newTo = from + 5 + (selected || "code here").length;
      break;
    case "fenced": {
      const lang = prompt("Language (e.g. js, python, tsx, css):", "js") || "js";
      insert = `\n\`\`\`${lang}\n${selected || "code here"}\n\`\`\`\n`;
      newFrom = from + 5 + lang.length;
      newTo = from + 5 + lang.length + (selected || "code here").length;
      break;
    }
    case "link":
      insert = `[${selected || "link text"}](url)`;
      if (selected) {
        // Place cursor in the url part
        newFrom = from + selected.length + 3;
        newTo = from + selected.length + 6;
      } else {
        newFrom = from + 1;
        newTo = from + 10;
      }
      break;
    case "image":
      insert = `![${selected || "alt text"}](/images/)`;
      newFrom = from + 2;
      newTo = from + 2 + (selected || "alt text").length;
      break;
    case "ul":
      insert = atLineStart ? `- ${selected}` : `\n- ${selected}`;
      newFrom = from + (atLineStart ? 2 : 3) + selected.length;
      newTo = newFrom;
      break;
    case "ol":
      insert = atLineStart ? `1. ${selected}` : `\n1. ${selected}`;
      newFrom = from + (atLineStart ? 3 : 4) + selected.length;
      newTo = newFrom;
      break;
    case "quote":
      insert = atLineStart ? `> ${selected || "quote"}` : `\n> ${selected || "quote"}`;
      newFrom = from + (atLineStart ? 2 : 3);
      newTo = from + (atLineStart ? 2 : 3) + (selected || "quote").length;
      break;
    case "hr":
      insert = `\n\n---\n\n`;
      newFrom = from + 7;
      newTo = newFrom;
      break;
    case "table":
      insert = `\n| Column 1 | Column 2 | Column 3 |\n| -------- | -------- | -------- |\n| cell     | cell     | cell     |\n`;
      newFrom = from + 3;
      newTo = from + 11;
      break;
    default:
      return;
  }

  view.dispatch({
    changes: { from, to, insert },
    selection: { anchor: newFrom, head: newTo },
  });
}

/**
 * CodeMirror 6 markdown editor with formatting toolbar.
 */
export default function MarkdownEditor({ value, onChange, viewRef, onImageClick }) {
  const containerRef = useRef(null);
  const editorRef = useRef(null);

  // Create editor once
  useEffect(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        markdown({ codeLanguages: languages }),
        oneDark,
        departureTheme,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString());
          }
        }),
        EditorView.lineWrapping,
      ],
    });

    const view = new EditorView({ state, parent: containerRef.current });
    editorRef.current = view;
    if (viewRef) viewRef.current = view;

    return () => view.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external value changes (e.g. loading a post)
  useEffect(() => {
    const view = editorRef.current;
    if (!view) return;
    const currentDoc = view.state.doc.toString();
    if (value !== currentDoc) {
      view.dispatch({
        changes: { from: 0, to: currentDoc.length, insert: value },
      });
    }
  }, [value]);

  const handleToolbar = useCallback((action) => {
    if (action === "image" && onImageClick) {
      onImageClick();
      return;
    }
    applyAction(editorRef.current, action);
  }, [onImageClick]);

  return (
    <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* ── Toolbar ───────────────────────────────────────── */}
      <div style={styles.toolbar}>
        {TOOLBAR.map((btn, i) =>
          btn.sep ? (
            <div key={`sep-${i}`} style={styles.sep} />
          ) : (
            <button
              key={btn.action}
              title={btn.title}
              style={{ ...styles.tbBtn, ...(btn.style || {}) }}
              onMouseDown={(e) => {
                e.preventDefault(); // keep editor focus
                handleToolbar(btn.action);
              }}
            >
              {btn.label}
            </button>
          )
        )}
      </div>

      {/* ── Editor ────────────────────────────────────────── */}
      <div
        ref={containerRef}
        style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}
      />
    </div>
  );
}

/* ── Styles ──────────────────────────────────────────────── */

const styles = {
  toolbar: {
    display: "flex",
    alignItems: "center",
    gap: 2,
    padding: "4px 8px",
    background: "var(--carbon)",
    borderBottom: "1px solid var(--smoke)",
    flexShrink: 0,
    flexWrap: "wrap",
    minHeight: 32,
  },
  tbBtn: {
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    color: "var(--ash)",
    background: "none",
    border: "1px solid transparent",
    borderRadius: 3,
    padding: "3px 7px",
    cursor: "pointer",
    lineHeight: 1.2,
    transition: "color 100ms ease, border-color 100ms ease, background 100ms ease",
    /* hover is handled via CSS below but inline fallback: */
  },
  sep: {
    width: 1,
    height: 16,
    background: "var(--smoke)",
    margin: "0 4px",
    flexShrink: 0,
  },
};
