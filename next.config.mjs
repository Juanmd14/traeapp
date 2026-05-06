/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Imágenes de demo (Unsplash)
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      // Bucket público de Supabase (reemplazar PROJECT por el ref real)
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  experimental: {
    // Server Actions están habilitados por default en 14
  },
  modularizeImports: {
    lucideReact: {
      transform: "lucide-react/dist/esm/icons/{{member}}",
      skipDefaultConversion: true,
    },
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};

export default nextConfig;
