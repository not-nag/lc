import type { NextConfig } from "next";

const config: NextConfig = {
  /** Remotion's bundler + renderer are heavy native deps — keep them out of the client graph. */
  serverExternalPackages: ["@remotion/bundler", "@remotion/renderer", "esbuild"],
};

export default config;
