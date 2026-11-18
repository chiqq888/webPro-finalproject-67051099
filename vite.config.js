import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    watch: {
      // JSON Server เขียนข้อมูลเองระหว่างใช้งาน จึงไม่ต้องรีโหลดหน้า
      ignored: ['**/db.json', '**/.~db.json'],
    },
  },
})
