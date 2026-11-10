# ivan-account

A lightweight, mobile-first personal and family expense tracking web application built with React, TypeScript, and Vite, hosted on Cloudflare Pages.

This repository implements **Milestone M0 (Project Skeleton)**.

## Prerequisites

- Node.js 22+ (see `.nvmrc`)
- npm 10+

## Local Development

Install dependencies and start the local development server:

```bash
npm install
npm run dev
```

Open your browser at the URL shown in the terminal (typically `http://localhost:5173`).

### Quality Checks & Build

```bash
# Run linter
npm run lint

# Run type check
npm run typecheck

# Production build
npm run build

# Preview production build locally
npm run preview
```

## Production Build & Output

Running `npm run build` generates the compiled client-side single-page application into the `dist/` directory:
- Optimized JavaScript and CSS bundles with route-level code splitting
- `index.html` entry point
- `_redirects` copied from `public/_redirects` to handle client-side routing fallback on Cloudflare Pages

## Cloudflare Pages Deployment

Deployments are managed automatically via Cloudflare Pages Git integration:
- **Framework preset**: `None` (or `Vite`)
- **Build command**: `npm run build`
- **Build output directory**: `dist`

Cloudflare Pages automatically picks the Node.js version from `.nvmrc`.

GitHub Actions (`.github/workflows/ci.yml`) runs CI checks (`npm run lint` and `npm run build`) on every push to `main` and pull requests.
