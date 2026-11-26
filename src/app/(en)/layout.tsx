import { SiteLayout, siteMetadata } from "@/components/SiteLayout";

export const metadata = siteMetadata("en");

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <SiteLayout lang="en">{children}</SiteLayout>;
}
