import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    experimental: {
        serverActions: {
            bodySizeLimit: '2mb',
        },
    },
    headers: async () => [
        {
            source: '/:path*',
            headers: [
                {
                    key: 'X-DNS-Prefetch-Control',
                    value: 'on',
                },
                {
                    key: 'Strict-Transport-Security',
                    value: 'max-age=31536000; includeSubDomains; preload',
                },
                {
                    key: 'X-Content-Type-Options',
                    value: 'nosniff',
                },
                {
                    key: 'X-Frame-Options',
                    value: 'DENY',
                },
            ],
        },
    ],
    images: {
        formats: ['image/avif', 'image/webp'],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'avatars.githubusercontent.com',
            },
        ],
    },
};

export default nextConfig;
