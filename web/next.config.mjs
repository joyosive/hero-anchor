import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // This app lives in web/ inside a Foundry repo; pin the tracing root here so
  // Next doesn't infer the monorepo root from the sibling root lockfile.
  outputFileTracingRoot: path.join(import.meta.dirname),
};

export default nextConfig;
