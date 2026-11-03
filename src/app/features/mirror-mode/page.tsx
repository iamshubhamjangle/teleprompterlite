import { DocumentationPage } from "@/components/documentation-page";
import { publicMetadata } from "@/lib/seo";
export const metadata = publicMetadata("/features/mirror-mode");
export default function Page() { return <DocumentationPage path="/features/mirror-mode" />; }