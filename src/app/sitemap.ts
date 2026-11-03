import type { MetadataRoute } from "next";
import { publicPages } from "@/content/seo.en";
import { absoluteUrl, getSiteConfig } from "@/lib/seo";
export default function sitemap(): MetadataRoute.Sitemap {
  return getSiteConfig().indexable ? publicPages.map(({ path }) => ({ url: absoluteUrl(path) })) : [];
}