import type { Metadata, Viewport } from "next";
import "@fontsource/geist/400.css";
import "@fontsource/geist/500.css";
import "@fontsource/geist/600.css";
import "@fontsource/geist-mono/400.css";
import { Providers } from "@/components/providers";
import { seo } from "@/content/seo.en";
import { getSiteConfig, previewRobots } from "@/lib/seo";
import "./globals.css";
import { SiteAnalytics } from "@/components/site-analytics";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: getSiteConfig().origin,
  title: { default: seo.name, template: `%s | ${seo.name}` },
  description: seo.description,
  ...(!getSiteConfig().indexable ? { robots: previewRobots } : {}),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
        <SiteAnalytics />
      </body>
    </html>
  );
}
