import type { Metadata } from "next";
import { BlogIndex, blogIndexMetadata } from "@/views/BlogViews";

export const metadata: Metadata = blogIndexMetadata("en");

export default function BlogsPage() {
  return <BlogIndex lang="en" />;
}
