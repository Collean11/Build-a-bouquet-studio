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
    port: 5177,
    host: true
  },
  publicDir: 'public',
  assetsInclude: ['**/*.glb', '**/*.gltf', '**/*.bin'],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.endsWith('.glb') || assetInfo.name.endsWith('.gltf') || assetInfo.name.endsWith('.bin')) {
            return 'models/[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    }
  }
})
