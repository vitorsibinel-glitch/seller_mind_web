/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui"],
  output: "standalone",
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "sellermind.nyc3.cdn.digitaloceanspaces.com",
        pathname: "/**", // permite qualquer caminho dentro do domínio
      },
    ]
  }
}

export default nextConfig
