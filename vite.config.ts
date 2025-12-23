import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/fusionforms/',
  plugins: [react()],
  server: {
    port: 5174,
    host: '0.0.0.0',
    allowedHosts: ['dev-codex.idoxgroup.local'],
    middlewareMode: false,
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Redirect /fusionforms (without trailing slash) to /fusionforms/
        if (req.url === '/fusionforms') {
          res.writeHead(301, { Location: '/fusionforms/' });
          res.end();
          return;
        }
        next();
      });
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-mantine': ['@mantine/core', '@mantine/hooks', '@mantine/form'],
          'vendor-tiptap': [
            '@mantine/tiptap',
            '@tiptap/react',
            '@tiptap/starter-kit',
            '@tiptap/extension-underline',
            '@tiptap/extension-link',
            '@tiptap/extension-text-align',
          ],
          'vendor-dnd': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          'vendor-utils': ['react-hook-form'],
        },
      },
    },
  },
  json: {
    stringify: true,
  },
})
