# Vercel + Supabase Deployment

This project is now configured for a Vercel-hosted Laravel application with Supabase PostgreSQL.

## What changed

- `vercel.json` routes all application requests to a PHP serverless entrypoint and serves Vite assets from `public/build`.
- `api/index.php` boots Laravel from Vercel's PHP runtime.
- PostgreSQL config now supports `DATABASE_URL`, Supabase SSL, configurable schema, and emulated prepares for pooled serverless connections.
- Billing PDF persistence now uses `BILLING_FILESYSTEM_DISK` instead of always writing to the local `public` disk.

## Vercel environment variables

Set these in the Vercel project settings:

```env
APP_NAME=Emerald STMS
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-project.vercel.app
APP_KEY=base64:generate-this-with-php-artisan-key-generate-show

LOG_CHANNEL=stderr
LOG_STACK=stderr
LOG_LEVEL=info

DB_CONNECTION=pgsql
DB_HOST=aws-0-your-region.pooler.supabase.com
DB_PORT=6543
DB_DATABASE=postgres
DB_USERNAME=postgres.your-project-ref
DB_PASSWORD=your-supabase-password
DB_SEARCH_PATH=public
DB_SSLMODE=require
DB_EMULATE_PREPARES=true

SESSION_DRIVER=cookie
SESSION_SECURE_COOKIE=true
QUEUE_CONNECTION=sync
CACHE_STORE=database
```

If you prefer a single connection string, set `DB_URL` or `DATABASE_URL` instead of the individual `DB_*` host fields.

## Supabase connection choice

Use the Supabase transaction pooler connection on port `6543` for Vercel runtime traffic. That matches serverless request patterns better than a direct database connection.

For one-off admin tasks such as local migrations, you can use either:

- the same pooled connection, or
- the direct connection from Supabase if your environment supports IPv6.

## Database migrations

Do not run migrations automatically from Vercel build output. Run them from CI or from a trusted machine:

```bash
php artisan migrate --force
```

## Persistent file storage

Vercel does not provide persistent local disk storage. This app still streams generated billing PDFs to the browser, but archival copies only persist if you configure object storage.

Set these variables if you want billing PDFs saved durably:

```env
BILLING_FILESYSTEM_DISK=s3
FILESYSTEM_CLOUD=s3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=
AWS_BUCKET=
AWS_URL=
AWS_ENDPOINT=
AWS_USE_PATH_STYLE_ENDPOINT=false
```

## Known operational limits on Vercel

- `QUEUE_CONNECTION=sync` is intentional. Vercel does not run a long-lived Laravel queue worker.
- Large CSV or Excel imports may hit request body or execution time limits and may need to move to a background workflow later.
- Legacy tutorial schedule fallback files stored on local disk will not exist on Vercel. The app already prefers the `tutorial_schedule` database column, which is the durable path.