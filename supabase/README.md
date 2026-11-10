# Supabase Migrations & Database Setup

This directory contains the database schema migrations and seed scripts for the application.

## Applying Migrations

You can apply the migrations to your Supabase project in one of two ways:

### Option 1: Supabase Cloud SQL Editor (Recommended for initial setup)

1. Open your Supabase Dashboard: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project and navigate to **SQL Editor** in the left sidebar.
3. Open `migrations/20261110000001_auth_whitelist.sql`, copy its entire contents, paste them into the SQL editor, and click **Run**. (The migration is idempotent and safe to re-run).
4. Open `seed_admin.sql.example`, replace `admin@example.com` with your actual Google account email, and run it in the SQL editor to add yourself to the whitelist as an admin.

### Option 2: Supabase CLI

If you have the Supabase CLI installed and authenticated:

```bash
# Link to your remote project (replace <project-ref> with your Supabase reference)
supabase link --project-ref <project-ref>

# Push migrations to the remote database
supabase db push
```

Then seed the initial admin email via the SQL Editor or:

```bash
# Execute seed statement with your email substituted
sed "s/admin@example.com/your-email@gmail.com/" supabase/seed_admin.sql.example | supabase db query
```

## Google OAuth Configuration

In Google Cloud Console:
- Configure Authorized Redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`

In Supabase Dashboard (**Authentication** -> **URL Configuration**):
- **Site URL**: `https://ivan-account.pages.dev` (or `http://localhost:5173` for local dev)
- **Redirect URLs**:
  - `https://ivan-account.pages.dev/**`
  - `https://*.ivan-account.pages.dev/**` (for Cloudflare Pages preview deployments)
  - `http://localhost:5173/**`
