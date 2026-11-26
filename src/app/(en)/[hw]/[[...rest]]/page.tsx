import { HardwarePage, hardwareMetadata, hardwareParams } from "@/views/HardwarePage";

export const dynamicParams = false;
export const generateStaticParams = hardwareParams;

export function generateMetadata({ params }: { params: { hw: string; rest?: string[] } }) {
  return hardwareMetadata("en", params);
}

export default function Page({ params }: { params: { hw: string; rest?: string[] } }) {
  return <HardwarePage lang="en" params={params} />;
}
