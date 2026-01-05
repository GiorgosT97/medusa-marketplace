# Quick Start Guide

Get your deployment pipeline up and running in 30 minutes.

## 🎯 What You'll Get

- ✅ Automatic thumbnail generation for product images
- ✅ CI/CD pipeline with version management
- ✅ One-command deployments to production
- ✅ Persistent image storage in Docker
- ✅ Automatic versioning (semantic)

---

## 📋 Prerequisites

Before starting, ensure you have:

- [ ] GitHub repository with this code
- [ ] Self-hosted GitHub runner configured
- [ ] Docker Hub account
- [ ] Hetzner server with Docker installed
- [ ] SSH access to your server
- [ ] Domain pointing to your server (api.vintagevault.gr)

---

## 🚀 5-Step Setup

### Step 1: Fix Existing Products (2 minutes)

Run this **once** locally to fix thumbnails on existing products:

```bash
# Start your local dev server (if not running)
npm run dev

# In another terminal, run the fix script
npx medusa exec ./src/scripts/fix-thumbnails.ts
```

**Verify it worked:**

```bash
curl -s "http://localhost:9000/store/allproducts?limit=1" \
  -H "x-publishable-api-key: YOUR_KEY" | jq '.products[0].thumbnail'

# Should show URL, not null
```

### Step 2: Configure GitHub (5 minutes)

#### Add Variables

Go to: **Your Repo → Settings → Secrets and variables → Actions → Variables**

Add these **6 variables**:

```
DOCKER_USERNAME          → your-dockerhub-username
DOCKER_IMAGE_NAME        → marketplace-backend
MEDUSA_BACKEND_URL       → https://api.vintagevault.gr
VITE_BACKEND_URL         → https://api.vintagevault.gr
SERVER_HOST              → your-server-ip
SERVER_USER              → root
SERVER_PORT              → 22
DEPLOY_PATH              → /opt/marketplace
```

#### Add Secrets

Go to: **Your Repo → Settings → Secrets and variables → Actions → Secrets**

Add these **2 secrets**:

```
DOCKER_PASSWORD          → your-dockerhub-password-or-token
SSH_PRIVATE_KEY          → (see below)
```

**Generate SSH key for deployment:**

```bash
# On your local machine
ssh-keygen -t ed25519 -f ~/.ssh/marketplace_deploy -C "github-deploy"

# Show private key (copy this to GitHub Secret)
cat ~/.ssh/marketplace_deploy

# Copy public key to server
ssh-copy-id -i ~/.ssh/marketplace_deploy.pub root@your-server-ip
```

### Step 3: Setup Your Server (10 minutes)

SSH into your Hetzner server:

```bash
ssh root@your-server-ip
```

#### 3.1 Create deployment directory

```bash
mkdir -p /opt/marketplace
cd /opt/marketplace
```

#### 3.2 Create environment file

```bash
cat > .env << 'EOF'
# Database
DATABASE_URL=postgres://user:password@localhost:5432/marketplace

# Backend URLs
MEDUSA_BACKEND_URL=https://api.vintagevault.gr
VITE_BACKEND_URL=https://api.vintagevault.gr

# CORS
STORE_CORS=https://vintagevault.gr
ADMIN_CORS=https://admin.vintagevault.gr,https://api.vintagevault.gr
AUTH_CORS=https://admin.vintagevault.gr,https://api.vintagevault.gr

# Secrets (CHANGE THESE!)
JWT_SECRET=REPLACE_WITH_RANDOM_STRING
COOKIE_SECRET=REPLACE_WITH_RANDOM_STRING
EOF

# Generate secure secrets
JWT_SECRET=$(openssl rand -base64 32)
COOKIE_SECRET=$(openssl rand -base64 32)

# Update the .env file
sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env
sed -i "s|COOKIE_SECRET=.*|COOKIE_SECRET=$COOKIE_SECRET|" .env

echo "✓ Environment file created with secure secrets"
```

#### 3.3 Create docker-compose.yml

```bash
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  backend:
    image: ${DOCKER_IMAGE:-yourusername/marketplace-backend}:${IMAGE_TAG:-latest}
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
EOF

# Update with your Docker image name
read -p "Enter your Docker Hub username: " DOCKER_USER
sed -i "s|yourusername|$DOCKER_USER|" docker-compose.yml

echo "✓ Docker Compose file created"
```

#### 3.4 Copy deployment script

From your local machine, copy the deploy script to the server:

```bash
# On your local machine
scp deploy.sh root@your-server-ip:/opt/marketplace/

# On the server, make it executable
ssh root@your-server-ip "chmod +x /opt/marketplace/deploy.sh"
```

Or create it directly on the server:

```bash
# Copy the deploy.sh content from the repository
nano deploy.sh
# Paste, save, exit

chmod +x deploy.sh
```

### Step 4: Test Local Build (5 minutes)

Back on your **local machine**, test the Docker build:

