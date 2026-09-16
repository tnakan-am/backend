# Tnakan — Backend API

NestJS + TypeORM + PostgreSQL API for the Tnakan marketplace: authentication (JWT, email
verification, password reset), products and categories, orders, reviews, real-time
notifications (Socket.IO), and image uploads.

- Backend repo: https://github.com/tnakan-am/backend
- Frontend repo (Angular): https://github.com/tnakan-am/tnakan

> **Never commit secrets.** This repository is public. Connection strings, `JWT_SECRET` and SMTP
> passwords live only in the Render dashboard (production) and in your local, git-ignored `.env`.

## Environments

| Environment | API | Database | Frontend | Status |
| --- | --- | --- | --- | --- |
| **Production** | https://backend-20ts.onrender.com | Neon Postgres (Frankfurt) | https://tnakan-23490.web.app | ✅ Live |
| **PR previews** (frontend only) | uses the production API | uses the production DB | `https://tnakan-23490--<channel>.web.app` | ✅ Created per frontend PR |
| **Local** | http://localhost:3000 | Postgres in Docker, `localhost:5433` | http://localhost:4200 | Run on your machine |
| Fly.io dev / staging / prod | `homemade-dev.fly.dev`, `homemade-staging.fly.dev`, `homemade-prod.fly.dev` | — | — | ⚠️ Configured, not provisioned |

