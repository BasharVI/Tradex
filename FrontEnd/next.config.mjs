/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  pageExtensions: ["ts", "tsx"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
