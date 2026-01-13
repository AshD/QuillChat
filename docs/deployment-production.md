# Production Deployment Guide

This document outlines production deployment options for QuillChat (SvelteKit + Vite). It covers common targets such as Vercel, GitHub Pages, Azure Static Web Apps, and AWS.

## Prerequisites

- Node.js 18+ (or the version your organization standardizes on).
- A clean install and build:
  - `npm ci`
  - `npm run build`

## Configuration Notes

QuillChat uses `@sveltejs/adapter-auto`, which selects the deployment adapter based on the target platform. For **static** hosts (GitHub Pages, S3, Azure Static Web Apps), you will typically want to switch to `@sveltejs/adapter-static` and export a fully static site. For **serverless** platforms (Vercel), `adapter-auto` works out of the box.

### Static export (recommended for purely static hosts)

1. Install the static adapter:
   - `npm install --save-dev @sveltejs/adapter-static`
2. Update `svelte.config.js` to use the static adapter.
3. Rebuild with `npm run build`.

> If your app requires server-side rendering (SSR) or API endpoints, use a platform that supports SSR (e.g., Vercel). Pure static hosts will not run server code.

## Deployments

### Vercel (SSR or static)

**Recommended for SvelteKit SSR**.

1. Connect the repository in Vercel.
2. Configure build settings:
   - **Install Command:** `npm ci`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.svelte-kit` (Vercel will detect this automatically for SvelteKit).
3. Deploy.

**Environment variables:** set in Vercel Project Settings → Environment Variables.

### GitHub Pages (static only)

**Static export required.**

1. Switch to `@sveltejs/adapter-static` (see Static export above).
2. Configure `paths.base` in `svelte.config.js` if deploying to a subpath (e.g., `/quillchat`).
3. Build the site:
   - `npm run build`
4. Publish the build output to GitHub Pages using a GitHub Action (example):

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: build

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/deploy-pages@v4
```

### Azure Static Web Apps (static only)

**Static export required.**

1. Switch to `@sveltejs/adapter-static` (see Static export above).
2. In Azure Portal, create a Static Web App and connect it to the repository.
3. Configure build settings:
   - **App location:** `/`
   - **Output location:** `build`
   - **Build command:** `npm run build`
4. Deploy.

**Environment variables:** set in Azure Static Web Apps → Configuration.

### AWS (S3 + CloudFront for static hosting)

**Static export required.**

1. Switch to `@sveltejs/adapter-static` (see Static export above).
2. Build the site:
   - `npm run build`
3. Create an S3 bucket and enable static website hosting.
4. Upload the `build/` directory contents to S3.
5. Create a CloudFront distribution with the S3 bucket as the origin.
6. (Optional) Configure a custom domain with Route 53 and ACM certificates.

**Cache settings:** For static assets, set long cache lifetimes; for `index.html`, consider shorter TTLs to allow faster rollouts.

## Validation Checklist

- ✅ `npm run build` succeeds locally.
- ✅ Asset paths resolve correctly (especially when deployed under a subpath).
- ✅ Environment variables are set in the hosting provider.
- ✅ Custom domain and HTTPS configured (if applicable).
