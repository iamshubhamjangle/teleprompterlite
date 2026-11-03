import Link from "next/link";
import { getGuide, sectionId, seo } from "@/content/seo.en";
import { Logo } from "@/components/logo";
import { PublicNavigation } from "@/components/public-navigation";
import { StructuredData } from "@/components/structured-data";
import { pageGraph } from "@/lib/seo";
export function DocumentationPage({ path }: { path: string }) {
  const guide = getGuide(path);
  return <div className="documentation-page">
    <header className="documentation-header"><Link className="public-brand" href="/"><Logo size={24} />{seo.name}</Link><Link className="public-button" href="/editor">{seo.open}</Link></header>
    <main className="public-content documentation-content">
      <nav className="public-breadcrumb" aria-label={seo.breadcrumb}><ol><li><Link href="/">{seo.name}</Link></li>{path.startsWith("/blog/") && <li><Link href="/blog">{seo.blog.label}</Link></li>}<li aria-current="page">{guide.label}</li></ol></nav>
      <header><h1>{guide.heading}</h1><p className="public-lead">{guide.introduction}</p></header>
      <nav className="document-outline" aria-label={seo.onThisPage}><h2>{seo.onThisPage}</h2><ul>{guide.sections.map((section) => <li key={section.heading}><a href={`#${sectionId(section.heading)}`}>{section.heading}</a></li>)}</ul></nav>
      {guide.sections.map((section) => <section className="public-section" id={sectionId(section.heading)} key={section.heading}>
        <h2>{section.heading}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        {section.steps && <ol>{section.steps.map((step) => <li key={step}>{step}</li>)}</ol>}
        {section.code && <pre><code>{section.code}</code></pre>}
      </section>)}
      <aside className="document-related" aria-labelledby="related-heading"><h2 id="related-heading">{seo.related}</h2><ul>{guide.related.map((destination) => <li key={destination}><Link href={destination}>{getGuide(destination).label}</Link></li>)}</ul></aside>
      <footer className="public-footer"><Link className="public-button" href="/editor">{seo.open}</Link><PublicNavigation /></footer>
    </main>
    <StructuredData data={pageGraph(path)} />
  </div>;
}
