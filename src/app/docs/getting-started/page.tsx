import { DocumentationPage } from "@/components/documentation-page";
import { publicMetadata } from "@/lib/seo";
export const metadata = publicMetadata("/docs/getting-started");
export default function Page() { return <DocumentationPage path="/docs/getting-started" />; }