# Testing Guide

Comprehensive testing instructions for all fixes and features.

## Table of Contents

1. [Local Testing](#local-testing)
2. [Docker Testing](#docker-testing)
3. [Production Testing](#production-testing)
4. [CI/CD Testing](#cicd-testing)

---

## Local Testing

### Test 1: Auto-Thumbnail Generation (New Products)

**Purpose:** Verify thumbnails are automatically set when creating products with images.

#### Steps:

1. Start your local dev server:
```bash
npm run dev
```

2. Create a test product via admin UI:
   - Navigate to http://localhost:5173
   - Login to admin
   - Create a new product
   - Upload 2-3 images
   - **Don't manually set thumbnail**
   - Save product

3. Verify via API:
```bash
# Get your publishable API key
curl http://localhost:9000/admin/publishable-api-keys \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Check the product
curl -s "http://localhost:9000/store/allproducts?limit=1" \
  -H "x-publishable-api-key: YOUR_KEY" | jq '.products[0] | {title, thumbnail, images: .images | length}'
```

**Expected Result:**
```json
{
  "title": "Your Product Name",
  "thumbnail": "http://localhost:9000/static/1234567890-image.jpg",
  "images": 3
}
```

**✓ Pass:** `thumbnail` is not null and matches first image URL
**✗ Fail:** `thumbnail` is null

---

### Test 2: Fix Existing Products Script

**Purpose:** Verify the script fixes thumbnails on products that don't have them.

#### Steps:

1. Create a product **without images** or manually set thumbnail to null in DB:
```bash
# Using psql or your DB tool
UPDATE product SET thumbnail = NULL WHERE id = 'prod_XXXXX';
```

2. Verify it's null:
```bash
curl -s "http://localhost:9000/store/products/prod_XXXXX" \
  -H "x-publishable-api-key: YOUR_KEY" | jq '.product.thumbnail'

# Should return: null
```

3. Run the fix script:
```bash
npx medusa exec ./src/scripts/fix-thumbnails.ts
```

4. Check the output:
```
Found 50 products to check
✓ Product "Test Product" already has thumbnail - skipping
→ Setting thumbnail for "Another Product" (prod_XXXXX)
✓ Thumbnail set to: http://localhost:9000/static/1234567890-image.jpg
...
=== Summary ===
Total products: 50
Fixed: 10
Skipped: 40
Errors: 0
```

5. Verify the fix:
```bash
curl -s "http://localhost:9000/store/products/prod_XXXXX" \
  -H "x-publishable-api-key: YOUR_KEY" | jq '.product.thumbnail'

# Should return: "http://localhost:9000/static/XXXXX.jpg"
```

**✓ Pass:** Script fixes products and reports correct summary
**✗ Fail:** Script errors or doesn't update thumbnails

---

### Test 3: Image Upload and Storage

**Purpose:** Verify images are saved correctly to the static directory.

#### Steps:

1. Check your static directory before upload:
```bash
ls -la static/
```

2. Upload a product image via admin:
   - Go to admin UI
   - Edit/create a product
   - Upload an image (any format: jpg, png, etc.)
   - Save

3. Check static directory again:
```bash
ls -la static/
# Should show a new file like: 1234567890-yourimage.jpg
```

4. Access the image via URL:
```bash
# Get the image URL from the product
IMAGE_URL=$(curl -s "http://localhost:9000/store/allproducts?limit=1" \
  -H "x-publishable-api-key: YOUR_KEY" | jq -r '.products[0].images[0].url')

echo "Image URL: $IMAGE_URL"

# Download it
curl -I "$IMAGE_URL"

# Should return: HTTP/1.1 200 OK
```

**✓ Pass:** 
- File exists in static/
- Accessible via URL
- Correct content-type header

**✗ Fail:** 
- File not saved
- 404 error
- Wrong URL format

---

## Docker Testing

### Test 4: Docker Build with Correct Paths

**Purpose:** Verify Docker image builds and uses correct static file paths.

#### Steps:

1. Build the Docker image:
```bash
docker build \
  --build-arg MEDUSA_BACKEND_URL=http://localhost:9000 \
  --build-arg VITE_BACKEND_URL=http://localhost:9000 \
  -t marketplace-test:local \
  .
```

2. Check build output for errors (should complete successfully)

3. Run the container:
```bash
docker run -d \
  --name marketplace-test \
  -p 9001:9000 \
  -e DATABASE_URL="postgres://user:pass@host.docker.internal:5432/marketplace" \
  -e MEDUSA_BACKEND_URL="http://localhost:9001" \
  -e JWT_SECRET="test-secret" \
  -e COOKIE_SECRET="test-secret" \
  -v $(pwd)/docker-test-static:/app/.medusa/server/static \
  marketplace-test:local
```

4. Check logs:
```bash
docker logs marketplace-test

# Look for:
# ✓ "Starting Medusa server..."
# ✓ "Static files directory: /app/.medusa/server/static"
# ✓ No path errors
```

5. Verify static directory is created:
```bash
docker exec marketplace-test ls -la /app/.medusa/server/static
# Should show directory exists
```

6. Test file upload:
   - Upload a product image via admin (connecting to port 9001)
   - Check if file appears in mounted volume:
```bash
ls -la docker-test-static/
# Should show the uploaded file
```

7. Cleanup:
```bash
docker stop marketplace-test
docker rm marketplace-test
rm -rf docker-test-static/
```

**✓ Pass:** 
- Build succeeds
- Container starts without errors
- Static directory is at /app/.medusa/server/static
- Files persist to mounted volume

**✗ Fail:**
- Build fails
- Path errors in logs
- Files not saved or wrong location

---

### Test 5: Environment Variables in Docker

**Purpose:** Verify all environment variables are correctly passed and used.

#### Steps:

1. Run container with test env vars:
```bash
docker run -d \
  --name marketplace-env-test \
  -e MEDUSA_BACKEND_URL="https://test.example.com" \
  -e DATABASE_URL="postgres://test:test@localhost:5432/test" \
  marketplace-test:local
```

2. Check environment variables inside container:
```bash
docker exec marketplace-env-test env | grep -E "MEDUSA_BACKEND_URL|DATABASE_URL|NODE_ENV"
```

**Expected Output:**
```
MEDUSA_BACKEND_URL=https://test.example.com
DATABASE_URL=postgres://test:test@localhost:5432/test
NODE_ENV=production
```

3. Verify backend URL is used for file URLs:
```bash
# Check the config inside container
docker exec marketplace-env-test cat /app/.medusa/server/medusa-config.js | grep backend_url
```

4. Cleanup:
```bash
docker stop marketplace-env-test
docker rm marketplace-env-test
```

**✓ Pass:** All env vars are set and used correctly
**✗ Fail:** Missing or incorrect env vars

---

## Production Testing

### Test 6: Production Deployment (End-to-End)

**Purpose:** Verify complete deployment flow works in production.

#### Prerequisites:
- GitHub repo configured
- Server set up
- CI/CD pipeline configured

#### Steps:

1. Make a small change and push:
```bash
# Make a trivial change
echo "# Test deployment" >> README.md

git add README.md
git commit -m "test: verify deployment pipeline"
git push origin main
```

2. Watch GitHub Actions:
```bash
# Via CLI
gh run watch

# Or go to: https://github.com/YOUR_REPO/actions
```

3. Verify build completes:
   - ✓ Version incremented
   - ✓ Docker image built
   - ✓ Image pushed to Docker Hub
   - ✓ Deployment triggered

4. SSH to server and check:
```bash
ssh user@your-server

# Check running containers
docker ps | grep marketplace

# Check logs
docker logs marketplace-backend --tail 50

# Check version
docker inspect marketplace-backend | grep Image
```

5. Test API endpoints:
```bash
# Health check
curl -f https://api.vintagevault.gr/health

# Products endpoint
curl -s "https://api.vintagevault.gr/store/allproducts?limit=2" \
  -H "x-publishable-api-key: YOUR_KEY" | jq '.products[] | {title, thumbnail}'
```

6. Test image upload in production:
   - Go to admin UI: https://admin.vintagevault.gr
   - Create a product with images
   - Verify thumbnail is set via API

**✓ Pass:** 
- Build and deploy complete successfully
- Container running on server
- API responding
- Images working

**✗ Fail:** 
- Build fails
- Deployment fails
- API not responding
- Images not loading

---

### Test 7: Static Files Persistence

**Purpose:** Verify static files persist across container restarts.

#### Steps:

1. Upload a test image via admin UI

2. Get the image URL:
```bash
IMAGE_URL=$(curl -s "https://api.vintagevault.gr/store/allproducts?limit=1" \
  -H "x-publishable-api-key: YOUR_KEY" | jq -r '.products[0].images[0].url')

echo "Image URL: $IMAGE_URL"
```

3. Verify image loads:
```bash
curl -I "$IMAGE_URL"
# Should return: 200 OK
```

4. Restart the container:
```bash
ssh user@your-server
docker restart marketplace-backend
```

5. Wait for container to restart (check logs):
```bash
docker logs -f marketplace-backend
```

6. Verify image still loads:
```bash
curl -I "$IMAGE_URL"
# Should still return: 200 OK
```

7. Check volume:
```bash
docker volume ls | grep marketplace
docker volume inspect marketplace_static-files
```

**✓ Pass:** 
- Image loads before restart
- Image still loads after restart
- Volume persists data

**✗ Fail:**
- Image returns 404 after restart
- Volume not created
- Data not persisted

---

### Test 8: Thumbnails in Production

**Purpose:** Verify thumbnails work correctly in production environment.

#### Steps:

1. Check existing products:
```bash
curl -s "https://api.vintagevault.gr/store/allproducts?limit=10" \
  -H "x-publishable-api-key: YOUR_KEY" | \
  jq '.products[] | {title, thumbnail, has_images: (.images | length > 0)}'
```

**Expected:** Products with images should have thumbnails set

2. If thumbnails are null, run fix script:
```bash
ssh user@your-server
docker exec -it marketplace-backend npx medusa exec ./src/scripts/fix-thumbnails.ts
```

3. Verify thumbnails are fixed:
```bash
curl -s "https://api.vintagevault.gr/store/allproducts?limit=5" \
  -H "x-publishable-api-key: YOUR_KEY" | \
  jq '.products[] | select(.thumbnail == null) | {title, id}'
```

**Expected:** No products returned (all have thumbnails)

4. Create a new product via admin:
   - Login to admin UI
   - Create product with images
   - Don't set thumbnail manually
   - Save

5. Check via API immediately:
```bash
curl -s "https://api.vintagevault.gr/store/allproducts?limit=1" \
  -H "x-publishable-api-key: YOUR_KEY" | \
  jq '.products[0].thumbnail'
```

**Expected:** Thumbnail is automatically set

**✓ Pass:**
- Fix script works in production
- New products auto-set thumbnails
- All products have thumbnails

**✗ Fail:**
- Thumbnails still null
- Auto-set not working
- Script errors

---

## CI/CD Testing

### Test 9: Version Management

**Purpose:** Verify semantic versioning works correctly.

#### Test Auto-Increment:

1. Check current version:
```bash
cat VERSION
# Shows: 1.0.0
```

2. Push to main:
```bash
git commit --allow-empty -m "test: version bump"
git push origin main
```

3. Wait for workflow to complete

4. Check new version:
```bash
git pull
cat VERSION
# Should show: 1.0.1
```

5. Check GitHub releases:
```bash
gh release list
# Should show: v1.0.1
```

6. Verify Docker Hub has new tag:
   - Go to: https://hub.docker.com/r/YOUR_USERNAME/marketplace-backend/tags
   - Should see: v1.0.1 and latest

**✓ Pass:** Version increments automatically
**✗ Fail:** Version doesn't change or workflow fails

#### Test Manual Override:

1. Trigger workflow with custom version:
```bash
gh workflow run build-and-push.yml -f version=2.0.0
```

2. Wait for completion

3. Check VERSION file:
```bash
cat VERSION
# Should show: 2.0.0 (not auto-incremented)
```

4. Next auto-increment should continue from 2.0.0:
```bash
git commit --allow-empty -m "test: next version"
git push
# Should create 2.0.1
```

**✓ Pass:** Manual version override works
**✗ Fail:** Version not set correctly

---

### Test 10: Rollback Procedure

**Purpose:** Verify you can rollback to a previous version.

#### Steps:

1. Note current version running:
```bash
ssh user@your-server
docker inspect marketplace-backend | grep -A 5 Config | grep Image
```

2. Deploy an older version:
```bash
# On server
cd /opt/marketplace
./deploy.sh v1.0.5
```

3. Verify old version is running:
```bash
docker ps | grep marketplace
docker inspect marketplace-backend | grep Image
# Should show: v1.0.5
```

4. Test application still works:
```bash
curl https://api.vintagevault.gr/health
```

5. Deploy back to latest:
```bash
./deploy.sh latest
```

**✓ Pass:** Can rollback and app works
**✗ Fail:** Rollback fails or app broken

---

## Automated Test Suite

You can create a script to run all tests:

```bash
#!/bin/bash
# test-all.sh

echo "=== Running All Tests ==="

echo "Test 1: Auto-Thumbnail Generation"
# Test 1 commands...

echo "Test 2: Fix Script"
# Test 2 commands...

# ... etc

echo "=== All Tests Complete ==="
```

---

## Test Checklist

Before deploying to production, ensure:

- [ ] Test 1: Auto-thumbnails work locally
- [ ] Test 2: Fix script works locally
- [ ] Test 3: Images upload and save correctly
- [ ] Test 4: Docker build succeeds
- [ ] Test 5: Environment variables work in Docker
- [ ] Test 6: End-to-end deployment works
- [ ] Test 7: Static files persist across restarts
- [ ] Test 8: Thumbnails work in production
- [ ] Test 9: Version management works
- [ ] Test 10: Rollback procedure works

---

## Continuous Testing

After initial setup, run these tests regularly:

**Weekly:**
- Test 6: Deploy a small change
- Test 7: Verify file persistence
- Test 8: Check thumbnails on new products

**Monthly:**
- Test 10: Practice rollback procedure
- Review logs for errors
- Check disk usage for static files

**After Major Changes:**
- Run all tests
- Test in staging environment first
- Monitor production closely after deploy

---

## Reporting Issues

If tests fail:

1. Check logs: `docker logs marketplace-backend`
2. Check GitHub Actions logs
3. Verify environment variables
4. Check server resources
5. Review recent code changes

Document:
- Which test failed
- Error messages
- Steps to reproduce
- Environment (local/Docker/production)

---

**Testing Time:** ~60 minutes for full suite
**Critical Tests:** 1, 2, 6, 8 (run before every deploy)
