# Gesta repository guidelines

## Build, test, and lint

Use Node.js 22.14 or newer (Node 24 LTS is recommended) and run commands from the
repository root. Install the locked dependency tree with `npm ci`; `.npmrc` intentionally
sets `ignore-scripts=true` because the repository relies on prebuilt `better-sqlite3`
bindings.

```text
npm ci
npm run setup                 # create backend/.env and initialize demo data
npm run dev                   # API on :3000, Vite app on :5173
npm run check                 # lint, typecheck, tests, and both workspace builds
npm run lint
npm run typecheck
npm test
npm run build
npm run db:init
npm run db:reset              # stop dev servers first
```

The root scripts delegate to the `backend` and `frontend` npm workspaces. Run a focused
test by passing a file after `--`, for example:

```text
npm run test -w backend -- tests/offers.test.ts
npm run test -w frontend -- tests/OffersPage.test.tsx
```

To select one test by name, append Vitest's `-t` option:

```text
npm run test -w backend -- tests/offers.test.ts -t "ne montre que les offres publiées à un étudiant"
```

## Architecture

Gesta is a two-workspace application:

- `backend/` is an Express API backed by a local SQLite database. `main.ts` loads
  configuration, initializes the database, and starts the server; `app.ts` assembles
  routes and middleware.
- `frontend/` is a React/Vite application. Vite serves it on port 5173 and proxies
  `/api/...` to the backend on port 3000 while removing the `/api` prefix.

Backend requests follow `controllers -> services -> repositories -> SQLite`, with
`models/` defining DBO/domain/DTO types and `mappers/` converting between them.
Controllers validate HTTP input and shape responses; services contain business rules and
must not depend on Express `Request` or `Response`; repositories contain SQL and return
raw DBOs. `authenticate` handles 401 responses, `authorize` handles 403 decisions, and
`errorHandler` converts thrown `HttpError` instances to the stable JSON shape
`{ "error": { "code", "message" } }`.

The frontend follows the course's MVVM structure:
`pages -> hooks -> services or utils -> models`, with reusable `components` below pages.
`App.tsx` is the single owner of `useAuth`; it passes the session and logout callback
through page props. Services validate response JSON with type guards, and hooks call
`onUnauthorized` on a 401 so the user returns to login.

Authentication is deliberately development-only demo authentication. The token carries
only `kind` and `id`; the backend reloads the account, roles, and companies from SQLite
on every request. Send the token directly in `Authorization` without a `Bearer` prefix.
The server must reject demo authentication when `NODE_ENV=production`.

## Repository-specific conventions

- Add schema changes as a new numbered SQL migration in
  `backend/src/db/migrations/`; never edit an already-applied migration.
- Keep authorization and visibility rules in backend services/permission helpers. Do not
  rely on hiding controls in the frontend.
- Signal expected API failures with `throw new HttpError(status, code, message)` so the
  central error handler preserves the documented status and error-code contract.
- Backend relative imports include the `.ts` extension because TypeScript rewrites them
  to `.js` during compilation.
- Database status codes are English (for example `PUBLISHED`); French labels belong in
  the frontend presentation layer.
- Backend tests use Vitest and Supertest with an in-memory SQLite database created by
  `tests/helpers/testApp.ts`; do not use the development database in tests. Seed fixtures
  and stable IDs are in `backend/src/db/seed/`.
- Frontend tests use Vitest and Testing Library; `frontend/tests/helpers/fetchMock.ts`
  supplies API responses.
- Use `API_PORT` for the backend port; `PORT` is not the project setting.
- Keep the API contract and REST Client examples synchronized with endpoint changes:
  update `backend/API.md` and the relevant `backend/http/*.http` files.

## Project documentation

- [README.md](../README.md): setup, commands, technical choices, and current scope.
- [docs/architecture.md](../docs/architecture.md): layer responsibilities and reference
  feature flows.
- [docs/seed.md](../docs/seed.md): demo users, companies, offers, and stable seed data.
- [backend/API.md](../backend/API.md): routes, authentication, response formats, and
  error codes.
- [Pull request template](./pull_request_template.md): repository review checklist.
