import type { Metadata } from "next";
import { NotFoundView, notFoundMetadata } from "@/views/NotFoundView";

export const metadata: Metadata = notFoundMetadata("en");

export default function PageNotFound() {
  return <NotFoundView lang="en" />;
}
