import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable Turbopack for ultra-fast dev builds
  turbopack: {
    resolveAlias: {
      // Optimize common imports
      '@': './src',
    },
  },
  
  // Reduce build time
  productionBrowserSourceMaps: false,
  
  // Optimize images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Optimize compilation - tree-shake icons and components
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@tanstack/react-query',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-dialog',
      '@radix-ui/react-label',
      '@radix-ui/react-slot',
      '@radix-ui/react-toast',
    ],
  },
  
  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Enable aggressive code splitting
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        runtimeChunk: 'single',
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk for node_modules
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
            // Separate chunk for large libraries
            lib: {
              test: /[\\/]node_modules[\\/](react|react-dom|@tanstack)[\\/]/,
              name: 'lib',
              chunks: 'all',
              priority: 30,
            },
            // Common components
            common: {
              minChunks: 2,
              priority: 10,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    return config;
  },
  
  // Compiler config
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

export default nextConfig;
