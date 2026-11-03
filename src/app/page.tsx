import { LandingPage } from "@/components/landing-page";
import { ProductInformation } from "@/components/product-information";
import { StructuredData } from "@/components/structured-data";
import { pageGraph, publicMetadata } from "@/lib/seo";
export const metadata = publicMetadata("/");
export default function Home() {
  return <>
    <LandingPage><ProductInformation /></LandingPage>
    <StructuredData data={pageGraph("/")} />
  </>;
}
