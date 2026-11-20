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
const privateFiles = [
  '**/db.json',
  '**/.~db.json',
  '**/db-*.json',
  '**/.~db-*.json',
  '**/uploads/**',
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
        ...privateFiles,
        '**/server/**',
        '**/README.md',
      ],
    },
    watch: {
      // การเขียนฐานข้อมูลหรือไฟล์อัปโหลดไม่ต้องรีโหลดหน้า
      ignored: privateFiles,
    },
  },
  preview: { proxy },
});
