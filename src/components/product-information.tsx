import Link from "next/link";
import { IconArrowRight, IconBookmark, IconArrowsHorizontal, IconDeviceDesktop, IconPlayerPlay, IconDownload } from "@tabler/icons-react";
import { faqs, landing, seo } from "@/content/seo.en";

function FeatureVisual({ index }: { index: number }) {
  if (index === 0) return <div className="feature-visual pace-visual" aria-hidden="true"><div className="pace-lines"><span /><span /><span /><span /></div><div className="pace-transport"><IconPlayerPlay size={20} /><span>0.5×</span><strong>1×</strong><span>1.5×</span><span>2×</span></div></div>;
  if (index === 1) return <div className="feature-visual bookmarks-visual" aria-hidden="true"><span className="visual-label">{landing.sampleLabel}</span>{landing.bookmarkSample.map((label, cue) => <div key={label}><IconBookmark size={18} /><span>{label}</span><span className="bookmark-cue">{String(cue + 1).padStart(2, "0")}</span></div>)}</div>;
  return <div className="feature-visual output-visual" aria-hidden="true"><div className="output-windows"><div><IconDeviceDesktop size={26} /><i /><i /><i /></div><IconArrowRight size={22} /><div><IconArrowsHorizontal size={26} /><i /><i /><i /></div></div><span className="visual-label">{landing.outputLabel}</span></div>;
}

export function ProductInformation() {
  return <section id="about-teleprompter" className="product-information" aria-labelledby="product-heading">
    <div className="product-frame">
      <header className="product-introduction"><h2 id="product-heading">{seo.heading}</h2><p>{seo.introduction}</p></header>
      <div className="product-features">{seo.features.map((feature, index) => <section key={feature.heading} className="product-feature"><FeatureVisual index={index} /><div><h3>{feature.heading}</h3><p>{feature.text}</p><Link href={feature.path}>{feature.link}<IconArrowRight size={17} aria-hidden /></Link></div></section>)}</div>
      <section className="product-local"><IconDownload size={32} stroke={1.5} aria-hidden /><div><h2>{landing.localLabel}</h2><p>{seo.storage}</p></div><Link href="/docs/getting-started#save-and-export-your-work">{landing.localLink}<IconArrowRight size={18} aria-hidden /></Link></section>
      <section className="product-faq" aria-labelledby="faq-heading"><div><h2 id="faq-heading">{seo.faqHeading}</h2><p>{seo.audiences}</p><Link href="/docs/getting-started">{seo.quickStart}<IconArrowRight size={18} aria-hidden /></Link></div><div>{faqs.map((faq) => <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p>{"path" in faq && <Link href={faq.path}>{faq.link}</Link>}</details>)}</div></section>
    </div>
  </section>;
}
