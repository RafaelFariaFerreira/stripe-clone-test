import type { NextConfig } from 'next';

/**
 * Next.js configuration.
 *
 * - `cacheComponents` / `partialPrefetching`: the static chrome (sidebar,
 *   header, tabs) is prerendered and the data-driven table streams in.
 * - The mock dataset is served from `/data/*` as static files; long-lived cache
 *   headers make repeat visits free (the dataset version busts client caches).
 */
const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  agentRules: false,
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ['@stripe-clone/domain', '@stripe-clone/icons'],
  async headers() {
    return [
      {
        source: '/data/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' }],
      },
    ];
  },
};

export default nextConfig;
