import { redirect, notFound } from "next/navigation";
import { getPostBySlug } from "@/lib/posts";

/**
 * Legacy route: /blogging/:slug → redirects to /:section/:slug
 */
export default async function LegacyBlogPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();
  redirect(`/${post.meta.section}/${slug}`);
}