```bash
# Build the image
docker build \
  --build-arg MEDUSA_BACKEND_URL=http://localhost:9000 \
  --build-arg VITE_BACKEND_URL=http://localhost:9000 \
  -t marketplace-test .

# Run it
docker run -d \
  --name marketplace-test \
  -p 9001:9000 \
  -e DATABASE_URL="YOUR_LOCAL_DB_URL" \
  -e MEDUSA_BACKEND_URL="http://localhost:9001" \
  -v $(pwd)/test-static:/app/.medusa/server/static \
  marketplace-test

# Check logs
docker logs marketplace-test

# Test endpoint
curl http://localhost:9001/health

# Cleanup
docker stop marketplace-test && docker rm marketplace-test
```

### Step 5: Deploy! (5 minutes)

#### 5.1 Push to main branch

```bash
git add .
git commit -m "feat: add CI/CD pipeline and thumbnail fixes"
git push origin main
```

#### 5.2 Watch the magic happen

Go to: **GitHub → Actions tab**

You should see two workflows running:

1. **Build and Push Docker Image** - Builds and pushes to Docker Hub
2. **Deploy to Production** - Deploys to your server

**Total time: ~5-10 minutes** depending on your internet speed.

#### 5.3 Verify deployment

```bash
# Check if backend is responding
curl https://api.vintagevault.gr/health

# Check products have thumbnails
curl -s "https://api.vintagevault.gr/store/allproducts?limit=2" \
  -H "x-publishable-api-key: YOUR_KEY" | jq '.products[] | {title, thumbnail}'

# Should show thumbnails with full URLs
```

---

## 🎉 Success!

Your deployment pipeline is now live! Here's what happens automatically:

### On Every Push to Main:

1. ✅ Version auto-increments (1.0.0 → 1.0.1 → 1.0.2...)
2. ✅ Docker image builds with new version tag
3. ✅ Image pushed to Docker Hub
4. ✅ GitHub Release created with tag
5. ✅ Deployed to your Hetzner server
6. ✅ Old containers cleaned up
7. ✅ Health checks performed

### New Products:

- ✅ Thumbnails automatically set from first image
- ✅ Images saved to persistent volume
- ✅ Accessible at: `https://api.vintagevault.gr/static/...`

---

## 🔧 Common Tasks

### Deploy a Specific Version

```bash
# Via GitHub UI
# Go to: Actions → Deploy to Production → Run workflow
# Enter version: v1.0.5

# Or via CLI
gh workflow run deploy.yml -f version=v1.0.5
```

### Manual Version Override

```bash
# Via GitHub UI
# Go to: Actions → Build and Push → Run workflow
# Enter version: 2.0.0

# This will skip auto-increment and use 2.0.0
```

### View Logs

```bash
# On your server
ssh root@your-server
docker logs -f marketplace-backend
```

### Rollback

```bash
# On your server
cd /opt/marketplace
./deploy.sh v1.0.5

# Or
export IMAGE_TAG=v1.0.5
docker-compose up -d
```

### Fix Thumbnails on Production

```bash
# SSH into server
ssh root@your-server

# Run fix script inside container
docker exec -it marketplace-backend npx medusa exec ./src/scripts/fix-thumbnails.ts
```

### Upload Test Image

1. Go to admin: https://admin.vintagevault.gr
2. Create a product
3. Upload images
4. Check API:

```bash
curl -s "https://api.vintagevault.gr/store/allproducts?limit=1" \
  -H "x-publishable-api-key: YOUR_KEY" | jq '.products[0].thumbnail'
```

---

## 🐛 Troubleshooting

### Thumbnails still null?

```bash
# Run the fix script
docker exec -it marketplace-backend npx medusa exec ./src/scripts/fix-thumbnails.ts
```

### Images not loading (404)?

```bash
# Check if files exist
docker exec marketplace-backend ls -la /app/.medusa/server/static

# Check MEDUSA_BACKEND_URL
docker exec marketplace-backend env | grep MEDUSA_BACKEND_URL

# Should be: https://api.vintagevault.gr
```

### Deployment failed?

```bash
# Check GitHub Actions logs
# Then on server:
ssh root@your-server
cd /opt/marketplace
docker logs marketplace-backend

# Common fixes:
docker-compose down
docker-compose up -d
```

### Version not updating?

```bash
# Check VERSION file
cat VERSION

# Manually bump
echo "1.2.3" > VERSION
git add VERSION
git commit -m "chore: bump version [skip ci]"
git push
```

---

## 📚 Next Steps

1. **Monitor**: Set up uptime monitoring
2. **Backups**: Configure automated backups
3. **SSL**: Ensure HTTPS is working
4. **CDN**: Consider Cloudflare for static files
5. **Alerts**: Set up notifications for failures

---

## 📖 Full Documentation

For detailed information, see:

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Complete deployment guide
- [Dockerfile](./Dockerfile) - Docker configuration
- [GitHub Actions](./.github/workflows/) - CI/CD workflows

---

## ✅ Checklist

Use this to verify everything is working:

- [ ] Thumbnails auto-generated on new products
- [ ] Existing products have thumbnails
- [ ] Images load correctly in production
- [ ] GitHub Actions building successfully
- [ ] Auto-deployment working on push to main
- [ ] Version incrementing automatically
- [ ] Docker volumes persisting data
- [ ] Can rollback to previous version
- [ ] Logs are accessible
- [ ] Health endpoint responding

---

**Time to deploy:** ~30 minutes
**Future deploys:** Automatic on git push 🚀

Enjoy your automated deployment pipeline!
