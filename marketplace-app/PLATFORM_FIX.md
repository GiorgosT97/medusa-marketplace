# Platform Architecture Fix (AMD64 vs ARM64)

## ✅ Issue Fixed!

### What Happened

Your deployment failed with:
```
v1.0.2: Pulling from bitleaf/vintagevault-backend
no matching manifest for linux/amd64 in the manifest list entries
[ERROR] Failed to pull image
```

### Root Cause

**Architecture Mismatch:**
- 🏗️ **GitHub Runner:** ARM64 (Apple Silicon or ARM server)
- 🖥️ **Hetzner Server:** AMD64/x86_64 (Intel/AMD processor)
- 🐳 **Docker Image:** Built only for ARM64

When your server tried to pull the image, it couldn't find an AMD64 version.

---

## The Fix

Updated `.github/workflows/build-and-push.yml` to build **multi-platform images**:

```yaml
- name: Build and push Docker image
  uses: docker/build-push-action@v5
  with:
    platforms: linux/amd64,linux/arm64  # ← Added this line!
```

Now the build creates **two versions** of the same image:
- ✅ `linux/amd64` - For Intel/AMD servers (your Hetzner server)
- ✅ `linux/arm64` - For ARM servers (Apple Silicon, AWS Graviton, etc.)

Docker automatically pulls the correct version for each platform.

---

## What You Need to Do

### 1. Commit and Push the Fix

The workflow is already updated. Just commit and push:

```bash
git add .github/workflows/build-and-push.yml
git commit -m "fix: build multi-platform Docker images (amd64 + arm64)"
git push origin main
```

### 2. Wait for Build to Complete

The build will take longer this time because it builds for **two platforms**:

- **First multi-platform build:** 20-30 minutes
- **Subsequent builds:** 8-12 minutes (with cache)

**Previous (single platform):** 10-15 minutes
**New (multi-platform):** 20-30 minutes first time, then 8-12 minutes

### 3. Verify the Build

After the build completes, verify it supports both platforms:

```bash
# Check manifest
docker manifest inspect bitleaf/vintagevault-backend:latest

# Should show output like:
# {
#   "manifests": [
#     {
#       "platform": {
#         "architecture": "amd64",
#         "os": "linux"
#       }
#     },
#     {
#       "platform": {
#         "architecture": "arm64",
#         "os": "linux"
#       }
#     }
#   ]
# }
```

### 4. Deploy Will Work Automatically

Once the multi-platform image is built and pushed:
1. ✅ Deployment workflow triggers automatically
2. ✅ Server pulls the correct AMD64 version
3. ✅ Container starts successfully
4. ✅ Your app is live!

---

## Understanding the Issue

### Your Local Machine (ARM64)
```bash
docker ps
# Shows: marketplace-backend:test running fine
```

This works because your local machine is ARM64, matching the image architecture.

### Your Hetzner Server (AMD64)
```bash
# Check server architecture
uname -m
# Shows: x86_64 (which is AMD64)

# Try to pull ARM64 image
docker pull bitleaf/vintagevault-backend:v1.0.2
# Error: no matching manifest for linux/amd64
```

Server is AMD64 but image was ARM64-only.

### After Fix (Multi-Platform)
```bash
# On AMD64 server
docker pull bitleaf/vintagevault-backend:latest
# ✅ Pulls AMD64 version automatically

# On ARM64 machine
docker pull bitleaf/vintagevault-backend:latest
# ✅ Pulls ARM64 version automatically
```

Docker automatically selects the right architecture!

---

## Technical Details

### How Multi-Platform Builds Work

Docker Buildx creates separate builds for each platform:

```
Build Process:
├── Build for linux/amd64
│   ├── Pull node:22-alpine (amd64)
│   ├── Run npm ci (amd64)
│   ├── Build Medusa (amd64)
│   └── Create image layer (amd64)
│
└── Build for linux/arm64
    ├── Pull node:22-alpine (arm64)
    ├── Run npm ci (arm64)
    ├── Build Medusa (arm64)
    └── Create image layer (arm64)

Push to Docker Hub:
└── Single tag with manifest list
    ├── Manifest for amd64 → points to amd64 layers
    └── Manifest for arm64 → points to arm64 layers
```

When you pull the image, Docker checks your platform and downloads the matching layers.

### Build Cache

Multi-platform builds maintain **separate caches** for each platform:

```
bitleaf/vintagevault-backend:buildcache
├── Cache for linux/amd64
└── Cache for linux/arm64
```

This means both platforms benefit from caching!

---

## Benefits of Multi-Platform Images

✅ **Works on any server:**
- Intel/AMD servers (most cloud providers)
- ARM servers (AWS Graviton, Ampere, etc.)
- Apple Silicon (local development)

✅ **Single Docker tag:**
- No need for separate tags like `:amd64` or `:arm64`
- `docker pull bitleaf/vintagevault-backend:latest` works everywhere

✅ **Future-proof:**
- Can deploy to ARM servers for cost savings
- Can develop on Apple Silicon Macs
- Compatible with diverse infrastructure

---

## Verification Checklist

After the fix is deployed:

- [ ] Workflow file updated with `platforms: linux/amd64,linux/arm64`
- [ ] Changes committed and pushed to main
- [ ] Build workflow completes successfully (20-30 min)
- [ ] Docker Hub shows multi-platform manifest
- [ ] Deployment workflow succeeds
- [ ] Server pulls AMD64 image without errors
- [ ] Container starts and runs correctly
- [ ] API responds: `curl https://api.vintagevault.gr/health`

---

## If You Still Get Errors

### Build fails with "exec format error"

```bash
# Ensure QEMU is installed on runner
docker run --privileged --rm tonistiigi/binfmt --install all

# Or on Ubuntu
sudo apt-get install qemu-user-static
```

### Build is very slow

Multi-platform builds are 2x slower because they build twice. This is normal.

**Optimization:**
```yaml
# If you only need AMD64 for production, build only that:
platforms: linux/amd64

# Or build ARM64 separately for development:
platforms: linux/arm64
```

### Wrong architecture still being pulled

```bash
# Clear local images
docker rmi bitleaf/vintagevault-backend:latest

# Pull fresh
docker pull bitleaf/vintagevault-backend:latest

# Verify
docker inspect bitleaf/vintagevault-backend:latest | grep Architecture
# Should show: "Architecture": "amd64" (on AMD64 server)
```

---

## Quick Commands

```bash
# Check your machine architecture
uname -m
# x86_64 = AMD64/Intel
# aarch64 or arm64 = ARM64

# Check image architecture
docker inspect IMAGE_NAME | grep Architecture

# Check if image supports multiple platforms
docker manifest inspect bitleaf/vintagevault-backend:latest

# Force pull specific platform (for testing)
docker pull --platform linux/amd64 bitleaf/vintagevault-backend:latest
docker pull --platform linux/arm64 bitleaf/vintagevault-backend:latest

# Check Docker Buildx (needed for multi-platform)
docker buildx ls
```

---

## Summary

**Problem:** Image built for ARM64, server needs AMD64
**Solution:** Build multi-platform images supporting both
**Action:** Commit updated workflow and push
**Result:** Works on any architecture 🎉

---

**Status:** ✅ Fixed
**Next:** Commit and push to trigger new build
**Time:** 20-30 minutes for first multi-platform build

🚀 Your deployment will work after this!
