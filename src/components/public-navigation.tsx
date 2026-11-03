import Link from "next/link";
import { ContactDialog } from "@/components/contact-dialog";
import { guides, landing, seo } from "@/content/seo.en";
export function PublicNavigation() {
  return <nav className="public-navigation" aria-label={seo.navigation}>
    <Link href="/">{landing.home}</Link><Link href="/blog">{seo.blog.label}</Link>
    {guides.map((guide) => <Link key={guide.path} href={guide.path}>{guide.label}</Link>)}
    <ContactDialog className="contact-trigger" />
  </nav>;
}
