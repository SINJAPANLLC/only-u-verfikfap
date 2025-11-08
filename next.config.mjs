import createNextPWA from "next-pwa";

const withPWA = createNextPWA({
  dest: "public",
  disable: process.env.NODE_ENV !== "production"
});

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true
  }
};

export default withPWA(nextConfig);
