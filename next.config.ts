import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Les signatures sont transmises en dataURL base64 dans les Server Actions :
  // la limite par défaut (1 Mo) est trop juste pour deux tracés haute densité.
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
