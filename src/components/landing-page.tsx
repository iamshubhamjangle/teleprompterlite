import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  IconArrowRight,
  IconCheck,
  IconPlayerPlay,
  IconDeviceLaptop,
  IconDeviceMobile,
  IconKeyboard,
} from "@tabler/icons-react";
import { Logo } from "@/components/logo";
import { PublicNavigation } from "@/components/public-navigation";
import { blogPosts, landing, landingMedia, seo } from "@/content/seo.en";

export function LandingPage({ children }: { children: ReactNode }) {
  const benefitIcons = [IconDeviceLaptop, IconKeyboard, IconCheck];
  const screenshot = landingMedia.editorScreenshot;
  return (
    <div className="landing-page">
      <a className="landing-skip" href="#main-content">
        {landing.skip}
      </a>
      <header className="landing-header">
        <Link className="public-brand" href="/">
          <Logo size={28} />
          {seo.name}
        </Link>
        <nav aria-label={landing.navigation}>
          <a href="#about-teleprompter">{landing.features}</a>
          <Link href="/docs/getting-started">{landing.guides}</Link>
          <Link href="/blog">{seo.blog.label}</Link>
          <Link className="public-button" href="/editor">
            {landing.open}
            <IconArrowRight size={18} aria-hidden />
          </Link>
        </nav>
      </header>
      <main id="main-content">
        <section className="landing-hero" aria-labelledby="landing-heading">
          <div className="landing-pitch">
            <h1 id="landing-heading">
              {landing.heading.split("\n").map((line) => (
                <span key={line}>{line}</span>
              ))}
            </h1>
            <p className="landing-introduction">{landing.introduction}</p>
            <div className="public-actions">
              <Link className="public-button" href="/editor">
                {landing.open}
                <IconArrowRight size={18} aria-hidden />
              </Link>
            </div>
            <p className="landing-facts">
              <IconCheck size={16} aria-hidden />
              {landing.facts}
            </p>
          </div>
          <div
            className={`landing-reader${screenshot ? " landing-reader-screenshot" : ""}`}
          >
            <div className="preview-orbit" aria-hidden="true" />
            <div className="preview-caption">
              <span className="preview-dot" />
              {screenshot ? landing.editorPreview : landing.previewStatus}
            </div>
            {screenshot && (
              <div className="editor-screenshot-frame">
                <Image
                  className="editor-screenshot"
                  src={screenshot.src}
                  width={screenshot.width}
                  height={screenshot.height}
                  alt={landing.screenshotAlt}
                  sizes="(max-width: 620px) calc(112vw - 72px), (max-width: 800px) 620px, (max-width: 1280px) 53vw, 620px"
                  preload
                  unoptimized
                />
              </div>
            )}
            <div className="preview-note">
              <IconPlayerPlay size={20} aria-hidden />
              <span>{landing.previewTitle}</span>
            </div>
          </div>
        </section>
        <div className="landing-benefits">
          {landing.benefits.map((benefit, index) => {
            const Icon = benefitIcons[index];
            return (
              <div key={benefit}>
                <Icon size={21} stroke={1.5} aria-hidden />
                {benefit}
              </div>
            );
          })}
        </div>
        <section className="landing-setup" aria-labelledby="setup-heading">
          <div className="setup-art">
            <Image
              src="/images/recording-setup.svg"
              width={800}
              height={600}
              alt={landing.setupAlt}
            />
            <div className="setup-device-label" aria-hidden="true">
              <IconDeviceLaptop size={20} />
              <span>+</span>
              <IconDeviceMobile size={20} />
            </div>
          </div>
          <div className="setup-copy">
            <h2 id="setup-heading">{landing.setupTitle}</h2>
            <p>{landing.setupText}</p>
            <Link href="/guides/laptop-phone-setup">
              {landing.setup}
              <IconArrowRight size={18} aria-hidden />
            </Link>
          </div>
        </section>
        <section
          className="landing-workflow"
          aria-labelledby="workflow-heading"
        >
          <h2 id="workflow-heading">{seo.stepsHeading}</h2>
          <ol>
            {landing.workflow.map((step, index) => (
              <li key={step}>
                <span className="workflow-number" aria-hidden="true">
                  {index + 1}
                </span>
                <h3>{step}</h3>
                <p>{landing.workflowText[index]}</p>
              </li>
            ))}
          </ol>
        </section>
        {children}
        <section className="landing-journal" aria-labelledby="journal-heading">
          <div className="journal-introduction">
            <div>
              <h2 id="journal-heading">{landing.guideHeading}</h2>
              <p>{landing.guideIntroduction}</p>
            </div>
            <Link href="/blog">
              {seo.blog.label}
              <IconArrowRight size={18} aria-hidden />
            </Link>
          </div>
          <div className="journal-links">
            {blogPosts.map((post, index) => (
              <article key={post.path}>
                <Link
                  className="journal-image"
                  href={post.path}
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  <Image
                    src={landing.articleImages[index]}
                    width={640}
                    height={400}
                    alt=""
                  />
                </Link>
                <h3>
                  <Link href={post.path}>
                    {post.heading}
                    <IconArrowRight size={20} aria-hidden />
                  </Link>
                </h3>
                <p>{post.description}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="landing-close">
          <div>
            <h2>{landing.closeHeading}</h2>
            <p>{landing.closeText}</p>
          </div>
          <Link className="public-button" href="/editor">
            {landing.open}
            <IconArrowRight size={18} aria-hidden />
          </Link>
        </section>
      </main>
      <footer className="landing-footer">
        <div>
          <Link className="public-brand" href="/">
            <Logo size={24} />
            {seo.name}
          </Link>
          <p>{landing.footerText}</p>
        </div>
        <PublicNavigation />
      </footer>
    </div>
  );
}
