import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { blogPosts, faqs, guides, publicPages, sectionId, seo } from "@/content/seo.en";
import { getSiteConfig, pageGraph, publicMetadata, serializeStructuredData } from "@/lib/seo";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { metadata as presenterMetadata } from "@/app/presenter/page";
import { ProductInformation } from "@/components/product-information";
import { DocumentationPage } from "@/components/documentation-page";
import Home from "@/app/page";
import BlogPage from "@/app/blog/page";
import { metadata as editorMetadata } from "@/app/editor/page";

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("SITE_URL", "https://teleprompterlite.vercel.app");
  vi.stubEnv("SEO_PREVIEW", undefined);
});
afterEach(() => vi.unstubAllEnvs());

describe("release origin and preview isolation", () => {
  it("requires a real HTTPS origin in public releases", () => {
    expect(() => getSiteConfig({ NODE_ENV: "production" })).toThrow("SITE_URL");
    for (const url of ["http://teleprompterlite.vercel.app", "https://example.com", "https://localhost", "https://127.0.0.1", "https://studio.local", "https://user:secret@site.dev", "https://site.dev/path", "https://site.dev?x=1", "https://site.dev#x", "https://site.dev:8443", "ftp://site.dev"]) {
      expect(() => getSiteConfig({ NODE_ENV: "production", SITE_URL: url })).toThrow();
    }
    expect(getSiteConfig({ NODE_ENV: "production", SITE_URL: "https://teleprompterlite.vercel.app/" }).origin.href).toBe("https://teleprompterlite.vercel.app/");
  });
  it("makes explicit production previews and development non-indexable", () => {
    expect(getSiteConfig({ NODE_ENV: "production", SEO_PREVIEW: "1" }).indexable).toBe(false);
    expect(getSiteConfig({ NODE_ENV: "development" }).indexable).toBe(false);
    expect(() => getSiteConfig({ NODE_ENV: "production", SEO_PREVIEW: "false" })).toThrow();
    vi.stubEnv("SEO_PREVIEW", "1");
    expect(sitemap()).toEqual([]);
    expect(robots()).toEqual({ rules: { userAgent: "*", disallow: "/" } });
    expect(pageGraph("/")).toBeNull();
    expect(publicMetadata("/").alternates).toBeUndefined();
    expect(publicMetadata("/").robots).toEqual({ index: false, follow: false });
  });
});

describe("public registry and route metadata", () => {
  it("includes only real, unique public routes with valid related links", () => {
    const paths = publicPages.map(({ path }) => path);
    expect(new Set(paths).size).toBe(paths.length);
    expect(paths).not.toContain("/presenter");
    expect(paths).not.toContain("/editor");
    expect(new Set(publicPages.map(({ title }) => title)).size).toBe(paths.length);
    for (const path of paths) expect(existsSync(join(process.cwd(), "src/app", path, "page.tsx"))).toBe(true);
    for (const guide of [...guides, ...blogPosts]) {
      expect(new Set(guide.sections.map(({ heading }) => sectionId(heading))).size).toBe(guide.sections.length);
      for (const path of guide.related) expect(paths).toContain(path);
    }
  });
  it("keeps self canonicals/social URLs and presenter exclusion separate", () => {
    for (const page of publicPages) {
      const metadata = publicMetadata(page.path);
      expect(metadata.alternates?.canonical).toBe(new URL(page.path, "https://teleprompterlite.vercel.app").href);
      expect(metadata.title).toEqual({ absolute: page.title });
      expect(metadata.description).toBe(page.description);
      expect(metadata.robots).toEqual({ index: true, follow: true });
    }
    expect(presenterMetadata.robots).toEqual({ index: false, follow: true });
    expect(presenterMetadata.alternates).toBeUndefined();
    expect(editorMetadata.robots).toEqual({ index: false, follow: true });
    expect(editorMetadata.alternates).toBeUndefined();
    expect(sitemap().map(({ url }) => url)).toEqual(publicPages.map(({ path }) => new URL(path, "https://teleprompterlite.vercel.app").href));
    expect(robots()).toEqual({ rules: { userAgent: "*", allow: "/" }, sitemap: "https://teleprompterlite.vercel.app/sitemap.xml" });
  });
});

