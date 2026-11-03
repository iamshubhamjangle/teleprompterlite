import type { Metadata } from "next";
import { Workspace } from "@/components/workspace";
import { seo } from "@/content/seo.en";

export const metadata: Metadata = {
  title: { absolute: seo.editor.title },
  description: seo.editor.description,
  robots: { index: false, follow: true },
};

export default function EditorPage() {
  return <Workspace />;
}
