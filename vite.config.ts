import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [react(), VitePWA({ registerType: 'autoUpdate', includeAssets: ['favicon.svg'], manifest: { name: 'Lift Log', short_name: 'Lift Log', description: 'A local-first strength training logbook.', theme_color: '#fbf1c7', background_color: '#fbf1c7', display: 'standalone', start_url: '/' } })],
});
