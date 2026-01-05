# Troubleshooting Guide

## Build Issues

### Build Canceled During npm ci

**Symptom:** Build gets canceled during `npm ci` step in Docker build.

**Logs show:**
```
#11 [ 4/11] RUN npm ci
#11 5.418 npm warn deprecated ...
...
Error: The operation was canceled.
```

**Possible Causes:**

1. **Manual Cancellation** - Someone clicked "Cancel" in GitHub Actions
2. **Timeout** - Build took too long (default: 6 hours for GitHub Actions)
3. **Runner Disconnected** - Self-hosted runner lost connection
4. **Out of Resources** - Runner ran out of disk space, memory, or CPU

**Solutions:**

#### 1. Check Runner Status

```bash
# On your runner machine
systemctl status actions.runner.*

# Check logs
journalctl -u actions.runner.* -n 100
```

#### 2. Check Runner Resources

```bash
# Disk space
df -h

# Memory
free -h

# Docker disk usage
docker system df
```

If disk is full:
```bash
# Clean up Docker
docker system prune -a --volumes

# Remove old images
docker images | grep vintagevault-backend | tail -n +4 | awk '{print $3}' | xargs -r docker rmi
```

#### 3. Increase Build Timeout

Add timeout to build job in `.github/workflows/build-and-push.yml`:

```yaml
  build:
    name: Build and Push
    runs-on: self-hosted
    needs: version
    timeout-minutes: 60  # Add this line (default is 360)
    steps:
      # ... rest of steps
```

#### 4. Optimize Build Speed

The build cache warning is normal for first build:
```
#7 importing cache manifest from bitleaf/vintagevault-backend:buildcache
#7 ERROR: failed to configure registry cache importer: ... not found
```

This will be resolved on subsequent builds.

To speed up builds, ensure Docker layer caching works:

```yaml
# In build-and-push.yml, this is already configured:
cache-from: type=registry,ref=${{ env.DOCKER_IMAGE }}:buildcache
cache-to: type=registry,ref=${{ env.DOCKER_IMAGE }}:buildcache,mode=max
```

#### 5. Test Build Locally

Before pushing, test the build locally:

```bash
cd marketplace-app

# Build with same args as CI
docker build \
  --build-arg MEDUSA_BACKEND_URL=https://api.vintagevault.gr \
  --build-arg VITE_BACKEND_URL=https://api.vintagevault.gr \
  -t vintagevault-backend:test \
  .

# If successful, the CI build should work too
```

#### 6. Re-run the Workflow

If it was a temporary issue, just re-run:

```bash
# Via GitHub CLI
gh run list --workflow=build-and-push.yml
gh run rerun <run-id>

# Or via UI: GitHub → Actions → Failed run → Re-run jobs
```

#### 7. Check for Network Issues

```bash
# On runner machine, test Docker Hub connectivity
docker pull hello-world

# Test npm registry
curl -I https://registry.npmjs.org/

# Test GitHub
curl -I https://github.com
```

---

## Common Build Errors

### Error: cache import failed

```
#7 ERROR: failed to configure registry cache importer: not found
```

**This is NORMAL for first build.** Subsequent builds will use the cache.

**No action needed.**

---

### Error: context canceled

```
ERROR: failed to solve: context canceled
```

**Cause:** Build was interrupted (manually or by timeout)

**Solution:** Re-run the workflow

---

### Error: no space left on device

```
ERROR: failed to copy files: write /var/lib/docker/...: no space left on device
```

**Cause:** Runner out of disk space

**Solution:**
```bash
# Clean Docker
docker system prune -a --volumes -f

# Check space
df -h

# If still full, remove old images
docker images | grep months | awk '{print $3}' | xargs docker rmi
```

---

### Error: Could not resolve host

```
ERROR: failed to solve: failed to fetch alpine ...: Get "https://...": dial tcp: lookup ... no such host
```

**Cause:** Network/DNS issue on runner

