import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Preflight/CI can point Vite at an empty directory so local .env files are
// never considered. This variable is process-only and is not exposed to Vite.
const isolatedEnvironmentDirectory = process.env.WEBICT_VITE_ENV_DIR

// https://vite.dev/config/
export default defineConfig({
  envDir: isolatedEnvironmentDirectory || undefined,
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    clearMocks: true,
    restoreMocks: true,
  },
})
