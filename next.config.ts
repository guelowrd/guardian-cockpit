import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["systeminformation", "dockerode", "@miden-sdk/miden-sdk"],
};

export default nextConfig;