**Solution:**
```bash
# Check DNS
cat /etc/resolv.conf

# Test resolution
nslookup registry-1.docker.io

# Restart Docker
sudo systemctl restart docker

# Restart runner
sudo systemctl restart actions.runner.*
```

---

## Deployment Issues

### No Matching Manifest for linux/amd64

**Symptom:**
```
v1.0.2: Pulling from bitleaf/vintagevault-backend
no matching manifest for linux/amd64 in the manifest list entries
[ERROR] Failed to pull image
```

**Cause:** Docker image was built for wrong CPU architecture.

- Your runner is ARM64 (Apple Silicon or ARM server)
- Your Hetzner server is AMD64 (Intel/AMD x86_64)
- Image only built for one platform

**Solution:**

✅ **Already fixed!** The workflow now builds multi-platform images in `.github/workflows/build-and-push.yml`:

```yaml
- name: Build and push Docker image
  uses: docker/build-push-action@v5
  with:
    platforms: linux/amd64,linux/arm64  # ← Builds for both!
```

**To apply the fix:**
1. The workflow is already updated
2. Just commit and push to trigger a new build
3. New images will support both AMD64 and ARM64

**Verify multi-platform build:**
```bash
# After successful build, check on Docker Hub
docker manifest inspect bitleaf/vintagevault-backend:latest

# Should show both platforms:
# - linux/amd64
# - linux/arm64
```

**Build times with multi-platform:**
- First build: 20-30 minutes (builds for both platforms)
- Cached builds: 8-12 minutes

---

### SSH Connection Failed

**Symptom:**
```
Error: Process completed with exit code 255.
```

**Solutions:**

1. **Verify SSH Key:**
```bash
# On runner, test SSH
ssh -i ~/.ssh/deploy_key user@server echo "test"
```

2. **Check SSH_PRIVATE_KEY Secret:**
```bash
# Ensure it's the complete private key including headers
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

3. **Verify Server Access:**
```bash
# From runner machine
ssh user@server-ip -p 22

# Check authorized_keys on server
cat ~/.ssh/authorized_keys
```

---

### Container Won't Start

**Symptom:** Container starts but immediately stops

**Check logs:**
```bash
ssh user@server
docker logs marketplace-backend --tail 100
```

**Common issues:**

1. **Database not accessible:**
```bash
# Test from server
docker exec marketplace-backend ping -c 3 your-db-host
```

2. **Missing env vars:**
```bash
docker exec marketplace-backend env | grep -E "DATABASE_URL|MEDUSA_BACKEND_URL"
```

3. **Wrong DATABASE_URL format:**
```bash
# Should be:
postgres://user:password@host:5432/database

# NOT:
postgresql://... (use postgres://)
```

---

### Images Not Loading (404)

**Symptom:** API returns 404 for image URLs

**Check:**

1. **Verify static directory exists:**
```bash
docker exec marketplace-backend ls -la /app/.medusa/server/static
```

2. **Check MEDUSA_BACKEND_URL:**
```bash
docker exec marketplace-backend env | grep MEDUSA_BACKEND_URL
# Should be: https://api.vintagevault.gr
```

3. **Verify volume mount:**
```bash
docker inspect marketplace-backend | grep -A 10 Mounts
# Should show static volume mounted
```

4. **Test image URL directly:**
```bash
curl -I https://api.vintagevault.gr/static/test.jpg
# Should return 200 or 404, not connection refused
```

---

### Version Not Incrementing

**Symptom:** VERSION file doesn't update

**Check:**

1. **Git config in workflow:**
```yaml
# Should have:
git config --local user.email "github-actions[bot]@users.noreply.github.com"
git config --local user.name "github-actions[bot]"
```

2. **Branch protection:**
- Go to: Settings → Branches → main
- Ensure "Require status checks to pass" doesn't block GitHub Actions

3. **Manual fix:**
```bash
# Update VERSION manually
cd marketplace-app
echo "1.0.2" > VERSION
git add VERSION
git commit -m "chore: bump version to 1.0.2 [skip ci]"
git push
```

---

## Workflow Not Triggering

### Workflow Doesn't Run on Push

**Check:**

1. **Workflow location:**
```bash
ls -la .github/workflows/
# Must be at repo root, not in marketplace-app/
```

2. **File names are correct:**
```bash
# Should be:
.github/workflows/build-and-push.yml
.github/workflows/deploy.yml
```

3. **Changes in monitored paths:**
```yaml
# build-and-push.yml triggers on:
paths:
  - 'marketplace-app/**'
  - '.github/workflows/build-and-push.yml'
