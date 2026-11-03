import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
import { publicPages, guides, blogPosts, seo } from "../src/content/seo.en.ts";
loadEnvConfig(process.cwd(), false);
assert.notEqual(process.env.SEO_PREVIEW, "1", "This check verifies a public build; unset SEO_PREVIEW and rebuild first.");
const origin = new URL(process.env.SITE_URL);
const app = join(process.cwd(), ".next/server/app");
const htmlFor = async (path) => readFile(join(app, path === "/" ? "index.html" : `${path.slice(1)}.html`), "utf8");
let checkedLinks = 0;
for (const page of publicPages) {
  const html = await htmlFor(page.path);
  const canonicals = [...html.matchAll(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/g)];
  assert.equal(canonicals.length, 1, `One canonical: ${page.path}`);
  assert.equal(new URL(canonicals[0][1]).href, new URL(page.path, origin).href);
  assert.ok(html.includes(`<title>${page.title}</title>`), `Title: ${page.path}`);
  assert.ok(!/<meta\b[^>]*name="robots"[^>]*content="[^"]*noindex/.test(html), `Public indexability: ${page.path}`);
  assert.ok(html.includes(seo.name));
  assert.ok(!html.includes("Teleprompter Pro"), `Visible rebrand: ${page.path}`);
  const scripts = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length, 1, `One entity graph: ${page.path}`);
  const graph = JSON.parse(scripts[0][1]);
  assert.equal(graph["@context"], "https://schema.org");
  assert.ok(!scripts[0][1].includes("example.com"));
  assert.ok(!scripts[0][1].includes("aggregateRating"));
  assert.ok(!scripts[0][1].includes('"offers"'));
  for (const [, rawHref] of html.matchAll(/<a\b[^>]*href="([^"]+)"/g)) {
    const url = new URL(rawHref.replaceAll("&amp;", "&"), new URL(page.path, origin));
    if (url.origin !== origin.origin) continue;
    assert.ok(url.pathname === "/editor" || publicPages.some(({ path }) => path === url.pathname), `Shipped anchor destination: ${rawHref}`);
    if (url.hash) {
      const destination = url.pathname === page.path ? html : await htmlFor(url.pathname);
      assert.ok(destination.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`), `Fragment: ${rawHref}`);
    }
    checkedLinks++;
  }
  const guide = [...guides, ...blogPosts].find(({ path }) => path === page.path);
  assert.ok(html.includes(guide ? guide.heading : page.path === "/blog" ? seo.blog.heading : seo.heading), `Server content: ${page.path}`);
  assert.equal([...html.matchAll(/<h1\b/g)].length, 1, `One server H1: ${page.path}`);
  assert.equal([...html.matchAll(/<main\b/g)].length, 1, `One main landmark: ${page.path}`);
  if (page.path.startsWith("/blog/")) {
    assert.ok(graph["@graph"].some((entity) => entity["@type"] === "BlogPosting" && entity.headline === guide.heading));
  }
}
const editor = await htmlFor("/editor");
assert.match(editor, /<meta\b[^>]*name="robots"[^>]*content="[^"]*noindex/);
assert.ok(!editor.includes('rel="canonical"'));
const home = await htmlFor("/");
assert.ok(!home.includes('class="app-shell'), "Landing is separate from workspace");
const presenter = await htmlFor("/presenter");
assert.match(presenter, /<meta\b[^>]*name="robots"[^>]*content="[^"]*noindex/);
assert.ok(!presenter.includes('rel="canonical"'));
const robots = await readFile(join(app, "robots.txt.body"), "utf8");
assert.ok(robots.includes("Allow: /"));
assert.ok(robots.includes(`Sitemap: ${new URL("/sitemap.xml", origin).href}`));
const sitemap = await readFile(join(app, "sitemap.xml.body"), "utf8");
const entries = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
assert.deepEqual(entries.sort(), publicPages.map(({ path }) => new URL(path, origin).href).sort());
assert.ok(!sitemap.includes("presenter") && !sitemap.includes("/editor") && !sitemap.includes("<lastmod>"));
const image = await readFile(join(app, "social-preview.body"));
assert.equal(image.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
assert.equal(image.readUInt32BE(16), 1200);
assert.equal(image.readUInt32BE(20), 630);
console.log(`Verified ${publicPages.length} public HTML pages, ${checkedLinks} local anchors, editor/presenter noindex, robots/sitemap, article JSON-LD and 1200×630 PNG. No server started.`);
