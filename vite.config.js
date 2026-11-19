import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

const proxy = {
  '/api/': {
    target: 'http://localhost:3001',
    changeOrigin: false,
    rewrite: (path) => path.slice(4),
  },
};
const databaseFiles = [
  '**/db.json',
  '**/.~db.json',
  '**/db-*.json',
  '**/.~db-*.json',
];

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy,
    fs: {
      deny: [
        '.env',
        '.env.*',
        '*.{crt,pem,key,p12,pfx,cer,der}',
        '.npmrc',
        '.yarnrc.yml',
        '**/.git/**',
        ...databaseFiles,
        '**/server/**',
        '**/README.md',
      ],
    },
    watch: {
      // JSON Server เขียนข้อมูลเองระหว่างใช้งาน จึงไม่ต้องรีโหลดหน้า
      ignored: databaseFiles,
    },
  },
  preview: { proxy },
});
