import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'LIONS HUB',
    short_name: 'LIONS HUB',
    description: '東京六本木ライオンズクラブ 会員ポータル',
    start_url: '/',
    display: 'standalone', // これでブラウザの枠が消えてアプリっぽくなります
    background_color: '#003366', // ライオンズネイビー
    theme_color: '#003366',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}