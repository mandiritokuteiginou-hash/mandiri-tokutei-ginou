import type { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mandiri Tokutei Ginou',
    short_name: 'MTG',
    start_url: '/',
    display: 'standalone',
    background_color: '#F4F5F7',
    theme_color: '#0B1F3A',
    icons: [],
  };
}
