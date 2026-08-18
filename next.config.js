/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@mygym/shared'],
  experimental: {
    typedRoutes: true
  }
}

export default nextConfig

