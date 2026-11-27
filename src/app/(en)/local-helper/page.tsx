import { LocalHelperView, localHelperMetadata } from "@/views/LocalHelperView";

export const metadata = localHelperMetadata("en");

export default function LocalHelperPage() {
  return <LocalHelperView lang="en" />;
}
