import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 关键配置: 将前端 /api 开头的请求代理到后端 API
      '/api': {
        // !!! 重要: 已更新为您的服务器 IP 地址 !!!
        target: 'https://api.dify.ai', 
        
        // 这是必需的，它会修改请求头中的 Origin 字段
        changeOrigin: true, 
        
        // 将请求路径中的 /api 前缀去掉，再发给后端
        rewrite: (path) => path.replace(/^\/api/, ''), 
      },
    },
  },
})