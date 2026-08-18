import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow images from external domains
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'maps.googleapis.com' },
    ],
  },
  // Ensure sharp is bundled server-side only
  serverExternalPackages: ['sharp', '@prisma/adapter-libsql', '@libsql/client'],
};

export default nextConfig;
