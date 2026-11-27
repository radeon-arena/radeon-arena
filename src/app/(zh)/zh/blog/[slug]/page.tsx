import type { Metadata } from "next";
import { BlogPostView, blogPostMetadata, blogPostParams } from "@/views/BlogViews";

export function generateStaticParams() {
  return blogPostParams();
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  return blogPostMetadata("zh", params.slug);
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  return <BlogPostView lang="zh" slug={params.slug} />;
}
