import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// base './' lets the build run from any sub-path, e.g. GitHub Pages
export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    include: ['src/**/*.test.ts'],
  },
})