Health check for any running API: `GET /health` → `{"status":"ok"}`
(e.g. https://backend-20ts.onrender.com/health).

### Production

| Piece | Where | Links |
| --- | --- | --- |
| API server | Render free web service, Docker, Frankfurt. Auto-deploys on every push to `main`. | [Service](https://dashboard.render.com/web/srv-d92d4028qa3s73d715sg) · [Environment](https://dashboard.render.com/web/srv-d92d4028qa3s73d715sg/env) · [Logs](https://dashboard.render.com/web/srv-d92d4028qa3s73d715sg/logs) · [Events](https://dashboard.render.com/web/srv-d92d4028qa3s73d715sg/events) |
| PostgreSQL | Neon free tier, Frankfurt. Project `round-block-43985229`, branch `production`, database `neondb`. | [Project](https://console.neon.tech/app/projects/round-block-43985229) · [SQL Editor](https://console.neon.tech/app/projects/round-block-43985229/branches/br-polished-meadow-as5pd869/sql-editor?database=neondb) |
| Frontend | Firebase Hosting, project `tnakan-23490`. Also served at https://tnakan-23490.firebaseapp.com. | [Firebase Hosting console](https://console.firebase.google.com/project/tnakan-23490/hosting/sites) |
| CI | GitHub Actions | [Backend Actions](https://github.com/tnakan-am/backend/actions) · [Frontend Actions](https://github.com/tnakan-am/tnakan/actions) |
| Docker image | Built by CI and pushed on `main`, `develop` and `v*` tags | `ghcr.io/tnakan-am/backend` |

The database connection string (pooled, `sslmode=require`) is available in the Neon console
under **Connect**, and is set on Render as `DATABASE_URL`.

**Render environment variables** (names only — values are in the Render dashboard):

| Variable | Value / purpose |
| --- | --- |
| `NODE_ENV` | `production` — migrations run automatically on boot; `synchronize` is off |
| `DATABASE_URL` | Neon pooled connection string |
| `DB_SSL` | `true` (Neon requires TLS; its certificate is valid, so leave `DB_SSL_INSECURE` unset) |
| `JWT_SECRET` | Strong random secret. The app refuses to start without one outside `development`. |
| `CORS_ORIGIN` | `http://localhost:4200,https://tnakan-23490.web.app,https://tnakan-23490.firebaseapp.com,https://tnakan-23490--*.web.app` |
| `FRONTEND_URL` | `https://tnakan-23490.web.app` — base for links in verification and reset emails |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Outgoing email. Without them, emails are not sent (registration still succeeds). |

`CORS_ORIGIN` is a comma-separated list. An entry containing `*` is treated as a pattern where `*`
matches within one DNS label — that is how every Firebase PR preview channel is allowed with a
single entry.

**Free-tier behaviour to keep in mind**

- The Render instance sleeps after ~15 minutes without traffic; the next request takes about a minute.
- Neon suspends compute after 5 minutes idle; the first query after that is slightly slower.
- Render's free disk is ephemeral: files in `uploads/` are lost on every redeploy or restart.

### PR previews (frontend)

Every pull request in the frontend repo gets a Firebase preview channel at
`https://tnakan-23490--<channel>.web.app`. Previews call the **production** API and database, so
anything you create there is real data.

### Local

- API: http://localhost:3000
- PostgreSQL (Docker): `localhost:5433`, user `postgres`, database `homemade` (password from your `.env`)
- Frontend (`ng serve` in the frontend repo): http://localhost:4200

> The frontend dev server proxies `/api`, `/socket.io` and `/uploads` to the **production** API
> (see `proxy.conf.json` in the frontend repo). To develop against your local API, change the proxy
> targets to `http://localhost:3000`.

### Fly.io (not provisioned)

`fly.dev.toml`, `fly.staging.toml`, `fly.prod.toml` and the `deploy-dev`, `deploy-staging` and
`deploy-prod` workflows target the Fly apps `homemade-dev`, `homemade-staging` and `homemade-prod`.
Those apps are not running, so the **Deploy (staging)** workflow fails after each push to `main`.
Production does not depend on them.

| Workflow | Trigger | Target |
| --- | --- | --- |
| Deploy (dev) | CI success on `develop` | `homemade-dev.fly.dev` |
| Deploy (staging) | CI success on `main` | `homemade-staging.fly.dev` |
| Deploy (prod) | tag `v*.*.*` | `homemade-prod.fly.dev` |

## Local development

Requirements: Node.js 20 (see `.nvmrc`) and Docker.

```bash
npm install
cp .env.example .env          # then fill in JWT_SECRET (and SMTP if you need emails)
docker compose up -d postgres # PostgreSQL on localhost:5433
npm run start:dev             # API on http://localhost:3000
```

In development (`NODE_ENV=development`) TypeORM synchronizes the schema from the entities. In every
other environment the schema comes only from migrations.

To run the whole stack in Docker (API + database): `docker compose up`.

### Database

```bash
npm run build                 # migrations are loaded from dist/migrations
npm run migration:run         # apply pending migrations
npm run seed:categories       # seed the category tree
npm run db:reset              # drop and recreate the public schema of the DB in your DB_* settings

# create a new migration from entity changes
npx typeorm migration:generate -d dist/data-source.js src/migrations/MigrationName
```

> **Do not put the production `DATABASE_URL` in your local `.env`.** `DATABASE_URL` takes
> precedence over the `DB_*` variables, and with `NODE_ENV=development` the app synchronizes the
> schema against whatever database it is connected to. Use the Neon SQL Editor for production
> queries instead.

### Email

`.env.example` points SMTP at [Ethereal](https://ethereal.email), a fake inbox. Run
`node create-ethereal-account.js`, copy the printed `SMTP_*` values into `.env`, and sent messages
become viewable on ethereal.email.

New users stay unverified until they open the link (`GET /auth/verify-email?token=...`). To skip
that locally, mark users verified directly:

```bash
npx ts-node src/seeds/dev-verify.ts                    # verify all users
npx ts-node src/seeds/dev-verify.ts you@example.com admin  # verify one user and set its type
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run start:dev` | Start with file watching |
| `npm run start:debug` | Start with debugger and watching |
| `npm run build` | Compile to `dist/` |
| `npm run start:prod` | Run the compiled app (`node dist/main`) |
| `npm run lint` | ESLint with auto-fix |
| `npm run format` | Prettier |
| `npm run test` | Unit tests |
| `npm run test:e2e` | End-to-end tests |
| `npm run test:cov` | Unit tests with coverage |
| `npm run migration:run` | Apply migrations (run `npm run build` first) |
| `npm run seed:categories` | Seed categories |
| `npm run db:reset` | Reset the local schema |

## CI

`.github/workflows/ci.yml` runs on every push and pull request: ESLint and Prettier, type check,
unit and e2e tests, a migration check against a fresh PostgreSQL (migrations must apply cleanly
and re-run as a no-op), a dependency audit, and a Docker build with a Trivy scan. On `main`,
`develop` and `v*` tags it pushes the image to `ghcr.io/tnakan-am/backend`.

## API overview

No global prefix. JWT is sent as `Authorization: Bearer <access_token>` (returned by
`POST /auth/login`). Everything requires a token except the public routes: all of `/auth/*`,
`GET /products`, `GET /products/top`, `GET /products/:id`, all category routes, `GET /reviews`,
`GET /users/:id` and `GET /health`.

| Area | Routes |
| --- | --- |
| Auth | `/auth/register`, `/auth/login`, `/auth/verify-email`, `/auth/resend-verification`, `/auth/forgot-password`, `/auth/reset-password` |
| Users | `/users/me`, `/users/me/password`, `/users/me/email`, `/users/businesses`, `/users`, `/users/:id` |
| Catalog | `/products`, `/products/top`, `/products/:id`, `/categories`, `/categories/tree`, `/categories/:id`, `/sub-categories`, `/product-categories` |
| Orders | `/orders`, `/orders/customer`, `/orders/business`, `/orders/admin`, `/orders/:id`, `/orders/:id/status`, `/orders/:id/products/:productId/status` |
| Reviews | `/reviews` |
| Notifications | `/notifications/my`, `/notifications/:id/status`, plus Socket.IO events |
| Uploads | `POST /uploads` (multipart, field `file`); files served from `/uploads` |
