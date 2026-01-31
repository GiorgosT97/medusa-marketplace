import { loadEnv, defineConfig, Modules } from '@medusajs/framework/utils'
import { BRAND_MODULE } from './src/modules/brand'
import { STORE_ADDRESS_MODULE } from './src/modules/store-address'

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
    // Brand module for product brands
    {
      resolve: "./src/modules/brand",
      options: {},
    },
    // Store address module for vendor locations
    {
      resolve: "./src/modules/store-address",
      options: {},
    },
    // File storage configuration for images/uploads
    {
      resolve: "@medusajs/medusa/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/file-local",
            id: "local",
            options: {
              // Use absolute path in production to match Docker workdir
              // In dev, use relative path from project root
              upload_dir: process.env.NODE_ENV === "production"
                ? "/app/.medusa/server/static"
                : "static",
              // This generates the correct URLs for uploaded images
              backend_url: `${BACKEND_URL}/static`,
            },
          },
        ],
      },
    },
  ],
})