import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    // Local dev: API runs via `npm run server` (api/index.js). On Vercel, `/api/*` is handled by the serverless function in `api/index.js` (see vercel.json rewrites).
    proxy: {
      "/api": "http://localhost:8787",
    },
  },
})
