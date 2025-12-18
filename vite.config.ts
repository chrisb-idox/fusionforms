import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-mantine': ['@mantine/core', '@mantine/hooks', '@mantine/form'],
          'vendor-dnd': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          'vendor-tiptap': ['@mantine/tiptap', '@tiptap/react', '@tiptap/starter-kit', '@tiptap/extension-link', '@tiptap/extension-text-align', '@tiptap/extension-underline'],
          'vendor-utils': ['react-hook-form'],
        },
      },
    },
  },
})
