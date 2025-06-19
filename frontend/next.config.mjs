/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000', // Port Twojego serwera Flask
        pathname: '/**', // Pozwól na wszystkie ścieżki pod /uploads/ i /explanations/
      },
    ],
  },
}

export default nextConfig
