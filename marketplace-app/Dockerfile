FROM node:22-alpine

WORKDIR /app

ENV NPM_CONFIG_UPDATE_NOTIFIER=false
ENV MEDUSA_TELEMETRY_DISABLED=1

# IMPORTANT: build needs dev tooling available
ENV NODE_ENV=development

COPY package*.json ./
RUN npm ci

# Global CLI + global ts-node/typescript (so the global CLI can require them)
RUN npm i -g @medusajs/cli@2.10.3 ts-node typescript

COPY . .

# Build -> creates .medusa/server
RUN medusa build

# "cd .medusa/server && npm install"
WORKDIR /app/.medusa/server
RUN npm install --omit=dev

VOLUME ["/app/.medusa/server/static"]
EXPOSE 9000

# Copy .env -> .env.production only if .env.production doesn't already exist
# (so it won't fight your compose bind-mount)
CMD ["sh", "-c", "if [ ! -f .env.production ] && [ -f /app/.env ]; then cp /app/.env .env.production; fi; export NODE_ENV=production; npm run start"]
