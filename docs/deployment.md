# Setup and deployment

SQL migrations own application workflows, constraints and RLS. Prisma is an introspected client; it is not a second authentication system or the migration authority.

## Local development

Use Node.js 24. Copy `.env.example` to `.env` and fill the Supabase settings. Never place a service-role key, database connection string or private credential in a `VITE_` variable.

```powershell
npm ci --prefix backend --ignore-scripts
npm ci --prefix frontend --ignore-scripts
npm run dev --prefix backend
# In another terminal:
npm run dev --prefix frontend
```

The frontend runs on port 5173 and the API defaults to 5000. Without `VITE_API_BASE_URL`, the browser uses `/api`; Vite proxies this to the local API. The backend reads injected environment variables first, then `backend/.env`, then root `.env`.

## Database

For a new Supabase project, apply SQL migrations `001_mediahub.sql`, `002_workflow.sql`, and `003_reporting.sql` once through the Supabase SQL editor. For an existing installation, inspect the schema first; do not replay baseline migrations.

Set `DIRECT_URL` to the database owner connection for administrative scripts, then run:

```powershell
npm run db:check --prefix backend
npm run db:migrate --prefix backend
```

`db:check` validates pending migrations and the workflow in a transaction and rolls everything back. `db:migrate` applies additive migrations 004–013 with an advisory lock and checksum ledger. Before commit, it runs workflow assertions in a savepoint and rolls back the synthetic test data. Previously applied SQL files must not be edited. The runner is repeatable and skips unchanged applied migrations.

The scripts do not persist test users, customers, invoices or service records. Run database checks during a suitable maintenance window because they acquire brief schema locks.

## First administrator

Register and verify the intended account using Supabase Auth. An authorized database operator then selects that specific email:

```powershell
npm run build --prefix backend
node backend/scripts/bootstrap-admin.mjs --email you@example.com
```

This only works when there is no active administrator. Later role changes use `/admin/users`, which prevents removing the last administrator or disabling your own administrator access. No password is stored or displayed by the application.

## Publish actual website content

Use the admin UI to create services, portfolio entries, partners and process steps. Mark records active/published; mark selected services/portfolio entries featured for the homepage. Empty datasets intentionally show empty states. No fake customers, revenue, testimonials or project statistics are seeded.

Under `/admin/settings`, add and publish these keys:

| Key | Use |
| --- | --- |
| `hero` | Homepage headline, supporting text and image |
| `about` | Company introduction, vision, mission and values |
| `privacy` | Approved privacy policy |
| `terms` | Approved terms |
| `company_name` | Company name in the content field |
| `company_email` | Public email in the content field |
| `company_phone` | Public telephone in the content field |
| `company_address` | Public address in the content field |

Website settings are public editorial content when published. Never store credentials there. Company/legal copy needs the business owner's review before publication.

## Workflow

Visitors submit enquiries with optional private PDF/image attachments. Administrators qualify enquiries and invite customers through Supabase Auth. Conversion matches an existing customer by email and creates a project when a project enquiry has a selected active service; repeated conversion reuses the project.

Administrators review projects, save/edit quotation drafts, preview and send quotations. Customers confirm acceptance or rejection. The server calculates totals, discounts and tax. Projects progress through production, deliverable review and revisions. Customer acceptance completes the project and creates a draft invoice. Administrators issue it and record payment only after confirming actual receipt. There is no payment gateway or simulated payment.

Messages are persisted project communications. Milestones, notifications and status history come from PostgreSQL. STAFF exists as a future database role but has no enabled workspace. Recruitment did not exist in the baseline and was not introduced.

## Storage and Auth configuration

- Public buckets: `portfolio`, `avatars`.
- Private buckets: `project-files`, `deliverables`, `lead-attachments`.
- Private downloads require API ownership/admin checks and short-lived signed URLs.
- Configure Supabase Auth Site URL, redirect allowlist and email delivery for the real domain. Registration returns to `/login`; recovery/invitations use `/reset-password`.
- Set `AUTH_REDIRECT_URL` to the real `/reset-password` URL and `CORS_ORIGIN` to exact allowed frontend origins.
- The browser uses public Supabase configuration. The API verifies tokens with Supabase and resolves current roles/activation from PostgreSQL.

## Deployment

Set production values:

```text
NODE_ENV=production
SITE_URL=https://your-domain.example
CORS_ORIGIN=https://your-domain.example
AUTH_REDIRECT_URL=https://your-domain.example/reset-password
VITE_API_BASE_URL=/api
```

With Docker installed, run from the repository root:

```powershell
docker compose --env-file .env -f deploy/compose.yaml config --quiet
docker compose --env-file .env -f deploy/compose.yaml up --build -d
```

The supplied configuration exposes the frontend on port 8080, keeps the backend inside the container network, proxies `/api`, and routes `/sitemap.xml` and `/robots.txt` to the API. Terminate HTTPS at your hosting platform/reverse proxy. `TRUST_PROXY_HOPS=1` matches the supplied Nginx-to-API setup; adjust it only to match your trusted proxy chain.

For separate hosting, publish `frontend/dist`, run `npm start` from the built backend, configure SPA fallback, and proxy sitemap/robots endpoints. `frontend/public/_redirects` provides SPA fallback only; configure the API proxy at the hosting platform.

`/api/health` is liveness; `/api/ready` additionally checks PostgreSQL. Dockerfiles/Nginx configuration are supplied, but container execution has not been verified because Docker is unavailable in this environment.

## Verification

```powershell
npm run lint --prefix frontend
npm run typecheck --prefix frontend
npm run build --prefix frontend
npm run lint --prefix backend
npm run typecheck --prefix backend
npm test --prefix backend
npm run db:check --prefix backend
node backend/scripts/smoke.mjs
node backend/scripts/check-storage.mjs
```

The smoke script reads the configured API/database. The storage check creates uniquely named temporary QA files, verifies signed versus anonymous access, then removes its own files. Browser verification at 375, 390, 768, 1024 and 1440px remains required.

After SQL changes, synchronize Prisma using `prisma:pull` and `prisma:generate`. The `auth` schema is included because `profiles.auth_user_id` references `auth.users`. Tables/enums are marked externally managed in Prisma config. Do not use Prisma Migrate or `db push` to replace Supabase SQL migrations. See [Prisma externally managed tables](https://docs.prisma.io/docs/orm/prisma-schema/data-model/externally-managed-tables).
