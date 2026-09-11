# MediaHub Frontend

React + Vite + TypeScript frontend MVP for MediaHub.

## Run

```bash
npm install
npm run dev
```

Routes:

- `/` public homepage
- `/projects` project library
- `/login`, `/register`
- `/customer/dashboard`, `/customer/projects/new`, `/customer/projects/:id`
- `/admin/dashboard`, `/admin/projects`, `/admin/customers`, `/admin/revenue`, `/admin/employees`, `/admin/services`, `/admin/portfolio`

Additional routes:

- `/forgot-password`, `/reset-password`
- `/customer/profile`, `/customer/notifications`
- `/admin/projects/:id`, `/admin/testimonials`
- `/admin/profile`, `/admin/notifications`

The UI follows the local Stitch templates: dark surfaces, orange/purple accents, responsive cards, authentication panels and dashboard navigation. Customer and admin routes require the corresponding Supabase profile role.

API data is loaded from the Node backend; no mock records are substituted on errors. Forms support loading, validation, success and failure states. The customer workflow includes project requests, quotations, files, delivery approval, revisions and reviews. Admin pages include project status updates, quotations, deliveries, payment confirmation and content management.

Vite reads environment variables from the repository root `.env` (see `../.env.example`). Configure `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` and `VITE_API_BASE_URL`, then restart Vite. Only `VITE_` variables are exposed to the browser. Configure the backend separately and apply the Supabase migrations. Add `/login` and `/reset-password` URLs to the Supabase Auth redirect allowlist. Never prefix a service-role key with `VITE_`.

Run `npm run build` to check TypeScript and generate `dist/`. Production hosting must rewrite client routes to `index.html`.

Creator discovery is present in the design references but has no public backend endpoint in this application's customer/admin model. The current navigation therefore follows the implemented customer and admin routes.
