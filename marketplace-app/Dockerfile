FROM node:22-alpine

WORKDIR /app

ENV NPM_CONFIG_UPDATE_NOTIFIER=false
ENV MEDUSA_TELEMETRY_DISABLED=1

# IMPORTANT: build needs dev tooling available
ENV NODE_ENV=development

COPY package*.json ./
RUN npm ci

# Global CLI + global ts-node/typescript (so the global CLI can require them)
RUN npm i -g @medusajs/cli@2.11.1 ts-node typescript

COPY . .
ARG MEDUSA_BACKEND_URL
ARG VITE_BACKEND_URL
ENV MEDUSA_BACKEND_URL=${MEDUSA_BACKEND_URL}
ENV VITE_BACKEND_URL=${VITE_BACKEND_URL}

# Build -> creates .medusa/server
RUN medusa build

# "cd .medusa/server && npm install"
WORKDIR /app/.medusa/server
RUN npm install --omit=dev

# Create entrypoint script
RUN echo '#!/bin/sh' > /entrypoint.sh && \
    echo 'set -e' >> /entrypoint.sh && \
    echo '' >> /entrypoint.sh && \
    echo '# Copy .env if needed' >> /entrypoint.sh && \
    echo 'if [ ! -f .env.production ] && [ -f /app/.env ]; then' >> /entrypoint.sh && \
    echo '  cp /app/.env .env.production' >> /entrypoint.sh && \
    echo 'fi' >> /entrypoint.sh && \
    echo '' >> /entrypoint.sh && \
    echo 'export NODE_ENV=production' >> /entrypoint.sh && \
    echo '' >> /entrypoint.sh && \
    echo '# Run migrations before starting' >> /entrypoint.sh && \
    echo 'echo "Running database migrations..."' >> /entrypoint.sh && \
    echo 'npx medusa db:migrate || echo "Migration failed or already up to date"' >> /entrypoint.sh && \
    echo '' >> /entrypoint.sh && \
    echo '# Start the server' >> /entrypoint.sh && \
    echo 'echo "Starting Medusa server..."' >> /entrypoint.sh && \
    echo 'exec npm run start' >> /entrypoint.sh && \
    chmod +x /entrypoint.sh

VOLUME ["/app/.medusa/server/static"]
EXPOSE 9000

ENTRYPOINT ["/entrypoint.sh"]