import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

const site = process.env.SITE_URL
  ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://artstroismolian.com');

export default defineConfig({
  site,
  output: 'static',
  integrations: [
    tailwind({ applyBaseStyles: false }),
    react(),
    sitemap({
      changefreq: 'monthly',
      priority: 0.7,
    }),
  ],
  prefetch: { defaultStrategy: 'viewport' },
  vite: {
    ssr: { noExternal: ['embla-carousel-react', 'embla-carousel-autoplay'] },
  },
});
