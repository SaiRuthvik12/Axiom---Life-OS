import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          strategies: 'injectManifest',
          srcDir: '.',
          filename: 'sw.ts',
          registerType: 'autoUpdate',
          includeAssets: ['favicon.ico', 'icon.svg'],
          manifest: {
            name: 'Axiom | Life OS',
            short_name: 'Axiom',
            description: 'Life Operating System — quests, stats, and progression',
            theme_color: '#09090b',
            background_color: '#09090b',
            display: 'standalone',
            orientation: 'portrait',
            scope: '/',
            start_url: '/',
            icons: [
              { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
            ],
          },
          injectManifest: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          },
        }),
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        // Inline Supabase env at build time so Vercel/hosts always provide them
        __AXIOM_SUPABASE_URL__: JSON.stringify(process.env.VITE_SUPABASE_URL ?? env.VITE_SUPABASE_URL ?? ''),
        __AXIOM_SUPABASE_ANON_KEY__: JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY ?? env.VITE_SUPABASE_ANON_KEY ?? ''),
        __AXIOM_VAPID_PUBLIC_KEY__: JSON.stringify(process.env.VITE_VAPID_PUBLIC_KEY ?? env.VITE_VAPID_PUBLIC_KEY ?? ''),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
