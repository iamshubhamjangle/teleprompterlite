import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  devIndicators: false,
  poweredByHeader: false,
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "no-referrer" },
        { key: "Content-Security-Policy", value: "base-uri 'self'; object-src 'none'; frame-ancestors 'self'" },
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
      ],
    }];
  },
};
export default nextConfig;
