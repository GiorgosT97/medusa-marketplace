# Quick Reference Card

Your cheat sheet for common operations.

---

## 🚀 Quick Commands

### Local Development

```bash
# Start dev server
npm run dev

# Fix thumbnails locally
npx medusa exec ./src/scripts/fix-thumbnails.ts

# Test API
curl http://localhost:9000/store/allproducts -H "x-publishable-api-key: YOUR_KEY"
```

### Docker

```bash
# Build image
docker build -t marketplace:test --build-arg MEDUSA_BACKEND_URL=http://localhost:9000 .

# Run container
docker run -d --name marketplace-test -p 9001:9000 marketplace:test

# Check logs
docker logs -f marketplace-test

# Stop and remove
docker stop marketplace-test && docker rm marketplace-test
```

### Deployment

```bash
# Deploy (automatic on push to main)
git push origin main

# Deploy specific version
gh workflow run deploy.yml -f version=v1.2.3

# Build with custom version
gh workflow run build-and-push.yml -f version=2.0.0

# Watch deployment
gh run watch
```

### Server Operations

```bash
# SSH to server
ssh user@your-server

# Deploy specific version
cd /opt/marketplace && ./deploy.sh v1.2.3

# View logs
docker logs -f marketplace-backend

# Restart container
docker restart marketplace-backend

# Check container status
docker ps | grep marketplace

# Fix thumbnails in production
docker exec -it marketplace-backend npx medusa exec ./src/scripts/fix-thumbnails.ts
```

---

## 📋 Common Tasks

| Task | Command |
|------|---------|
| Test thumbnails | `curl -s "https://api.vintagevault.gr/store/allproducts?limit=1" -H "x-publishable-api-key: KEY" \| jq '.products[0].thumbnail'` |
| Check version | `cat VERSION` |
| View releases | `gh release list` |
| Rollback | `./deploy.sh v1.0.5` |
| Check disk usage | `docker system df` |
| Prune old images | `docker image prune -a` |
| View build logs | GitHub Actions → Build and Push → Latest run |
| View deploy logs | GitHub Actions → Deploy → Latest run |

---

## 🔧 Configuration Files

| File | Purpose | Location |
|------|---------|----------|
| VERSION | Version tracking | Project root |
| .env | Production config | Server: /opt/marketplace/.env |
| docker-compose.yml | Container orchestration | Server: /opt/marketplace/docker-compose.yml |
| deploy.sh | Deployment script | Server: /opt/marketplace/deploy.sh |
| Dockerfile | Image build config | Project root |
| medusa-config.ts | Medusa configuration | Project root |

---

## 🌐 Important URLs

| Service | URL |
|---------|-----|
| Backend API | https://api.vintagevault.gr |
| Admin UI | https://admin.vintagevault.gr |
| Storefront | https://vintagevault.gr |
| Static Files | https://api.vintagevault.gr/static/* |
| Health Check | https://api.vintagevault.gr/health |
| Docker Hub | https://hub.docker.com/r/YOUR_USERNAME/marketplace-backend |
| GitHub Actions | https://github.com/YOUR_REPO/actions |

---

## 📊 API Testing

```bash
# Get publishable key
curl http://localhost:9000/admin/publishable-api-keys \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Test products endpoint
curl -s "https://api.vintagevault.gr/store/allproducts?limit=5" \
  -H "x-publishable-api-key: YOUR_KEY" | jq .

# Check specific product
curl -s "https://api.vintagevault.gr/store/products/PRODUCT_ID" \
  -H "x-publishable-api-key: YOUR_KEY" | jq '.product | {title, thumbnail, images}'

# Test image URL
curl -I "https://api.vintagevault.gr/static/1234567890-image.jpg"
```

---

## 🐛 Quick Fixes

### Thumbnails are null

```bash
# Local
npx medusa exec ./src/scripts/fix-thumbnails.ts

# Production
ssh user@server
docker exec -it marketplace-backend npx medusa exec ./src/scripts/fix-thumbnails.ts
```

### Images not loading

```bash
# Check static directory
docker exec marketplace-backend ls -la /app/.medusa/server/static

# Check backend URL
docker exec marketplace-backend env | grep MEDUSA_BACKEND_URL

# Should be: https://api.vintagevault.gr
```

