import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*" },
      { protocol: "http", hostname: "*" },
    ],
  },
  webpack: config => {
    // Suppress handlebars require.extensions warning
    config.ignoreWarnings = [/require\.extensions/]
    return config
  },
}

export default nextConfig
