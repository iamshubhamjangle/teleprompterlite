import { DocumentationPage } from "@/components/documentation-page";
import { publicMetadata } from "@/lib/seo";
export const metadata = publicMetadata("/docs/scripts-and-bookmarks");
export default function Page() { return <DocumentationPage path="/docs/scripts-and-bookmarks" />; }