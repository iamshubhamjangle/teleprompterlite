import type { MetadataRoute } from "next";
import { absoluteUrl, getSiteConfig } from "@/lib/seo";
export default function robots(): MetadataRoute.Robots {
  return getSiteConfig().indexable
    ? { rules: { userAgent: "*", allow: "/" }, sitemap: absoluteUrl("/sitemap.xml") }
    : { rules: { userAgent: "*", disallow: "/" } };
}