### Container won't start

```bash
# Check logs
docker logs marketplace-backend --tail 100

# Check env vars
docker exec marketplace-backend env

# Restart
docker restart marketplace-backend
```

### Deployment failed

```bash
# Check GitHub Actions logs
gh run list --workflow=deploy.yml
gh run view XXXXX

# Check server
ssh user@server
docker ps -a
docker logs marketplace-backend
```

---

## 📦 Version Management

### Check Current Version

```bash
# Local
cat VERSION

# Production
docker inspect marketplace-backend | grep -A 5 Image

# Latest release
gh release view
```

### Auto-Increment Behavior

```
1.0.0  →  push to main  →  1.0.1
1.0.1  →  push to main  →  1.0.2
1.0.2  →  manual: 2.0.0  →  2.0.0
2.0.0  →  push to main  →  2.0.1
```

---

## 🔐 Environment Variables

### Required for Build

```bash
MEDUSA_BACKEND_URL=https://api.vintagevault.gr
VITE_BACKEND_URL=https://api.vintagevault.gr
```

### Required for Runtime

```bash
DATABASE_URL=postgres://user:pass@host:5432/db
MEDUSA_BACKEND_URL=https://api.vintagevault.gr
JWT_SECRET=your-secret
COOKIE_SECRET=your-secret
STORE_CORS=https://vintagevault.gr
ADMIN_CORS=https://admin.vintagevault.gr
AUTH_CORS=https://admin.vintagevault.gr
```

---

## 📁 File Locations

### Local Development

```
marketplace-app/
├── static/                          # Uploaded images (dev)
├── src/
│   ├── workflows/hooks/
│   │   └── product-created.ts       # Auto-thumbnail logic
│   └── scripts/
│       └── fix-thumbnails.ts        # Fix script
├── .github/workflows/               # CI/CD pipelines
├── VERSION                          # Current version
└── deploy.sh                        # Deployment script
```

### Production (Docker)

```
Container:
├── /app/.medusa/server/static/      # Uploaded images
└── /app/.medusa/server/             # Built application

Server:
├── /opt/marketplace/
│   ├── .env                         # Environment config
│   ├── docker-compose.yml           # Container config
│   └── deploy.sh                    # Deployment script
```

---

## ⚡ One-Liners

```bash
# Full deployment pipeline status
gh run list --limit 5

# Test everything is working
curl -f https://api.vintagevault.gr/health && \
curl -s "https://api.vintagevault.gr/store/allproducts?limit=1" \
  -H "x-publishable-api-key: YOUR_KEY" | jq '.products[0].thumbnail'

# Clean up Docker
docker system prune -a --volumes

# Backup static files
docker cp marketplace-backend:/app/.medusa/server/static ./backup-static-$(date +%Y%m%d)

# Check resource usage
docker stats marketplace-backend --no-stream

# View real-time logs with timestamp
docker logs -f -t marketplace-backend

# Find large images
docker images --format "{{.Repository}}:{{.Tag}} {{.Size}}" | sort -k2 -h

# Get container IP
docker inspect marketplace-backend | grep IPAddress
```

---

## 🎯 Monitoring

```bash
# Health check
watch -n 5 'curl -s https://api.vintagevault.gr/health'

# Check logs for errors
docker logs marketplace-backend 2>&1 | grep -i error

# Monitor disk usage
df -h | grep docker

# Check container resource limits
docker inspect marketplace-backend | grep -A 10 Memory
```

---

## 📞 Need Help?

1. **Logs First:** `docker logs marketplace-backend --tail 100`
2. **GitHub Actions:** Check workflow runs for build/deploy issues
3. **Documentation:**
   - `QUICKSTART.md` - Fast setup
   - `DEPLOYMENT.md` - Detailed guide
   - `TESTING.md` - Test procedures
   - `CHANGES_SUMMARY.md` - What changed

---

## 💡 Pro Tips

- Always check logs first when troubleshooting
- Use `jq` for JSON formatting: `curl ... | jq .`
- Test locally before pushing to production
- Keep backups of `.env` and static files
- Monitor disk usage regularly
- Use semantic commit messages for better release notes
- Tag important releases for easy rollback
- Test rollback procedure regularly

---

**Print this page and keep it handy!** 📋
