import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  serverExternalPackages: ["puppeteer-core", "@puppeteer/browsers"],
  // Hostnames (no port) other than localhost that may reach the dev server, e.g. a forwarded public DNS name.
  // Comma separated in ALLOWED_DEV_ORIGINS (see .env.example).
  allowedDevOrigins: (process.env.ALLOWED_DEV_ORIGINS ?? "")
    .split(",")
    .map((host) => host.trim())
    .filter(Boolean),
  // cacheComponents stays off: every signed-in page is dynamic (see docs/DONTESEK.md).
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withNextIntl(nextConfig);
