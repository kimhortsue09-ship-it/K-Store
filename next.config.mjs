/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Telegram Mini Apps are served as a static client app; enable these to export a
  // fully static build you can upload to any HTTPS host (cPanel, Netlify, etc.).
  // The dynamic routes already ship generateStaticParams (see app/**/[id]/layout.tsx),
  // so uncommenting both lines and running `npm run build` produces a working static /out.
  // output: 'export',
  // trailingSlash: true,
};

export default nextConfig;
