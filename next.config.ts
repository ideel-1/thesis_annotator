import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true, // good for Pages hosting
  reactStrictMode: true,
};

export default nextConfig;