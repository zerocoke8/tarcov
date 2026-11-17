import { defineConfig } from 'vite';

// GitHub Pages(https://<계정>.github.io/tarcov/)처럼 하위 경로에 올려도 동작하도록 상대 경로로 빌드한다.
export default defineConfig({
  base: './',
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173 },
  build: { target: 'es2020', chunkSizeWarningLimit: 1500 },
});
