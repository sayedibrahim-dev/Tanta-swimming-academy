import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // إيقاف الـ HTTP cache تماماً على كل الصفحات والـ API routes
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, proxy-revalidate" },
          { key: "Pragma",        value: "no-cache" },
          { key: "Expires",       value: "0" },
        ],
      },
    ];
  },
};

export default nextConfig;
