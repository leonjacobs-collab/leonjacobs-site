import { useEffect, useRef } from "react";
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

/**
 * CodeMirror 6 markdown editor.
 * @param {Object} props
 * @param {string} props.value - Current markdown content
 * @param {(value: string) => void} props.onChange - Called on content change
 * @param {React.Ref} props.viewRef - Optional ref to access the EditorView
 */
export default function MarkdownEditor({ value, onChange, viewRef }) {
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

  return (
    <div
      ref={containerRef}
      style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}
    />
  );
}
