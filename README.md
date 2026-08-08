# WebICT Capital frontend

React 19 and Vite frontend for WebICT Capital. Public PSX market data is read from the WebICT API. Authentication, portfolio, and watchlist access are selected explicitly at build time through a fail-closed platform mode.

## Local configuration

Copy `.env.example` to an ignored local environment file and replace placeholders. Every build must declare:

```dotenv
VITE_PLATFORM_MODE=supabase|webict
VITE_MARKET_API_BASE_URL=https://api-origin.example
```

Supabase mode additionally requires the public project URL and public anonymous key:

```dotenv
VITE_SUPABASE_URL=https://project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=public-anon-key
```

Never place a Supabase service-role key or any privileged credential in a `VITE_*` variable. Missing or invalid mode/base URL fails application initialization; there is no platform fallback and no default API origin.

Production remains explicitly configured with `VITE_PLATFORM_MODE=supabase` until the coordinated cutover. A WebICT staging build uses `VITE_PLATFORM_MODE=webict` and must omit browser Supabase credentials.

## Commands

```bash
pnpm install
pnpm run typecheck
pnpm run lint
pnpm run test:comparison
pnpm run test:market-overview
pnpm test
pnpm run build
```

## Transition status

- Production remains on the Supabase auth/portfolio adapter.
- Migration 008 is not represented as applied here; no real identity or portfolio import is claimed.
- WebICT mode uses cookie authentication, fresh CSRF per mutation, uncached private requests, lossless `bigint`/`Decimal` DTOs, and canonical portfolio APIs.
- `src/lib/supabase.ts`, `src/lib/stockService.ts`, the Supabase portfolio view, Python writers, and `.github/workflows/psxdata.yml` are transitional assets. Remove them only after a successful coordinated production cutover, rollback-window closure, and explicit data-pipeline ownership transfer.
- `schema.md` mirrors canonical platform contract revision 2026-08-01.5. Legacy schema material, if retained, is not an active browser contract.

See [PROJECT_FLOW.md](PROJECT_FLOW.md) for architecture, cache, staging, and cutover details.
