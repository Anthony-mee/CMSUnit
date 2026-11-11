import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/pocketbase-api/:path*",
        destination: `${process.env.POCKETBASE_URL || "http://pocketbase:8090"}/:path*`,
      },
    ];
  },
};

export default nextConfig;
