import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// Relative URLs support both a domain root and GitHub Pages repository paths.
export default defineConfig({ base: './', build: { rollupOptions: { input: { main: resolve('index.html'), review: resolve('review.html') } } } });
