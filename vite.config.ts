import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
  },
  // build: {
  //   rollupOptions: {
  //     external: ['react', 'react-dom'],
  //     output: {
  //       globals: {
  //         react: 'logseq.Experiments.React',
  //         'react-dom': 'logseq.Experiments.ReactDOM',
  //       },
  //     }
  //   }
  // }
})