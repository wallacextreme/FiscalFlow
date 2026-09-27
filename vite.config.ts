import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  // Prevent vite from obscuring Rust errors
  clearScreen: false,
  server: {
    // Tauri expects a fixed port
    port: 1420,
    // Exit if port is already in use
    strictPort: true,
    // Allow Tauri dev tools to connect
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },
  // Env variables starting with TAURI_ are passed to the frontend
  envPrefix: ['VITE_', 'TAURI_ENV_*'],
  build: {
    // Tauri uses Chromium on Windows and WebKit on macOS/Linux
    target: process.env.TAURI_ENV_PLATFORM === 'windows' || !process.env.TAURI_ENV_PLATFORM ? 'chrome105' : ['es2021', 'safari14'],
    // Produce sourcemaps for debug builds
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
    // Don't minify for debug builds
    minify: !process.env.TAURI_ENV_DEBUG ? 'esbuild' : false,
  },
});
