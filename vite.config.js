import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const mapsKey = (env.VITE_GOOGLE_MAPS_API_KEY || env.GOOGLE_MAPS_API_KEY || "").trim();

  return {
    plugins: [tailwindcss(), react()],
    define: {
      // Lets the client use the same key as the server Directions proxy when only GOOGLE_MAPS_API_KEY is set.
      "import.meta.env.VITE_GOOGLE_MAPS_API_KEY": JSON.stringify(
        (env.VITE_GOOGLE_MAPS_API_KEY || "").trim() || mapsKey,
      ),
    },
    server: {
      // Local dev: API runs via `npm run server` (api/index.js). On Vercel, `/api/*` is handled by the serverless function in `api/index.js` (see vercel.json rewrites).
      proxy: {
        "/api": "http://localhost:8787",
      },
    },
  };
});
