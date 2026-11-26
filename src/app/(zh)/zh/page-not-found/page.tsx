import type { Metadata } from "next";
import { NotFoundView, notFoundMetadata } from "@/views/NotFoundView";

export const metadata: Metadata = notFoundMetadata("zh");

export default function PageNotFound() {
  return <NotFoundView lang="zh" />;
}
