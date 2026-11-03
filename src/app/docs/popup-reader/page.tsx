import { DocumentationPage } from "@/components/documentation-page";
import { publicMetadata } from "@/lib/seo";
export const metadata = publicMetadata("/docs/popup-reader");
export default function Page() { return <DocumentationPage path="/docs/popup-reader" />; }