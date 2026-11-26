import { SiteLayout, siteMetadata } from "@/components/SiteLayout";

export const metadata = siteMetadata("zh");

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <SiteLayout lang="zh">{children}</SiteLayout>;
}
