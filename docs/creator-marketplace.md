# Creator Marketplace & demo database

MediaHub uses **Supabase PostgreSQL** for relational data, Supabase Auth for identities, and Supabase Storage for media. The Express API uses the Supabase service client; the frontend never receives a service-role key.

## Marketplace entities

- `profiles` is the shared account identity (`ADMIN`, `BUSINESS`, `CREATOR`, `STUDENT_CREATOR`, `STAFF`, `CUSTOMER`).
- `customers` contains the organization-side account linked one-to-one to a profile.
- `creator_profiles` contains searchable professional data, availability, pricing, ratings and verification.
- `categories`, `skills`, `creator_categories`, `creator_skills` provide normalized discovery filters.
- `creator_portfolio` contains multiple media case studies per creator.
- `projects`, `project_applications`, `project_team_members` model briefs, proposals and assigned talent.
- `creator_reviews` stores public creator feedback; existing `reviews` remains the agency project review entity.
- `favorite_creators`, `saved_projects` store user shortlists.
- `conversations`, `conversation_members`, `conversation_messages` model direct project communication.
- Existing `notifications`, `deliverables`, `invoices` and payment tables cover workflow alerts, delivery and transactions.

Indexes cover creator ranking, location, availability, portfolio lookup, applications, reviews and conversation timelines. Public read policies expose only marketplace catalog data; writes remain server-controlled.

## Commands

From `backend/`:

```powershell
npm run db:check
npm run db:migrate
npm run db:seed-demo
```

`db:check` runs unapplied migrations and workflow assertions inside a transaction, then rolls everything back. `db:migrate` applies reviewed additive migrations and records SHA-256 checksums. `db:seed-demo` is idempotent and can be rerun to reset the labelled demo records to their canonical values.

Use the Supabase Studio Table Editor to inspect rows, or connect any PostgreSQL client with `DIRECT_URL`. Apply baseline migrations `001`–`003` in Supabase first for a new database, then run `db:migrate` for the remaining tracked migrations.

## Demo accounts

All seeded demo accounts use password `MediaHub@2026`:

| Role | Email |
| --- | --- |
| Admin | `admin@mediahub.vn` |
| Business | `business@mediahub.vn` |
| Creator | `creator@mediahub.vn` |

The seed also creates `demo1@mediahub.vn` through `demo22@mediahub.vn` across Business, Creator and Student Creator roles.

## Seed volume

- 25 labelled Auth demo accounts (27 profiles currently present including pre-existing rows)
- 18 creator profiles, 10 categories, 32 skills
- 54 creator portfolio items and 24 public case studies
- 24 business projects and 36 applications
- 36 creator reviews, 30 notifications
- 12 conversations and 48 messages

The dataset deliberately includes new/unrated creators, verified and unverified records, featured and regular cards, multiple availability and experience levels, long descriptions, dense skills, varied prices, unread notifications and enough records for pagination.

## Realtime Messenger

Authenticated users can open `/messages`. Messages are persisted in `conversation_messages`; participants and read timestamps live in `conversation_members`. Migration `018_realtime_messenger.sql` adds the table to the `supabase_realtime` publication and applies member-only RLS, so open clients receive new messages immediately while conversation history remains private. Creator cards create a direct Business–Creator conversation through the authenticated API.
