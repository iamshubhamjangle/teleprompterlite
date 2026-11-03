import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { seo } from "@/content/seo.en";
export const runtime = "nodejs";
export const dynamic = "force-static";
export async function GET() {
  const font = await readFile(join(process.cwd(), "node_modules/@fontsource/geist/files/geist-latin-600-normal.woff"));
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", padding: "64px 72px", background: "#f3f3ef", color: "#222724", fontFamily: "Geist" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 32 }}>
        <svg width="56" height="56" viewBox="0 0 24 24" fill="#226d4c"><rect x="3" y="5" width="18" height="5" rx="2.5" /><rect x="3" y="14" width="18" height="5" rx="2.5" /></svg>
        {seo.name}
      </div>
      <div style={{ display: "flex", marginTop: 80, fontSize: 76, letterSpacing: "-0.025em" }}>{seo.share.title}</div>
      <div style={{ display: "flex", marginTop: 20, fontSize: 34 }}>{seo.share.description}</div>
      <div style={{ display: "flex", marginTop: "auto", paddingTop: 28, borderTop: "1px solid #dcded7", fontSize: 25 }}>{seo.share.features}</div>
    </div>,
    { width: 1200, height: 630, fonts: [{ name: "Geist", data: font, weight: 600, style: "normal" }] },
  );
}
