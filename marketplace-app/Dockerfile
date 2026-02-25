FROM node:22-slim

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

# Build args for URLs
ARG MEDUSA_BACKEND_URL
ARG VITE_BACKEND_URL
ENV MEDUSA_BACKEND_URL=${MEDUSA_BACKEND_URL}
ENV VITE_BACKEND_URL=${VITE_BACKEND_URL}

# Build -> creates .medusa/server
RUN medusa build

# Symlink .medusa/server/node_modules -> /app/node_modules instead of running a
# separate "npm install --omit=dev" inside .medusa/server.
#
# Why: two separate node_modules trees cause two Awilix instances with different
# ROLL_UP_REGISTRATIONS Symbols, breaking ALL custom workflows at runtime.
# A symlink ensures every require() from .medusa/server/src resolves to the same
# /app/node_modules as the rest of the app — one tree, one Symbol, no conflict.
WORKDIR /app/.medusa/server
RUN ln -s /app/node_modules node_modules

# Create static directory for file uploads
RUN mkdir -p /app/.medusa/server/static

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
    echo '# Ensure MEDUSA_BACKEND_URL is set' >> /entrypoint.sh && \
    echo 'if [ -z "$MEDUSA_BACKEND_URL" ]; then' >> /entrypoint.sh && \
    echo '  echo "ERROR: MEDUSA_BACKEND_URL environment variable is not set"' >> /entrypoint.sh && \
    echo '  exit 1' >> /entrypoint.sh && \
    echo 'fi' >> /entrypoint.sh && \
    echo '' >> /entrypoint.sh && \
    echo 'echo "Backend URL: $MEDUSA_BACKEND_URL"' >> /entrypoint.sh && \
    echo 'echo "Static files directory: /app/.medusa/server/static"' >> /entrypoint.sh && \
    echo '' >> /entrypoint.sh && \
    echo '# Ensure static directory exists and has correct permissions' >> /entrypoint.sh && \
    echo 'mkdir -p /app/.medusa/server/static' >> /entrypoint.sh && \
    echo 'chmod 755 /app/.medusa/server/static' >> /entrypoint.sh && \
    echo '' >> /entrypoint.sh && \
    echo '# Run migrations before starting' >> /entrypoint.sh && \
    echo 'echo "Running database migrations..."' >> /entrypoint.sh && \
    echo 'npx medusa db:migrate || echo "Migration failed or already up to date"' >> /entrypoint.sh && \
    echo '' >> /entrypoint.sh && \
    echo '# Start the server' >> /entrypoint.sh && \
    echo 'echo "Starting Medusa server..."' >> /entrypoint.sh && \
    echo 'exec npm run start' >> /entrypoint.sh && \
    chmod +x /entrypoint.sh

# Mount volume for static files at the correct location
VOLUME ["/app/.medusa/server/static"]
EXPOSE 9000

ENTRYPOINT ["/entrypoint.sh"]
