import type { NextConfig } from 'next';

const BACKEND = process.env.BACKEND_URL || 'http://localhost:4000';
/** Browser calls /api/* on the Next origin; Next proxies to Express, so the session cookie stays same-origin. */
const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${BACKEND}/api/:path*` }];
  },
};

export default nextConfig;
