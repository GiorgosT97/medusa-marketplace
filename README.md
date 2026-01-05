# Medusa2 Marketplace demo

This is a demo project which demoes how to create a multivendor marketplace demo using [Medusa 2.0](https://medusajs.com/)

> [!NOTE]
**UPD**: all the multivendor marketplace  related code was moved to [medusa-marketplace-plugin](https://github.com/Tech-Labi/medusa-marketplace-plugin), so the demo app now uses this plugin (read Part 4 below).

A four-part series articles on Medium:

- 🛠 [**Part 1**](https://medium.com/@igorkhomenko/building-a-multivendor-marketplace-with-medusa-js-2-0-a-dev-guide-f55aec971126): setting up the multi-vendor structure and understanding how to manage multiple sellers on a single Medusa instance
- 🧑‍💼 [**Part 2**](https://medium.com/@igorkhomenko/building-a-multivendor-marketplace-with-medusa-js-2-0-super-admin-d899353b0b1e): building a powerful Super Admin layer to oversee vendors, products, orders, and more
- 🎨 [**Part 3**](https://medium.com/@igorkhomenko/building-a-multivendor-marketplace-with-medusa-js-2-0-dashboard-customization-part-3-6ce584b8c1c1): customizing the Medusa Admin Dashboard to give super admins and vendors a clean, user-friendly experience
- 🎨 [**Part 4**](https://medium.com/@igorkhomenko/building-a-multivendor-marketplace-with-medusa-js-2-0-medusa-plugin-part-4-a4c7ac08f2d4): bring it all together - packaging everything into a Medusa 2 plugin 

![1_EMHanavMVUIrwCw4_ROoiw](https://github.com/user-attachments/assets/c2cee973-7704-4843-8da4-8c5e877cdc8e)


## How to run 

### Option 1: All in one

If you want to run both PostgreSQL and Medusa in one command, use the following command that combines both the main `docker-compose.yml` file and the `docker-compose.medusa.yml` file:

```bash
docker compose -f docker-compose.yml -f docker-compose.medusa.yml up --build
```
This command will build and start both PostgreSQL and Medusa containers.

**Important:** You can only run this command after `PostgreSQL` has already been started using the docker compose up command from Option 2 (below). This is because PostgreSQL creates a network that Medusa depends on to run properly.

### Option 2: run Medusa app manually

1. Run PostgreSQL

By default, running the following command will start only the `PostgreSQL` container:

```
docker compose up
```

This command will use your default docker-compose.yml file to start the `PostgreSQL` service, but `Medusa` will not be started automatically. This step is required because we create a network in `PostgreSQL`, and `Medusa` depends on it.

2. Run Medusa app manually

```bash
cd medusa-marketplace-demo
yarn
cp .env.template .env
npx medusa db:setup --db marketplace
npx medusa db:migrate
yarn dev
```

The Medusa dashboard should now be running on http://localhost:9000/app

## Cleanup resources

If you want to remove the containers, networks, and volumes created by Docker Compose, use the following commands:

Option 1: Using the default `docker-compose.yml` (for PostgreSQL only)

```bash
docker compose down -v
```

Option 2: Using the combined `docker-compose.yml` and `docker-compose.medusa.yml`

```bash
docker compose -f docker-compose.yml -f docker-compose.medusa.yml down -v
```

## 🚀 CI/CD Pipeline & Deployment

This repository includes a complete CI/CD pipeline for automated deployment to production.

### Quick Links

- 📖 [Quick Start Guide](./marketplace-app/QUICKSTART.md) - Get deployed in 30 minutes
- 📚 [Full Deployment Guide](./marketplace-app/DEPLOYMENT.md) - Comprehensive documentation
- 🧪 [Testing Guide](./marketplace-app/TESTING.md) - Test procedures
- 📋 [Quick Reference](./marketplace-app/QUICK_REFERENCE.md) - Command cheat sheet
- 📝 [Changes Summary](./marketplace-app/CHANGES_SUMMARY.md) - What's new

### Features

- ✅ **Auto Thumbnails**: Product thumbnails automatically set from first image
- ✅ **CI/CD Pipeline**: Automated build, push, and deployment
- ✅ **Semantic Versioning**: Auto-increment or manual version control
- ✅ **One-Push Deploy**: Push to main → automatic deployment
- ✅ **Easy Rollback**: Deploy any previous version instantly
- ✅ **Docker Optimized**: Persistent storage for uploaded images

### GitHub Actions Workflows

Located in `.github/workflows/`:

1. **build-and-push.yml** - Builds Docker image and pushes to Docker Hub
   - Triggers on push to main (when marketplace-app changes)
   - Auto-increments version (1.0.0 → 1.0.1)
   - Creates GitHub releases
   
2. **deploy.yml** - Deploys to production server
   - Triggers after successful build
   - Can deploy specific versions manually
   - Includes health checks

### Project Structure

```
medusa-marketplace/
├── .github/
│   └── workflows/           # CI/CD pipelines (repo root)
│       ├── build-and-push.yml
│       └── deploy.yml
├── marketplace-app/         # Main Medusa application
│   ├── src/
│   │   ├── workflows/hooks/
│   │   │   └── product-created.ts    # Auto-thumbnail logic
│   │   └── scripts/
│   │       └── fix-thumbnails.ts     # Fix existing products
│   ├── VERSION              # Semantic version tracking
│   ├── Dockerfile           # Production Docker image
│   ├── deploy.sh            # Server deployment script
│   ├── docker-compose.production.yml
│   ├── QUICKSTART.md        # 30-min setup guide
│   ├── DEPLOYMENT.md        # Full documentation
│   ├── TESTING.md           # Test procedures
│   └── QUICK_REFERENCE.md   # Command reference
└── docker-compose.yml       # Local development
```

### Getting Started with CI/CD

1. **Read the Quick Start**: Follow [QUICKSTART.md](./marketplace-app/QUICKSTART.md)
2. **Configure GitHub**: Add secrets and variables (see guide)
3. **Setup Server**: Prepare your deployment server
4. **Push to Main**: Everything deploys automatically!

### Version Management

Current version: See [marketplace-app/VERSION](./marketplace-app/VERSION)

- **Auto-increment**: Every push bumps patch version
- **Manual override**: Use workflow dispatch to set custom version
- **Tags**: Each version gets Git tag and Docker tag

## License

MIT
