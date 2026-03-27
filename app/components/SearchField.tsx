"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback, type FormEvent } from "react";

interface SearchFieldProps {
  /** Available tags to show as suggestions */
  tags: string[];
}

export function SearchField({ tags }: SearchFieldProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const trimmed = query.trim();
      if (trimmed.length > 0) {
        router.push(`/blogging?tag=${encodeURIComponent(trimmed)}`);
      }
    },
    [query, router]
  );

  const handleTagClick = useCallback(
    (tag: string) => {
      router.push(`/blogging?tag=${encodeURIComponent(tag)}`);
    },
    [router]
  );

  return (
    <div>
      <form onSubmit={handleSubmit} className="search-form">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="search by tag…"
          className="search-input"
          autoComplete="off"
          spellCheck={false}
        />
        <button type="submit" className="search-btn" aria-label="Search">
          &rarr;
        </button>
      </form>

      {tags.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: "var(--sp-1)",
            flexWrap: "wrap",
            marginTop: "var(--sp-2)",
          }}
        >
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              className="tag tag-clickable"
              onClick={() => handleTagClick(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
