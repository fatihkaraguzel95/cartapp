import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/supabase/:path*',
        destination: 'http://178.104.56.53:8000/:path*',
      },
    ];
  },
};

export default nextConfig;
