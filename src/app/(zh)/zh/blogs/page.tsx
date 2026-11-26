import type { Metadata } from "next";
import { BlogIndex, blogIndexMetadata } from "@/views/BlogViews";

export const metadata: Metadata = blogIndexMetadata("zh");

export default function BlogsPage() {
  return <BlogIndex lang="zh" />;
}
