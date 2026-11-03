import Link from "next/link";
import { Logo } from "@/components/logo";
import { PublicNavigation } from "@/components/public-navigation";
import { StructuredData } from "@/components/structured-data";
import { blogPosts, seo } from "@/content/seo.en";
import { pageGraph, publicMetadata } from "@/lib/seo";

export const metadata = publicMetadata("/blog");

export default function BlogPage() {
  return <div className="documentation-page">
    <header className="documentation-header"><Link className="public-brand" href="/"><Logo size={24} />{seo.name}</Link><Link className="public-button" href="/editor">{seo.open}</Link></header>
    <main className="public-content documentation-content">
      <nav className="public-breadcrumb" aria-label={seo.breadcrumb}><ol><li><Link href="/">{seo.name}</Link></li><li aria-current="page">{seo.blog.label}</li></ol></nav>
      <header><h1>{seo.blog.heading}</h1><p className="public-lead">{seo.blog.introduction}</p></header>
      <div className="blog-list">{blogPosts.map((post) => <article key={post.path}><h2><Link href={post.path}>{post.heading}</Link></h2><p>{post.description}</p><Link href={post.path}>{seo.blog.read}<span className="sr-only">: {post.label}</span></Link></article>)}</div>
      <footer className="public-footer"><PublicNavigation /><Link className="public-button" href="/editor">{seo.open}</Link></footer>
    </main>
    <StructuredData data={pageGraph("/blog")} />
  </div>;
}
