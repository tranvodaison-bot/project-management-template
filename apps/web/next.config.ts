import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@ftz-erp/db", "@ftz-erp/auth"],
  serverExternalPackages: ["@prisma/client"],
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
  },
};

export default nextConfig;
