import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    // 10MB 까지 허용
    serverActions: {
      bodySizeLimit: 10 * 1024 * 1024,
    },
  },
  images: {
    domains: ['res.cloudinary.com'], // 클라우디너리 기본 도메인
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