describe("server content and safe entity serialization", () => {
  it("renders product purpose and complete FAQ answers without effects", () => {
    const html = renderToStaticMarkup(<ProductInformation />);
    expect(html).toContain(seo.heading);
    expect(html).toContain('id="about-teleprompter"');
    for (const faq of faqs) expect(html).toContain(faq.question);
    expect(html).toContain("the app does not record video");
    expect(html.match(/<h2\b/g)?.length).toBeGreaterThan(0);
    expect(html).not.toContain("Teleprompter Pro");
  });
  it("renders each complete guide with a matching breadcrumb graph", () => {
    for (const guide of [...guides, ...blogPosts]) {
      const html = renderToStaticMarkup(<DocumentationPage path={guide.path} />);
      expect(html).toContain(guide.heading);
      expect(html.match(/<main\b/g)).toHaveLength(1);
      expect(html.match(/<h1\b/g)).toHaveLength(1);
      for (const section of guide.sections) expect(html).toContain(`id="${sectionId(section.heading)}"`);
      const graph = pageGraph(guide.path)!;
      expect(JSON.stringify(graph)).toContain(guide.title);
      expect(JSON.stringify(graph)).toContain("#application");
      expect(JSON.stringify(graph)).not.toContain("aggregateRating");
      expect(JSON.stringify(graph)).not.toContain('"offers"');
    }
  });
  it("serves a landing page and blog index without the interactive workspace", () => {
    const home = renderToStaticMarkup(<Home />);
    expect(home.match(/<h1\b/g)).toHaveLength(1);
    expect(home.match(/<main\b/g)).toHaveLength(1);
    expect(home).toContain('href="/editor"');
    expect(home).toContain('class="editor-screenshot"');
    expect(home).not.toContain('class="app-shell');
    expect(home).not.toContain('href="#teleprompter"');
    const blog = renderToStaticMarkup(<BlogPage />);
    expect(blog.match(/<h1\b/g)).toHaveLength(1);
    for (const post of blogPosts) {
      expect(home).toContain(`href="${post.path}"`);
      expect(blog).toContain(`href="${post.path}"`);
      const article = pageGraph(post.path)!;
      const posting = article["@graph"].find((entity) => entity["@type"] === "BlogPosting");
      expect(posting).toMatchObject({ headline: post.heading, url: new URL(post.path, "https://teleprompterlite.vercel.app").href });
      expect(publicMetadata(post.path).openGraph).toMatchObject({ type: "article" });
      const breadcrumb = article["@graph"].find((entity) => entity["@type"] === "BreadcrumbList");
      expect(breadcrumb).toMatchObject({ itemListElement: [
        { position: 1, item: "https://teleprompterlite.vercel.app/" },
        { position: 2, item: "https://teleprompterlite.vercel.app/blog" },
        { position: 3, item: new URL(post.path, "https://teleprompterlite.vercel.app").href },
      ] });
    }
    expect(JSON.stringify(pageGraph("/"))).toContain('"url":"https://teleprompterlite.vercel.app/editor"');
    expect(JSON.stringify(pageGraph("/blog"))).toContain('"@type":"CollectionPage"');
  });
  it("escapes script-breaking content while preserving JSON data", () => {
    const value = { text: "</script><script>alert(1)</script>" };
    const serialized = serializeStructuredData(value);
    expect(serialized).not.toContain("<");
    expect(JSON.parse(serialized)).toEqual(value);
  });
  it("preserves legacy persistence and import identifiers across the rename", () => {
    const model = readFileSync(join(process.cwd(), "src/lib/model.ts"), "utf8");
    expect(model).toContain('"teleprompter-pro:draft:v1"');
    expect(model).toContain('z.literal("teleprompter-pro")');
  });
});
