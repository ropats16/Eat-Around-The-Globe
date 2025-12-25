import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";
import path from "path";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  // Turbopack config - redirect pino to stub to avoid bundling thread-stream
  turbopack: {
    resolveAlias: {
      // Use relative path for Turbopack
      pino: "./lib/pino-stub.js",
    },
  },
  // Mark packages as external to prevent bundling issues with test files
  serverExternalPackages: ['pino', 'pino-pretty', 'thread-stream'],
  webpack: (config, { isServer }) => {
    config.externals = [...(config.externals || []), { canvas: "canvas" }];
    
    // Redirect pino to stub for client-side bundles (WalletConnect logging)
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        pino: path.resolve(__dirname, "lib/pino-stub.js"),
      };
    }
    
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "places.googleapis.com",
        pathname: "/v1/**",
      },
    ],
  },
};

export default withPWA(nextConfig);
