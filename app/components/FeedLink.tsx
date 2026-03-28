interface FeedLinkProps {
  section: string;
}

export function FeedLink({ section }: FeedLinkProps) {
  return (
    <a
      href={`/${section}/feed.xml`}
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
