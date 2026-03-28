import { generateFeed } from "@/lib/feed";

export async function GET() {
  const xml = generateFeed("all", {
    title: "leonmay.be",
    description: "All posts by Leon Jacobs",
    link: "https://leonmay.be",
    feedLink: "https://leonmay.be/feed.xml",
  });

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
