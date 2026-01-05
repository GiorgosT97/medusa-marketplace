# Deployment Guide

This guide covers deploying the Medusa Marketplace Backend to production using GitHub Actions and your Hetzner server.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [GitHub Repository Setup](#github-repository-setup)
3. [Server Setup](#server-setup)
4. [Testing Locally](#testing-locally)
5. [CI/CD Pipeline](#cicd-pipeline)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools

- Docker and Docker Compose installed on server
- GitHub repository with Actions enabled
- Self-hosted GitHub Runner configured
- SSH access to your Hetzner server
- Docker Hub account (or other registry)

### Required Secrets and Variables

You'll need to configure these in your GitHub repository.

---

## GitHub Repository Setup

### 1. Configure GitHub Actions Variables

Go to **Settings → Secrets and variables → Actions → Variables** and add:

| Variable Name | Description | Example |
|--------------|-------------|---------|
| `DOCKER_USERNAME` | Your Docker Hub username | `yourusername` |
| `DOCKER_IMAGE_NAME` | Your Docker image name | `marketplace-backend` |
| `MEDUSA_BACKEND_URL` | Production backend URL | `https://api.vintagevault.gr` |
| `VITE_BACKEND_URL` | Vite backend URL (same as above) | `https://api.vintagevault.gr` |
| `SERVER_HOST` | Your Hetzner server IP/hostname | `123.45.67.89` |
| `SERVER_USER` | SSH user for deployment | `root` or `deploy` |
| `SERVER_PORT` | SSH port | `22` |
| `DEPLOY_PATH` | Deployment directory on server | `/opt/marketplace` |

### 2. Configure GitHub Secrets

Go to **Settings → Secrets and variables → Actions → Secrets** and add:

| Secret Name | Description | How to Get |
|------------|-------------|-----------|
| `DOCKER_PASSWORD` | Docker Hub password/token | Docker Hub → Account Settings → Security |
| `SSH_PRIVATE_KEY` | SSH private key for deployment | See "Generate SSH Key" below |

#### Generate SSH Key

On your local machine:

```bash
# Generate a new SSH key pair
ssh-keygen -t ed25519 -f ~/.ssh/marketplace_deploy -C "github-actions-deploy"

# Copy the private key content (this goes in GitHub Secrets)
cat ~/.ssh/marketplace_deploy

# Copy the public key to your server
ssh-copy-id -i ~/.ssh/marketplace_deploy.pub user@your-server
```

Copy the **private key** content to GitHub Secret `SSH_PRIVATE_KEY`.

---

## Server Setup

### 1. Prepare Deployment Directory

SSH into your Hetzner server:

```bash
ssh user@your-server

# Create deployment directory
sudo mkdir -p /opt/marketplace
sudo chown $USER:$USER /opt/marketplace
cd /opt/marketplace
```

### 2. Create Environment File

Create a `.env` file with your production configuration:

```bash
nano /opt/marketplace/.env
```

Add the following:

```env
# Database
DATABASE_URL=postgres://user:password@localhost:5432/marketplace

# Backend URLs
MEDUSA_BACKEND_URL=https://api.vintagevault.gr
VITE_BACKEND_URL=https://api.vintagevault.gr

# CORS
STORE_CORS=https://vintagevault.gr
ADMIN_CORS=https://admin.vintagevault.gr,https://api.vintagevault.gr
AUTH_CORS=https://admin.vintagevault.gr,https://api.vintagevault.gr

# Secrets (generate secure random strings)
JWT_SECRET=your-super-secret-jwt-key-here
COOKIE_SECRET=your-super-secret-cookie-key-here

# Optional
IS_CHANNEL_PRICING_ENABLED=false
```

**Generate secure secrets:**

```bash
# Generate JWT_SECRET
openssl rand -base64 32

# Generate COOKIE_SECRET
openssl rand -base64 32
```

### 3. Copy Docker Compose File

```bash
# Download from your repo or create manually
nano /opt/marketplace/docker-compose.yml
```

Paste the contents of `docker-compose.production.yml`:

```yaml
version: '3.8'

services:
  backend:
    image: ${DOCKER_IMAGE:-docker.io/yourusername/marketplace-backend}:${IMAGE_TAG:-latest}
    container_name: marketplace-backend
    restart: unless-stopped
    
    ports:
      - "9000:9000"
    
    env_file:
      - .env
    
    environment:
      - NODE_ENV=production
    
    volumes:
      - static-files:/app/.medusa/server/static
    
    networks:
      - marketplace-network
    
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:9000/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

volumes:
  static-files:
    driver: local

networks:
  marketplace-network:
    driver: bridge
```

### 4. Copy Deployment Script

```bash
nano /opt/marketplace/deploy.sh
chmod +x /opt/marketplace/deploy.sh
```

Paste the contents of `deploy.sh` from the repository.

### 5. Test Docker Setup

```bash
# Test Docker access
docker ps

# Test pulling image (if already built)
docker pull yourusername/marketplace-backend:latest

# Test starting services
cd /opt/marketplace
docker-compose up -d

# Check logs
docker logs marketplace-backend

# Stop for now
docker-compose down
```

---

## Testing Locally

Before deploying to production, test everything locally.

### 1. Test Thumbnail Auto-Generation

```bash
# Start your local dev server
npm run dev

# In another terminal, create a test product with the admin API
# or use the admin UI to upload a product with images

# Check the database to verify thumbnail was set
# Or query the API:
curl -s "http://localhost:9000/store/allproducts?limit=1" \
  -H "x-publishable-api-key: YOUR_KEY" | jq '.products[0].thumbnail'

# Should return the URL, not null
```

### 2. Fix Existing Products (One-time)

If you have existing products without thumbnails:

```bash
# Run the fix script locally first
npx medusa exec ./src/scripts/fix-thumbnails.ts

# Check results
curl -s "http://localhost:9000/store/allproducts" \
  -H "x-publishable-api-key: YOUR_KEY" | jq '.products[] | {id, title, thumbnail}'
```

### 3. Test Docker Build Locally

```bash
# Build the Docker image
docker build \
  --build-arg MEDUSA_BACKEND_URL=http://localhost:9000 \
  --build-arg VITE_BACKEND_URL=http://localhost:9000 \
  -t marketplace-backend:test .

# Run the container
docker run -d \
  --name marketplace-test \
  -p 9001:9000 \
  -e DATABASE_URL="your-db-url" \
  -e MEDUSA_BACKEND_URL="http://localhost:9001" \
  -v $(pwd)/static-test:/app/.medusa/server/static \
  marketplace-backend:test

# Check logs
docker logs -f marketplace-test

# Test the API
curl http://localhost:9001/health

# Upload a test image through admin and verify it's saved to ./static-test/

# Cleanup
docker stop marketplace-test
docker rm marketplace-test
```

### 4. Test Version Management

```bash
# Check current version
cat VERSION

# Simulate version bump
./test-version.sh  # or manually update VERSION file
```

---

## CI/CD Pipeline

### Repository Structure

```
medusa-marketplace/              # Repository root
├── .github/workflows/           # CI/CD workflows (repo root level)
│   ├── build-and-push.yml      # Build and push to Docker Hub
│   └── deploy.yml              # Deploy to production
└── marketplace-app/            # Medusa application
    ├── VERSION                 # Version tracking
    ├── Dockerfile              # Image build config
    └── ...                     # Application code
```

### How It Works

The CI/CD pipeline consists of two workflows located at **`.github/workflows/`** (repository root):

#### 1. Build and Push (`build-and-push.yml`)

**Trigger:** Push to `main` branch

**Steps:**
1. Determines version (auto-increment or manual)
2. Updates VERSION file
3. Builds Docker image with build args
4. Pushes to Docker Hub with version tag and `latest`
5. Creates GitHub Release with tag
6. Commits version bump to repo

**Version Management:**
- Auto-increment: Bumps patch version automatically (1.0.0 → 1.0.1)
- Manual override: Use workflow dispatch with custom version

#### 2. Deploy (`deploy.yml`)

**Trigger:** After successful build, or manual dispatch

**Steps:**
1. Determines version to deploy
2. SSH into your server
3. Runs `deploy.sh` script
4. Pulls new image
5. Stops old container
6. Starts new container
7. Verifies deployment

### Manual Deployment

#### Deploy Latest Version

```bash
# Via GitHub UI: Actions → Deploy to Production → Run workflow

# Or via gh CLI:
gh workflow run deploy.yml
```

#### Deploy Specific Version

```bash
# Via GitHub UI: Actions → Deploy to Production → Run workflow
# Enter version: v1.2.3

# Or via gh CLI:
gh workflow run deploy.yml -f version=v1.2.3
```

#### Build with Custom Version

```bash
# Via GitHub UI: Actions → Build and Push → Run workflow
# Enter version: 2.0.0

# Or via gh CLI:
gh workflow run build-and-push.yml -f version=2.0.0
```

### Viewing Deployment Status

```bash
# Check GitHub Actions runs
gh run list --workflow=deploy.yml

# Watch live logs
gh run watch

# On your server
ssh user@your-server
docker ps
docker logs -f marketplace-backend
```

---

## Testing the Deployment

### 1. Test API Endpoints

```bash
# Health check
curl -f https://api.vintagevault.gr/health

# Test products endpoint
curl -s "https://api.vintagevault.gr/store/allproducts?limit=2" \
  -H "x-publishable-api-key: YOUR_KEY" | jq .

# Verify thumbnails are populated
curl -s "https://api.vintagevault.gr/store/allproducts?limit=1" \
  -H "x-publishable-api-key: YOUR_KEY" | jq '.products[0].thumbnail'

# Should return: "https://api.vintagevault.gr/static/TIMESTAMP-filename.jpg"
```

### 2. Test Image Upload

1. Log into admin: `https://admin.vintagevault.gr`
2. Create a new product
3. Upload images
4. Save product
5. Check API response to verify thumbnail is set:

```bash
curl -s "https://api.vintagevault.gr/store/allproducts?limit=1" \
  -H "x-publishable-api-key: YOUR_KEY" | jq '.products[0]' | grep thumbnail
```

### 3. Test Static Files

```bash
# Get an image URL from a product
IMAGE_URL=$(curl -s "https://api.vintagevault.gr/store/allproducts?limit=1" \
  -H "x-publishable-api-key: YOUR_KEY" | jq -r '.products[0].images[0].url')

echo "Testing image URL: $IMAGE_URL"

# Download the image (should succeed)
curl -I "$IMAGE_URL"

# Should return 200 OK
```

### 4. Test Store Images

Store images are stored in metadata. Test via admin:

```bash
# Get stores
curl -s "https://api.vintagevault.gr/store/allproducts?limit=1" \
  -H "x-publishable-api-key: YOUR_KEY" | jq '.products[0].store.metadata'

# Should show store metadata like logo, banner, etc.
```

---

## Troubleshooting

### Thumbnails Still Null

**Cause:** Existing products created before the fix

**Solution:** Run the fix script on production:

```bash
# SSH into your server
ssh user@your-server

# Run the fix script inside the container
docker exec -it marketplace-backend npx medusa exec ./src/scripts/fix-thumbnails.ts

# Or copy and run locally against production DB (be careful!)
```

### Images Not Loading (404)

**Cause:** Static files not persisted or wrong URL

**Check:**

```bash
# On server, check if files exist
docker exec marketplace-backend ls -la /app/.medusa/server/static

# Check volume mount
docker inspect marketplace-backend | grep -A 10 Mounts

# Verify MEDUSA_BACKEND_URL is correct
docker exec marketplace-backend env | grep MEDUSA_BACKEND_URL
```

**Solution:**

1. Ensure volume is mounted correctly in docker-compose.yml
2. Verify `MEDUSA_BACKEND_URL` env var is set correctly
3. Check nginx/reverse proxy configuration if using one

### Deployment Fails - SSH Connection

**Cause:** SSH key not configured or wrong permissions

**Solution:**

```bash
# On server, check authorized_keys
cat ~/.ssh/authorized_keys | grep github-actions

# Test SSH from runner
ssh -i ~/.ssh/deploy_key user@server-ip

# Check SSH logs on server
sudo tail -f /var/log/auth.log
```

### Container Keeps Restarting

**Cause:** Database connection issue or missing env vars

**Check logs:**

```bash
docker logs marketplace-backend --tail 100

# Common issues:
# - DATABASE_URL not set or wrong
# - MEDUSA_BACKEND_URL not set
# - Database migrations failed
```

**Solution:**

```bash
# Check environment variables
docker exec marketplace-backend env

# Run migrations manually
docker exec marketplace-backend npx medusa db:migrate

# Restart container
docker restart marketplace-backend
```

### Version Not Incrementing

**Cause:** Git commit failed or VERSION file conflict

**Solution:**

```bash
# Check VERSION file
cat VERSION

# Manually update and commit
echo "1.2.3" > VERSION
git add VERSION
git commit -m "chore: update version to 1.2.3 [skip ci]"
git push
```

### Docker Build Fails

**Cause:** Build args not passed or dependencies issue

**Check:**

- Build logs in GitHub Actions
- Ensure `MEDUSA_BACKEND_URL` and `VITE_BACKEND_URL` are set as variables
- Check Dockerfile syntax

**Solution:**

```bash
# Test build locally with args
docker build \
  --build-arg MEDUSA_BACKEND_URL=https://api.vintagevault.gr \
  --build-arg VITE_BACKEND_URL=https://api.vintagevault.gr \
  -t test-build .
```

---

## Rollback Procedure

If deployment fails, rollback to previous version:

```bash
# On server
cd /opt/marketplace

# Deploy previous version
./deploy.sh v1.0.5

# Or use docker-compose directly
export IMAGE_TAG=v1.0.5
docker-compose up -d

# Check logs
docker logs -f marketplace-backend
```

---

## Monitoring

### Check Application Health

```bash
# API health
curl https://api.vintagevault.gr/health

# Container health
docker ps --filter "name=marketplace-backend"

# Resource usage
docker stats marketplace-backend --no-stream
```

### View Logs

```bash
# Live logs
docker logs -f marketplace-backend

# Last 100 lines
docker logs --tail 100 marketplace-backend

# Logs with timestamps
docker logs -t marketplace-backend

# Follow logs and filter
docker logs -f marketplace-backend 2>&1 | grep ERROR
```

---

## Security Checklist

- [ ] SSH key is secure and not shared
- [ ] Database credentials are strong and not exposed
- [ ] JWT_SECRET and COOKIE_SECRET are random and secure
- [ ] CORS is configured correctly for your domains
- [ ] Firewall rules are in place (ports 22, 80, 443, 9000)
- [ ] SSL certificates are valid and auto-renewing
- [ ] Docker containers run as non-root user (if possible)
- [ ] Regular backups of database and static files
- [ ] Log retention and rotation configured

---

## Next Steps

1. **Set up monitoring**: Use tools like Uptime Robot, Prometheus, or Grafana
2. **Configure backups**: Automate database and volume backups
3. **Set up alerts**: Get notified on deployment failures or downtime
4. **SSL/TLS**: Ensure HTTPS is properly configured with Let's Encrypt
5. **CDN**: Consider using Cloudflare or similar for static files
6. **Database scaling**: Set up read replicas if needed

---

## Support

If you encounter issues:

1. Check logs: `docker logs marketplace-backend`
2. Review GitHub Actions logs
3. Verify environment variables
4. Check server resources (disk, memory, CPU)
5. Test endpoints manually with curl

---

**Version:** 1.0.0
**Last Updated:** 2026-01-05
