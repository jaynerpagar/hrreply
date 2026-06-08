/** @type {import('next').NextConfig} */
const nextConfig = {
  // Suppress build errors for missing env vars in CI (they'll be set in Vercel)
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  },
}

export default nextConfig
