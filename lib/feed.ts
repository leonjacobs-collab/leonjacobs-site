import { Feed } from "feed";
import { getPublishedPosts, type PostMeta } from "./posts";

const SITE_URL = "https://leonmay.be";
const AUTHOR = { name: "Leon Jacobs", link: SITE_URL };

interface FeedOptions {
  title: string;
  description: string;
  link: string;
  feedLink: string;
}

/**
 * Generate an RSS feed for a specific section or all sections combined.
 * @param section - section name, or "all" for the combined feed
 * @param opts - feed metadata
 * @param limit - max items (defaults to 50)
 */
export function generateFeed(
  section: string,
  opts: FeedOptions,
  limit = 50
): string {
  let posts: PostMeta[];

  if (section === "all") {
    posts = getPublishedPosts();
  } else {
    posts = getPublishedPosts().filter((p) => p.section === section);
  }

  // Cap at limit
  posts = posts.slice(0, limit);

  const feed = new Feed({
    title: opts.title,
    description: opts.description,
    id: opts.link,
    link: opts.link,
    language: "en",
    feedLinks: {
      rss: opts.feedLink,
    },
    author: AUTHOR,
    copyright: `© ${new Date().getFullYear()} Leon Jacobs`,
    updated: posts.length > 0 ? new Date(posts[0].date) : new Date(),
  });

  for (const post of posts) {
    const url = `${SITE_URL}/${post.section}/${post.slug}`;

    feed.addItem({
      title: post.title,
      id: url,
      link: url,
      description: post.description || post.title,
      date: new Date(post.date),
      author: [AUTHOR],
      category: post.tags.map((t) => ({ name: t })),
    });
  }

  return feed.rss2();
}
