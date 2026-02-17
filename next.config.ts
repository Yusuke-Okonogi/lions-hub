// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        // 元のVercelドメインからのアクセスを判定
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'lions-hub-fdyb.vercel.app',
          },
        ],
        // 新しいドメインの同じパスへ転送
        destination: 'https://hub.roppongi-lc.tokyo/:path*',
        permanent: true, // 301リダイレクト（検索エンジンにドメイン移転を伝える）
      },
    ];
  },
};

export default nextConfig;