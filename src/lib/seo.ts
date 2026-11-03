import type { Metadata } from "next";
import { blogPosts, getGuide, publicPages, seo } from "@/content/seo.en";

type SiteEnvironment = { SITE_URL?: string; SEO_PREVIEW?: string; NODE_ENV?: string };
export function getSiteConfig(env: SiteEnvironment = process.env) {
  if (env.SEO_PREVIEW !== undefined && env.SEO_PREVIEW !== "1") {
    throw new Error("SEO_PREVIEW must be 1 for a non-indexable preview, or unset for a public release.");
  }
  const preview = env.SEO_PREVIEW === "1" || env.NODE_ENV !== "production";
  if (!env.SITE_URL && !preview) {
    throw new Error("Set SITE_URL to the verified public HTTPS origin before building a release. For a non-indexable local build, explicitly set SEO_PREVIEW=1.");
  }
  const origin = new URL(env.SITE_URL || "http://localhost:3000");
  if (origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash || !["http:", "https:"].includes(origin.protocol)) {
    throw new Error("SITE_URL must be an HTTP(S) origin without credentials, path, query or fragment.");
  }
  const host = origin.hostname.toLowerCase();
  const nonPublic = host === "localhost" || host.endsWith(".localhost") ||
    host === "example.com" || host.endsWith(".example.com") ||
    host === "example.org" || host.endsWith(".example.org") ||
    host === "example.net" || host.endsWith(".example.net") ||
    /\.(local|test|invalid|example)$/.test(host) || !host.includes(".") ||
    /^[\d.]+$/.test(host) || host.startsWith("[");
  if (!preview && (origin.protocol !== "https:" || nonPublic || origin.port)) {
    throw new Error("A public release requires a verified HTTPS domain, without a custom port, localhost or placeholder hostname.");
  }
  return { origin: new URL(`${origin.origin}/`), indexable: !preview };
}
export function absoluteUrl(path: string) {
  if (!path.startsWith("/") || path.startsWith("//")) throw new Error("Expected a same-site absolute path.");
  return new URL(path, getSiteConfig().origin).toString();
}
export const previewRobots = { index: false, follow: false };
export function publicMetadata(path: string): Metadata {
  const page = publicPages.find((entry) => entry.path === path);
  if (!page) throw new Error(`Unknown public page: ${path}`);
  const { origin, indexable } = getSiteConfig();
  const url = new URL(path, origin).toString();
  const image = { url: new URL("/social-preview", origin).toString(), width: 1200, height: 630, alt: seo.share.alt };
  return {
    title: { absolute: page.title }, description: page.description,
    ...(indexable ? { alternates: { canonical: url } } : {}),
    robots: indexable ? { index: true, follow: true } : previewRobots,
    openGraph: { type: path.startsWith("/blog/") ? "article" : "website", siteName: seo.name, title: page.title, description: page.description, url, images: [image] },
    twitter: { card: "summary_large_image", title: page.title, description: page.description, images: [image] },
  };
}
export function serializeStructuredData(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
export function pageGraph(path: string) {
  if (!getSiteConfig().indexable) return null;
  const page = publicPages.find((entry) => entry.path === path);
  if (!page) throw new Error(`Unknown public page: ${path}`);
  const root = absoluteUrl("/");
  const url = absoluteUrl(path);
  const website = `${root}#website`;
  const application = `${root}#application`;
  const webpage = {
    "@type": path === "/blog" ? "CollectionPage" : "WebPage", "@id": `${url}#webpage`, url, name: page.title,
    description: page.description, inLanguage: "en", isPartOf: { "@id": website },
    ...(path === "/" ? { mainEntity: { "@id": application } } : path.startsWith("/blog/") ? {
      mainEntity: { "@id": `${url}#article` }, about: { "@id": application }, breadcrumb: { "@id": `${url}#breadcrumb` },
    } : {
      about: { "@id": application }, breadcrumb: { "@id": `${url}#breadcrumb` },
    }),
  };
  return {
    "@context": "https://schema.org",
    "@graph": path === "/" ? [
      { "@type": "WebSite", "@id": website, url: root, name: seo.name, inLanguage: "en" },
      { "@type": "WebApplication", "@id": application, url: absoluteUrl("/editor"), name: seo.name,
        applicationCategory: "MultimediaApplication", operatingSystem: "Web browser",
        description: "A browser teleprompter with adjustable scrolling, reading width and height, script bookmarks, mirror mode and a same-device popup reader.",
        featureList: ["Adjustable automatic scrolling", "Markdown editing and text-file import", "Script-line bookmarks and paragraph cues", "Adjustable margins and phone mode", "Horizontal mirror mode", "Fullscreen and synchronized same-device popup output", "Browser-local draft and settings storage"] },
      webpage,
    ] : [webpage, {
      "@type": "BreadcrumbList", "@id": `${url}#breadcrumb`, itemListElement: [
        { "@type": "ListItem", position: 1, name: seo.name, item: root },
        ...(path.startsWith("/blog/") ? [{ "@type": "ListItem", position: 2, name: seo.blog.label, item: absoluteUrl("/blog") }] : []),
        { "@type": "ListItem", position: path.startsWith("/blog/") ? 3 : 2, name: page.label, item: url },
      ],
    }, ...(path.startsWith("/blog/") ? [{
      "@type": "BlogPosting", "@id": `${url}#article`, url, headline: getGuide(path).heading,
      description: page.description, inLanguage: "en", mainEntityOfPage: { "@id": `${url}#webpage` },
      isPartOf: { "@id": `${absoluteUrl("/blog")}#webpage` }, about: { "@id": application },
    }] : path === "/blog" ? [{
      "@type": "ItemList", itemListElement: blogPosts.map((post, index) => ({
        "@type": "ListItem", position: index + 1, name: post.heading, url: absoluteUrl(post.path),
      })),
    }] : [])],
  };
}
