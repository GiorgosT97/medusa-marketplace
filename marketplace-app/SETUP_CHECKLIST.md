# Setup Checklist

Use this checklist to ensure everything is configured correctly.

## ✅ Pre-Deployment Checklist

### 1. Repository Structure

- [ ] `.github/workflows/` exists at **repository root** (not in marketplace-app)
- [ ] `build-and-push.yml` exists in `.github/workflows/`
- [ ] `deploy.yml` exists in `.github/workflows/`
- [ ] `VERSION` file exists in `marketplace-app/`
- [ ] `deploy.sh` exists in `marketplace-app/` and is executable
- [ ] All documentation files (QUICKSTART.md, DEPLOYMENT.md, etc.) exist

```bash
# Verify structure
ls -la .github/workflows/
ls -la marketplace-app/VERSION
ls -la marketplace-app/deploy.sh
```

### 2. GitHub Configuration

#### Variables (Settings → Secrets and variables → Actions → Variables)

- [ ] `DOCKER_USERNAME` - Your Docker Hub username
- [ ] `DOCKER_IMAGE_NAME` - Docker image name (e.g., marketplace-backend)
- [ ] `MEDUSA_BACKEND_URL` - Production backend URL (e.g., https://api.vintagevault.gr)
- [ ] `VITE_BACKEND_URL` - Same as MEDUSA_BACKEND_URL
- [ ] `SERVER_HOST` - Your server IP or hostname
- [ ] `SERVER_USER` - SSH username (e.g., root)
- [ ] `SERVER_PORT` - SSH port (usually 22)
- [ ] `DEPLOY_PATH` - Deployment directory (e.g., /opt/marketplace)
- [ ] `CONTAINER_NAME` - Container name (e.g., marketplace-backend)

```bash
# Verify variables via GitHub CLI
gh variable list
```

#### Secrets (Settings → Secrets and variables → Actions → Secrets)

- [ ] `DOCKER_PASSWORD` - Docker Hub password or access token
- [ ] `SSH_PRIVATE_KEY` - SSH private key for deployment

```bash
# Verify secrets exist (won't show values)
gh secret list
```

### 3. Self-Hosted Runner

- [ ] GitHub runner is installed and running
- [ ] Runner has access to Docker
- [ ] Runner can access your server via SSH
- [ ] Runner has necessary permissions

```bash
# On your runner machine
docker ps
ssh -i ~/.ssh/deploy_key user@your-server echo "SSH works"
```

### 4. Server Setup

#### Files on Server

- [ ] `/opt/marketplace/` directory exists
- [ ] `/opt/marketplace/.env` exists with production config
- [ ] `/opt/marketplace/docker-compose.yml` exists
- [ ] `/opt/marketplace/deploy.sh` exists and is executable
- [ ] SSH public key is in `~/.ssh/authorized_keys`

```bash
# Verify on server
ssh user@server "ls -la /opt/marketplace/"
ssh user@server "test -f /opt/marketplace/.env && echo '.env exists'"
ssh user@server "test -x /opt/marketplace/deploy.sh && echo 'deploy.sh is executable'"
```

#### Environment Variables in .env

- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `MEDUSA_BACKEND_URL` - Production backend URL
- [ ] `VITE_BACKEND_URL` - Same as MEDUSA_BACKEND_URL
- [ ] `STORE_CORS` - Storefront URL
- [ ] `ADMIN_CORS` - Admin URLs (comma-separated)
- [ ] `AUTH_CORS` - Auth URLs (comma-separated)
- [ ] `JWT_SECRET` - Secure random string (32+ chars)
- [ ] `COOKIE_SECRET` - Secure random string (32+ chars)

```bash
# Verify env vars on server (don't expose secrets!)
ssh user@server "cd /opt/marketplace && grep -E '^[A-Z_]+=.+' .env | wc -l"
# Should return at least 9
```

#### Docker on Server

- [ ] Docker is installed and running
- [ ] Docker Compose is installed
- [ ] User has Docker permissions
- [ ] Can pull from Docker Hub

```bash
# Verify Docker on server
ssh user@server "docker --version"
ssh user@server "docker-compose --version"
ssh user@server "docker ps"
```

### 5. Local Development

- [ ] Can run local dev server: `npm run dev`
- [ ] Can access admin at http://localhost:5173
- [ ] Can create products with images
- [ ] Thumbnails auto-generate on new products
- [ ] Fix script works: `npx medusa exec ./src/scripts/fix-thumbnails.ts`

```bash
# Test locally
cd marketplace-app
npm run dev

# In another terminal
npx medusa exec ./src/scripts/fix-thumbnails.ts
```

### 6. SSH Access

- [ ] Can SSH to server without password
- [ ] SSH key has correct permissions (600)
- [ ] Server is in known_hosts
- [ ] User has sudo access (if needed)

```bash
# Test SSH
ssh -i ~/.ssh/deploy_key user@server "whoami"
# Should return your username without asking for password
```

### 7. Docker Hub

- [ ] Have Docker Hub account
- [ ] Repository exists (or will be auto-created)
- [ ] Access token created (not password)
- [ ] Token has push permissions

```bash
# Test Docker Hub login
echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
docker pull hello-world
```

---

## ✅ Post-Deployment Checklist

### After First Deployment

- [ ] GitHub Actions completed successfully
- [ ] Version bumped in VERSION file
- [ ] Git tag created
- [ ] GitHub release created
- [ ] Docker image pushed to Docker Hub
- [ ] Container running on server
- [ ] API responds at production URL
- [ ] Products have thumbnails
- [ ] Images load from static files
- [ ] Admin UI accessible

```bash
# Check deployment
curl -f https://api.vintagevault.gr/health

# Check thumbnails
curl -s "https://api.vintagevault.gr/store/allproducts?limit=1" \
  -H "x-publishable-api-key: YOUR_KEY" | jq '.products[0].thumbnail'

# Check on server
ssh user@server "docker ps | grep marketplace"
ssh user@server "docker logs marketplace-backend --tail 20"
```

### Version Management

- [ ] VERSION file has correct version
- [ ] Git tag matches VERSION
- [ ] Docker tag matches VERSION
- [ ] GitHub release exists

```bash
# Check versions
cat marketplace-app/VERSION
git tag -l | tail -1
gh release list | head -1
```

### Static Files

- [ ] Volume mounted correctly
- [ ] Files persist after restart
- [ ] Images accessible via URL

```bash
# Check volume
ssh user@server "docker volume ls | grep marketplace"
ssh user@server "docker exec marketplace-backend ls -la /app/.medusa/server/static | head -10"

# Test image URL
IMAGE_URL=$(curl -s "https://api.vintagevault.gr/store/allproducts?limit=1" \
  -H "x-publishable-api-key: YOUR_KEY" | jq -r '.products[0].images[0].url')
curl -I "$IMAGE_URL"
```

---

## 🧪 Test Deployment

### 1. Make a Test Change

```bash
# Add a comment or small change
echo "# Test deployment $(date)" >> marketplace-app/README.md
git add .
git commit -m "test: verify CI/CD pipeline"
git push origin main
```

### 2. Watch Progress

```bash
# Via GitHub CLI
gh run watch

# Or go to: https://github.com/YOUR_REPO/actions
```

### 3. Verify Success

```bash
# Check version bumped
git pull
cat marketplace-app/VERSION

# Check API
curl https://api.vintagevault.gr/health

# Check container on server
ssh user@server "docker ps | grep marketplace"
```

---

## 🐛 Common Issues

### GitHub Actions Not Triggering

**Check:**
- [ ] Workflows are in `.github/workflows/` at repo root
- [ ] File names: `build-and-push.yml` and `deploy.yml`
- [ ] Self-hosted runner is online
- [ ] Push is to `main` branch
- [ ] Changes are in `marketplace-app/` directory

**Fix:**
```bash
# Check runner status
# Go to: Settings → Actions → Runners

# Verify workflow files
ls -la .github/workflows/

# Check branch
git branch
```

### Version Not Committing

**Check:**
- [ ] Git config is set in workflow
- [ ] Runner has push permissions
- [ ] No protected branch rules blocking commits

**Fix:**
```bash
# Check branch protection
# Go to: Settings → Branches → main

# Ensure [skip ci] works in commit message
```

### SSH Connection Failed

**Check:**
- [ ] SSH_PRIVATE_KEY secret is correct
- [ ] Public key on server
- [ ] SERVER_HOST is correct
- [ ] SERVER_PORT is correct (usually 22)

**Fix:**
```bash
# Test SSH from runner
ssh -i ~/.ssh/deploy_key user@server echo "test"

# Check authorized_keys on server
ssh user@server "cat ~/.ssh/authorized_keys | grep github"
```

### Docker Image Not Found

**Check:**
- [ ] DOCKER_USERNAME is correct
- [ ] DOCKER_IMAGE_NAME is correct
- [ ] Image was pushed successfully
- [ ] Can pull image manually

**Fix:**
```bash
# Check Docker Hub
docker pull $DOCKER_USERNAME/$DOCKER_IMAGE_NAME:latest

# Check build logs in GitHub Actions
```

### Container Won't Start

**Check:**
- [ ] DATABASE_URL is correct
- [ ] MEDUSA_BACKEND_URL is set
- [ ] All required env vars present
- [ ] Database is accessible

**Fix:**
```bash
# Check logs
ssh user@server "docker logs marketplace-backend --tail 50"

# Check env vars
ssh user@server "docker exec marketplace-backend env | grep -E 'DATABASE|MEDUSA'"

# Test manually
ssh user@server "cd /opt/marketplace && docker-compose up"
```

---

## 📋 Final Verification

Run all these commands to verify complete setup:

```bash
# 1. Repository structure
test -d .github/workflows && echo "✓ Workflows directory exists" || echo "✗ Missing"
test -f .github/workflows/build-and-push.yml && echo "✓ Build workflow exists" || echo "✗ Missing"
test -f .github/workflows/deploy.yml && echo "✓ Deploy workflow exists" || echo "✗ Missing"
test -f marketplace-app/VERSION && echo "✓ VERSION file exists" || echo "✗ Missing"

# 2. GitHub config
gh variable list > /dev/null 2>&1 && echo "✓ Can access variables" || echo "✗ Cannot access"
gh secret list > /dev/null 2>&1 && echo "✓ Can access secrets" || echo "✗ Cannot access"

# 3. Server access
ssh user@server "echo '✓ SSH works'" || echo "✗ SSH failed"

# 4. Server files
ssh user@server "test -f /opt/marketplace/.env && echo '✓ .env exists'" || echo "✗ Missing"
ssh user@server "test -f /opt/marketplace/docker-compose.yml && echo '✓ docker-compose.yml exists'" || echo "✗ Missing"
ssh user@server "test -x /opt/marketplace/deploy.sh && echo '✓ deploy.sh executable'" || echo "✗ Not executable"

# 5. Production API
curl -f https://api.vintagevault.gr/health > /dev/null 2>&1 && echo "✓ API responding" || echo "✗ API not responding"

# 6. Docker on server
ssh user@server "docker ps | grep -q marketplace && echo '✓ Container running'" || echo "✗ Container not running"
```

---

## 🎉 Ready to Go!

If all items are checked, you're ready to deploy!

**Next Steps:**
1. Push a change to main branch
2. Watch GitHub Actions
3. Verify deployment
4. Celebrate! 🎊

**Need Help?**
- Review [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed troubleshooting
- Check [TESTING.md](./TESTING.md) for test procedures
- See [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) for common commands

---

**Last Updated:** 2026-01-05
