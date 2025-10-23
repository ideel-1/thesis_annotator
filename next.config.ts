import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  reactStrictMode: true,
  basePath: "/thesis/annotator",
  assetPrefix: "/thesis/annotator",
};

export default nextConfig;
