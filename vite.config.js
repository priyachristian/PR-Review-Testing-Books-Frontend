import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// Vite only exposes variables matching `envPrefix` (default "VITE_"), and it
// refuses an empty prefix. To allow ANY name, we read the key names straight
// out of the .env files that CI generates from the GitHub Actions variables
// and inline exactly those. Nothing from the build machine's own environment
// is exposed - only keys that literally appear in a .env file.
function envFileKeys(mode, dir) {
  const keys = new Set();
  for (const file of ['.env', `.env.${mode}`, '.env.local', `.env.${mode}.local`]) {
    const full = path.join(dir, file);
    if (!fs.existsSync(full)) continue;
    for (const line of fs.readFileSync(full, 'utf8').split('\n')) {
      const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/);
      if (match) keys.add(match[1]);
    }
  }
  return [...keys];
}

function envDefine(mode) {
  const dir = process.cwd();
  const keys = envFileKeys(mode, dir);
  const loaded = loadEnv(mode, dir, keys);
  const define = {};
  for (const key of keys) {
    define[`import.meta.env.${key}`] = JSON.stringify(loaded[key] ?? '');
  }
  return define;
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react({
      include: '**/*.{jsx,js}',
      babel: {
        plugins: [['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }]],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      components: path.resolve(__dirname, './src/components'),
      hooks: path.resolve(__dirname, './src/hooks'),
      features: path.resolve(__dirname, './src/features'),
      utils: path.resolve(__dirname, './src/utils'),
      pages: path.resolve(__dirname, './src/pages'),
      app: path.resolve(__dirname, './src/app'),
      assets: path.resolve(__dirname, './src/assets'),
      routes: path.resolve(__dirname, './src/routes'),
      validations: path.resolve(__dirname, './src/validations'),
    },
  },
  server: {
    port: 3000,
    open: true,
    host:true
  },
  build: {
    outDir: 'build',
    sourcemap: false, // Disable sourcemaps to reduce memory usage
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          antd: ['antd', '@ant-design/icons'],
          utils: ['axios', 'formik', 'yup', 'dayjs'],
          // @react-pdf/renderer, html2pdf and xlsx are dynamically imported — Vite splits them automatically
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    minify: 'esbuild',
    esbuild: {
      drop: ['console', 'debugger'],
    },
  },
  css: {
    postcss: './postcss.config.cjs',
  },
  define: {
    'process.env': {},
    ...envDefine(mode),
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
    exclude: ['@smit9313/abss-pdf'],
    include: [
      'react',
      'react-dom',
      'antd',
      '@ant-design/icons',
      '@ant-design/charts',
      'axios',
      'formik',
      'yup',
      'recharts',
    ],
  },
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.js$/,
  },
}));
