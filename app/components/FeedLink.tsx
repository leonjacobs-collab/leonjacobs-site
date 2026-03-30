interface FeedLinkProps {
  /** Section name, or omit/pass "all" for the root combined feed */
  section?: string;
}

export function FeedLink({ section }: FeedLinkProps) {
  const href = !section || section === "all" ? "/feed.xml" : `/${section}/feed.xml`;
  return (
    <a
      href={href}
      className="feed-link"
      target="_blank"
      rel="noopener noreferrer"
    >
      <span className="feed-link-dot" aria-hidden="true">◉</span>
      <span>Subscribe to feed</span>
      <span aria-hidden="true">&rarr;</span>
    </a>
  );
}
