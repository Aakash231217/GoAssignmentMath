/** @type {import('next').NextConfig} */
const nextConfig = {
  // Set the workspace root to avoid lockfile warnings
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
