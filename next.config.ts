import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "" = served at the root; build-time only (see NEXT_BASE_PATH in .env.example)
  basePath: process.env.NEXT_BASE_PATH ?? "",
  // `next dev` rejects requests from any origin but localhost (403 on the JS
  // chunks + a failed HMR socket), so a phone opening http://<LAN-IP>:3000 got
  // a page that never hydrated and could not sign in. Dev-only — `next start`
  // ignores this. Matches any host on the office 192.168.33.x subnet.
  allowedDevOrigins: ["192.168.33.*"],
};

export default nextConfig;
