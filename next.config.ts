import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // The vision demo moved into the Lab.
    return [{ source: "/vision", destination: "/lab", permanent: true }];
  },
};

export default nextConfig;
