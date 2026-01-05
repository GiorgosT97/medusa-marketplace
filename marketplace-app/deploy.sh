#!/bin/bash

###############################################################################
# Deployment script for Medusa Marketplace Backend
# This script should be placed on your Hetzner server
# Run with: ./deploy.sh [version]
###############################################################################

set -e  # Exit on any error

# Configuration
DOCKER_IMAGE="${DOCKER_IMAGE:-docker.io/yourusername/marketplace-backend}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
CONTAINER_NAME="${CONTAINER_NAME:-marketplace-backend}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Parse version argument (optional)
VERSION="${1:-latest}"

log_info "Starting deployment for version: $VERSION"

# Step 1: Pull the latest image
log_info "Pulling Docker image: ${DOCKER_IMAGE}:${VERSION}"
if docker pull "${DOCKER_IMAGE}:${VERSION}"; then
    log_info "Successfully pulled image"
else
    log_error "Failed to pull image"
    exit 1
fi

# Step 2: Stop and remove existing container
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    log_info "Stopping existing container: ${CONTAINER_NAME}"
    docker stop "${CONTAINER_NAME}" || true
    
    log_info "Removing existing container: ${CONTAINER_NAME}"
    docker rm "${CONTAINER_NAME}" || true
else
    log_info "No existing container found"
fi

# Step 3: Remove old images (keep last 3 versions)
log_info "Cleaning up old images..."
docker images "${DOCKER_IMAGE}" --format "{{.ID}} {{.Tag}}" | \
    grep -v "latest" | \
    grep -v "${VERSION}" | \
    tail -n +4 | \
    awk '{print $1}' | \
    xargs -r docker rmi || true

# Step 4: Start new container with docker-compose
if [ -f "${COMPOSE_FILE}" ]; then
    log_info "Starting services with docker-compose"
    
    # Export version for docker-compose
    export IMAGE_TAG="${VERSION}"
    
    # Start services
    if docker-compose -f "${COMPOSE_FILE}" up -d; then
        log_info "Services started successfully"
    else
        log_error "Failed to start services"
        exit 1
    fi
else
    log_error "docker-compose.yml not found"
    exit 1
fi

# Step 5: Wait for container to be healthy
log_info "Waiting for container to be healthy..."
TIMEOUT=60
ELAPSED=0
while [ $ELAPSED -lt $TIMEOUT ]; do
    if docker ps --filter "name=${CONTAINER_NAME}" --filter "status=running" --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        log_info "Container is running"
        break
    fi
    sleep 2
    ELAPSED=$((ELAPSED + 2))
done

if [ $ELAPSED -ge $TIMEOUT ]; then
    log_error "Container failed to start within ${TIMEOUT} seconds"
    log_error "Showing container logs:"
    docker logs --tail 50 "${CONTAINER_NAME}" || true
    exit 1
fi

# Step 6: Check application health
log_info "Checking application health..."
sleep 5

# Try to hit the health endpoint
HEALTH_URL="${HEALTH_URL:-http://localhost:9000/health}"
if curl -f -s "${HEALTH_URL}" > /dev/null 2>&1; then
    log_info "✓ Application is healthy"
else
    log_warn "Health check endpoint not responding (this might be normal if health endpoint doesn't exist)"
fi

# Step 7: Show running containers
log_info "Running containers:"
docker ps --filter "name=${CONTAINER_NAME}"

log_info "═══════════════════════════════════════════════════════"
log_info "Deployment completed successfully! 🚀"
log_info "Version: ${VERSION}"
log_info "Container: ${CONTAINER_NAME}"
log_info "═══════════════════════════════════════════════════════"

# Show logs
log_info "Showing last 20 lines of logs:"
docker logs --tail 20 "${CONTAINER_NAME}"

log_info ""
log_info "To view live logs, run: docker logs -f ${CONTAINER_NAME}"
