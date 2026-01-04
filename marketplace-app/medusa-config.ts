import { loadEnv, defineConfig, Modules } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"

module.exports = defineConfig({
  admin: {
    // This tells the admin dashboard where to send API requests
    backendUrl: `${BACKEND_URL}`,
    vite: () => {
      return {
        optimizeDeps: {
          include: ["qs"],
        },
      };
    },
  },
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    cookieOptions: {
      sameSite: "lax",
      secure: false,
    },
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  },
  modules: [
    // THIS IS THE KEY FIX FOR IMAGE URLs
    {
      resolve: "@medusajs/medusa/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/file-local",
            id: "local",
            options: {
              // This generates correct URLs for uploaded images
              upload_dir: "static",
              backend_url: `${BACKEND_URL}/static`,
            },
          },
        ],
      },
    },
  ],
})