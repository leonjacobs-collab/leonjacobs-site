import { generateFeed } from "@/lib/feed";
import { SECTIONS } from "@/lib/sections";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ section: string }> }
) {
  const { section } = await params;

  if (!SECTIONS.includes(section)) {
    return new Response("Not found", { status: 404 });
  }

  const xml = generateFeed(section, {
    title: `leonmay.be/${section}`,
    description: `${section.charAt(0).toUpperCase() + section.slice(1)} by Leon Jacobs`,
    link: `https://leonmay.be/${section}`,
    feedLink: `https://leonmay.be/${section}/feed.xml`,
  });

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
