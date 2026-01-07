/** @type {import('next').NextConfig} */
const backendBase = process.env.BACKEND_API_URL || 'http://localhost:8000';

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'image.tmdb.org' },
      { protocol: 'https', hostname: 'm.media-amazon.com' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
      { protocol: 'https', hostname: 'placehold.co' }
    ]
  },
  experimental: {
    typedRoutes: true
  },
  async rewrites() {
    return [
      {
        source: '/backend/:path*',
        destination: `${backendBase}/:path*`
      }
    ];
  }
};

export default nextConfig;
