# MediaHub

React/TypeScript/Vite, Express/TypeScript, Supabase PostgreSQL/Auth/Storage.

- [Setup and deployment](docs/deployment.md)
- [Architecture audit](docs/production-audit.md)
- [Production verification status](docs/production-qa.md)

Use Node.js 24. Copy `.env.example` to `.env`, configure Supabase, then run `npm ci --prefix backend --ignore-scripts` and `npm ci --prefix frontend --ignore-scripts`. Start each app with its `npm run dev` script. Never put private credentials in a `VITE_` variable.