```

If you change files outside these paths, build won't trigger.

4. **Runner is online:**
- Go to: Settings → Actions → Runners
- Should show green "Idle" or "Active"

5. **YAML syntax is valid:**
```bash
# Install yamllint
npm install -g yaml-lint

# Check syntax
yamllint .github/workflows/build-and-push.yml
```

---

## Testing Workflows Locally

### Test Workflow Syntax

```bash
# Using act (GitHub Actions local runner)
# Install: https://github.com/nektos/act

act -n  # Dry run
act -l  # List workflows
```

### Test Individual Steps

```bash
# Test Docker build
cd marketplace-app
docker build \
  --build-arg MEDUSA_BACKEND_URL=https://api.vintagevault.gr \
  --build-arg VITE_BACKEND_URL=https://api.vintagevault.gr \
  -t test .

# Test deployment script
scp deploy.sh user@server:/tmp/
ssh user@server "/tmp/deploy.sh latest"

# Test SSH connection
ssh -i ~/.ssh/deploy_key user@server "docker ps"
```

---

## Performance Issues

### Build Takes Too Long

**Normal build time:** 5-15 minutes

**If longer:**

1. **Check network speed:**
```bash
# Test download speed on runner
curl -o /dev/null https://registry.npmjs.org/express/-/express-4.18.2.tgz
```

2. **Use build cache:**
- First build: 10-15 minutes (no cache)
- Subsequent: 2-5 minutes (with cache)

3. **Check Docker layer reuse:**
```bash
docker history vintagevault-backend:latest
# Should show "CACHED" for unchanged layers
```

---

## Quick Diagnostics

Run this on your runner machine:

```bash
#!/bin/bash
echo "=== Runner Diagnostics ==="

echo -e "\n1. Runner Service Status:"
systemctl status actions.runner.* --no-pager | grep "Active:"

echo -e "\n2. Disk Space:"
df -h | grep -E "Filesystem|/$"

echo -e "\n3. Memory:"
free -h

echo -e "\n4. Docker Status:"
docker ps --format "{{.Names}}: {{.Status}}"

echo -e "\n5. Docker Disk Usage:"
docker system df

echo -e "\n6. Network Connectivity:"
curl -s -o /dev/null -w "GitHub: %{http_code}\n" https://github.com
curl -s -o /dev/null -w "Docker Hub: %{http_code}\n" https://hub.docker.com
curl -s -o /dev/null -w "NPM: %{http_code}\n" https://registry.npmjs.org

echo -e "\n7. SSH to Server:"
ssh -o ConnectTimeout=5 user@server "echo 'SSH: OK'" 2>&1 || echo "SSH: FAILED"

echo -e "\n=== End Diagnostics ==="
```

Save as `diagnose.sh`, run with `chmod +x diagnose.sh && ./diagnose.sh`

---

## Getting Help

If issues persist:

1. **Check runner logs:**
   ```bash
   journalctl -u actions.runner.* -f
   ```

2. **Check GitHub Actions logs:**
   - Go to: Actions → Failed run → View logs
   - Download logs for detailed inspection

3. **Enable debug logging:**
   - Repo Settings → Secrets → Add `ACTIONS_STEP_DEBUG` = `true`
   - Re-run workflow

4. **Common issues checklist:**
   - [ ] Runner is online and has resources
   - [ ] Workflows are in correct location (`.github/workflows/`)
   - [ ] All GitHub variables and secrets are set
   - [ ] SSH key is correct and has access to server
   - [ ] Docker Hub credentials are valid
   - [ ] Network connectivity is working

---

**Last Updated:** 2026-01-05
