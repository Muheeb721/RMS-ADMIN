import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

const backendTarget = process.env.VITE_API_URL || process.env.VITE_API_BASE_URL || 'http://localhost:5001'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  server: {
    host: '0.0.0.0',
    port: 5174,
    proxy: {
      '/api': {
        target: backendTarget,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    proxy: {
      '/api': {
        target: backendTarget,
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
