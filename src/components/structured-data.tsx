import { serializeStructuredData } from "@/lib/seo";
export function StructuredData({ data }: { data: unknown }) {
  if (!data) return null;
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeStructuredData(data) }} />;
}