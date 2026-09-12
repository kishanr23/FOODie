import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FOODie Community',
    short_name: 'FOODie',
    description: 'Discover real food, real places, and real vibes.',
    start_url: '/',
    display: 'standalone',
    background_color: '#080c09', // var(--bg-deep)
    theme_color: '#080c09',
    orientation: 'portrait',
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
