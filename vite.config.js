import { defineConfig } from 'vite';

export default defineConfig({
  // OBLIGATORIO: rutas relativas para el despliegue en subcarpetas del aula virtual
  base: './',
  build: {
    // El entorno arm64 con esbuild 0.28.2 se cuelga al transpolar/minificar;
    // se apunta a esnext y se deja el bundle sin minificar (el ZIP sigue <25 MB).
    target: 'esnext',
    minify: false,
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      // Phaser se carga por CDN; no entra al bundle
      external: ['phaser'],
      output: { globals: { phaser: 'Phaser' } }
    }
  }
});
