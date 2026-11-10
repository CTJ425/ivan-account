# ivan-account

A lightweight, mobile-first personal and family expense tracking web application built with Rust and Leptos (CSR), compiled to WebAssembly via Trunk and hosted on Cloudflare Pages.

This repository currently implements **Milestone M0 (Project Skeleton)**.

## Prerequisites

1. **Rust Toolchain**: Rust 1.88+ (installed via `rustup`)
2. **WASM Target**:
   ```bash
   rustup target add wasm32-unknown-unknown
   ```
3. **Trunk**:
   ```bash
   # Binary installation (recommended)
   curl -L -s https://github.com/trunk-rs/trunk/releases/download/v0.22.1/trunk-x86_64-unknown-linux-gnu.tar.gz | tar -xz -C ~/.cargo/bin
   ```
4. **wasm-opt** (Binaryen):
   Required for optimizing WASM binary size in release builds:
   ```bash
   curl -L -s https://github.com/WebAssembly/binaryen/releases/download/version_131/binaryen-version_131-x86_64-linux.tar.gz | tar -xz --strip-components=2 -C ~/.cargo/bin binaryen-version_131/bin/wasm-opt
   ```

## Local Development

Start the local development server with live reload:

```bash
trunk serve
```

Open your browser at `http://127.0.0.1:8080`.

## Production Build

Build the optimized release artifacts:

```bash
trunk build --release
```

The output artifacts will be placed in the `dist/` directory:
- Compiled WebAssembly binary (`.wasm`) optimized with `opt-level = "z"`, LTO, single codegen unit, and `wasm-opt`
- Generated JS loader and HTML entry point
- Bundled stylesheet (`style.css`)
- SPA fallback rewrite configuration (`_redirects` for Cloudflare Pages)

## Deployment

Continuous deployment is configured via GitHub Actions (`.github/workflows/deploy.yml`). On pushes to `main`, the workflow:
1. Sets up the Rust toolchain and cargo caching
2. Builds the release bundle using Trunk
3. Generates SPA fallbacks (`_redirects` and `404.html`)
4. Deploys `dist/` to Cloudflare Pages using `wrangler pages deploy` with secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
