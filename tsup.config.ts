import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'ai-dev-kit': 'src/cli.ts'
  },
  format: ['esm'],
  target: 'node18',
  platform: 'node',
  clean: true,
  dts: false,
  sourcemap: false,
  outDir: 'bin',
  banner: {
    js: '#!/usr/bin/env node'
  },
  esbuildOptions(options) {
    options.chunkNames = 'chunks/[name]-[hash]';
  }
});
