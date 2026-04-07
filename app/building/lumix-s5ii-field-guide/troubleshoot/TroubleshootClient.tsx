"use client";

import { useCallback, useMemo, useState } from "react";
import type { Troubleshoot } from "@/lib/field-guide/schemas";
import styles from "./TroubleshootClient.module.css";

interface TroubleshootNode {
  data: Troubleshoot;
  body: string;
}

interface TroubleshootClientProps {
  nodes: TroubleshootNode[];
}

export function TroubleshootClient({ nodes }: TroubleshootClientProps) {
  const [path, setPath] = useState<string[]>([]);

  const nodeMap = useMemo(() => {
    const map = new Map<string, TroubleshootNode>();
    nodes.forEach((n) => map.set(n.data.id, n));
    return map;
  }, [nodes]);

  const roots = useMemo(
    () => nodes.filter((n) => n.data.node_type === "root"),
    [nodes]
  );

  const currentId = path.length > 0 ? path[path.length - 1] : null;
  const current = currentId ? nodeMap.get(currentId) : null;

  const navigate = useCallback((id: string) => {
    setPath((prev) => [...prev, id]);
  }, []);

  const navigateTo = useCallback((index: number) => {
    setPath((prev) => prev.slice(0, index + 1));
  }, []);

  const goBack = useCallback(() => {
    setPath((prev) => prev.slice(0, -1));
  }, []);

  const reset = useCallback(() => {
    setPath([]);
  }, []);

  // Root selection view
  if (!current) {
    return (
      <div>
        <p style={{
          fontSize: "var(--text-sm)",
          color: "var(--fg-muted)",
          marginBottom: "var(--sp-3)",
        }}>
          SELECT A SYMPTOM TO BEGIN
        </p>
        <ul className={styles.rootList}>
          {roots.map((r) => (
            <li key={r.data.id} className={styles.rootItem}>
              <button
                type="button"
                className={styles.rootButton}
                onClick={() => navigate(r.data.id)}
              >
                <span className={styles.rootCode}>TRB</span>
                <span className={styles.rootSymptom}>{r.data.symptom}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const childNodes = current.data.children
    .map((id) => nodeMap.get(id))
    .filter((n): n is TroubleshootNode => n !== undefined);

  const displayText = (() => {
    switch (current.data.node_type) {
      case "question":
        return current.data.question;
      case "cause":
        return current.data.cause_summary;
      default:
        return current.data.symptom || current.data.title;
    }
  })();

  return (
    <div>
      {/* Breadcrumbs */}
      <nav className={styles.breadcrumbs}>
        <button type="button" className={styles.crumbButton} onClick={reset}>
          ALL SYMPTOMS
        </button>
        {path.map((id, i) => {
          const node = nodeMap.get(id);
          if (!node) return null;
          const isLast = i === path.length - 1;
          return (
            <span key={id}>
              <span className={styles.crumbSep}> &rsaquo; </span>
              {isLast ? (
                <span className={styles.crumbCurrent}>{node.data.title}</span>
              ) : (
                <button
                  type="button"
                  className={styles.crumbButton}
                  onClick={() => navigateTo(i)}
                >
                  {node.data.title}
                </button>
              )}
            </span>
          );
        })}
      </nav>

      {/* Current node */}
      <div className={styles.nodeCard}>
        <span className={styles.nodeType}>{current.data.node_type}</span>

        {current.data.node_type === "question" && displayText && (
          <p className={styles.nodeQuestion}>{displayText}</p>
        )}
        {current.data.node_type === "cause" && displayText && (
          <p className={styles.nodeCause}>{displayText}</p>
        )}
        {current.data.node_type === "root" && (
          <h3 className={styles.nodeTitle}>{displayText}</h3>
        )}
        {current.data.node_type === "fix" && (
          <h3 className={styles.nodeTitle}>{current.data.title}</h3>
        )}

        {current.body.trim() && (
          <p className={styles.nodeBody}>{current.body.trim()}</p>
        )}
      </div>

      {/* Children */}
      {childNodes.length > 0 && (
        <>
          <p className={styles.childrenLabel}>
            {current.data.node_type === "root"
              ? "WHERE DO WE START?"
              : current.data.node_type === "cause"
                ? "WHAT TO DO"
                : "NEXT STEPS"}
          </p>
          <ul className={styles.childrenList}>
            {childNodes.map((child) => (
              <li key={child.data.id}>
                <button
                  type="button"
                  className={styles.childButton}
                  onClick={() => navigate(child.data.id)}
                >
                  <span className={styles.childType}>{child.data.node_type}</span>
                  <span className={styles.childText}>
                    {child.data.node_type === "question"
                      ? child.data.question
                      : child.data.node_type === "cause"
                        ? child.data.cause_summary
                        : child.data.title}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Leaf node */}
      {childNodes.length === 0 && current.data.node_type === "fix" && (
        <div className={styles.leaf}>
          <p className={styles.leafLabel}>END OF PATH</p>
          <p className={styles.leafText}>
            This is the recommended fix. If it doesn&rsquo;t resolve the issue, go back and try another branch.
          </p>
        </div>
      )}

      {childNodes.length === 0 && current.data.node_type === "question" && (
        <div className={styles.leaf}>
          <p className={styles.leafLabel}>TREE EXPANSION IN PROGRESS</p>
          <p className={styles.leafText}>
            More branches will be added as real problems surface.
          </p>
        </div>
      )}

      <button type="button" className={styles.backButton} onClick={goBack}>
        &larr; BACK
      </button>
    </div>
  );
}
