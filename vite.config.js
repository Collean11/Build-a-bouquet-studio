import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: [
      'three',
      '@react-three/fiber',
      '@react-three/drei',
      '@react-three/xr',
      '@react-spring/three',
      '@use-gesture/react'
    ]
  },
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
