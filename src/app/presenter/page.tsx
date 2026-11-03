import type { Metadata } from "next";
import { Presenter } from "@/components/presenter";
import { seo } from "@/content/seo.en";
export const metadata: Metadata = {
  title: { absolute: seo.presenter.title }, description: seo.presenter.description,
  robots: { index: false, follow: true },
};
export default function PresenterPage() { return <Presenter />; }