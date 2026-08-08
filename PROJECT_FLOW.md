# WebICT Capital frontend architecture

Contract revision: **2026-08-01.5**
Implementation state: dual-mode frontend ready for local verification; production cutover has not occurred.

## Runtime mode and initialization

`src/main.tsx` validates runtime configuration once before rendering. `VITE_PLATFORM_MODE` must be exactly `supabase` or `webict`; missing/invalid values fail closed. `VITE_MARKET_API_BASE_URL` must be an explicit HTTP(S) origin with no path, query, fragment, or embedded credentials. There is no default API host and no fallback between platform modes.

| Variable | Supabase mode | WebICT mode | Meaning |
| --- | --- | --- | --- |
| `VITE_PLATFORM_MODE` | `supabase` | `webict` | Explicit browser platform adapter |
| `VITE_MARKET_API_BASE_URL` | required | required | WebICT API origin |
| `VITE_SUPABASE_URL` | required | omitted | Transitional public Supabase project origin |
| `VITE_SUPABASE_ANON_KEY` | required | omitted | Transitional public anonymous key only |

No service-role or writer credential belongs in browser configuration. Production remains explicitly configured as `supabase` until coordinated cutover. Staging may explicitly select `webict`.

## Public API boundary

`src/lib/api/client.ts` provides anonymous URL-cached GETs for public market data. Responses are read with `response.text()` and parsed through `lossless-json`; financial/int64 DTOs never use `response.json()`.

Canonical routes used by new code:

- `GET /api/market-summary/latest/tickers`
- `GET /api/rates/kibor`
- `GET /api/rates/usd-pkr`
- `GET /api/tickers/{symbol}` (ticker detail, with valuation explicitly included)
- `GET /api/tickers/compare`
- `GET /api/market-indexes/{code}/history?from={date}&to={date}`

The `/market-summary` and `/rates/*` compatibility aliases are not used by new frontend code.

Market summary supplies the security catalogue. Ticker detail is fetched only after a symbol is opened/selected; the catalogue is not expanded through an N+1 detail sweep. Watchlist rows reuse catalogue fields and intentionally omit sparklines until bounded detail is available.

Ticker comparison supports two to four distinct stocks and zero to two distinct benchmarks (`KSE100`, `KSE30`, `KMI30`, `KSEALL`). Repeated parameters and requested order are preserved. `KSEALL` is the public code for stored `ALLSHR` data. Two distinct benchmark chart colours are available.

Market-index history retains available/requested/applied ranges and nullable `asOf`. Points are accepted in ascending order. The portfolio chart requests an explicit range beginning in 2021 and selects the latest 252 actual observations without fabricating calendar rows.

## Lossless numeric and temporal model

Strict decoders in `src/lib/api/decoders.ts` validate required keys, nullability, integer-ness, UUID/date/instant formats, technical metadata literals, and DTO shape.

- `bigint`: security/source IDs, quantities, turnover, shares, portfolio versions, lot versions.
- `Decimal`: prices, costs, rates, EPS, ratios, percentages, market caps, valuations.
- `number`: safe int32 counts, limits, and fiscal years only.
- branded strings: UUID, ISO calendar date, and ISO instant remain distinct.

Mutation serialization uses `lossless-json` numeric tokens; authoritative values are never first coerced through `Number`, `parseInt`, or `parseFloat`. ECharts receives only deliberate range-checked projections. Text rendering formats Decimal/bigint directly.

## Authentication

Components consume the normalized `AuthUser` interface and never receive Supabase sessions, access tokens, or refresh tokens.

### Supabase mode

`src/lib/auth/supabaseAdapter.ts` preserves the production Google OAuth/session behavior while mapping the result to `AuthUser`. It is selected only when `VITE_PLATFORM_MODE=supabase`.

### WebICT mode

- Bootstrap: `GET /api/auth/me`, `credentials: "include"`; bare or ProblemDetails 401 means signed out.
- Google start: top-level navigation to `GET /api/auth/google/start?returnUrl=<same-origin-current-page>`.
- `/signin-google` and `/api/auth/google/callback` are server-managed and are never invoked by React.
- Redirect `auth=failed` is shown as a generic failure; internal authentication scheme names are not referenced.
- Logout: fresh CSRF, then `POST /api/auth/logout`.
- No WebICT failure falls back to Supabase.

Logout, 401, and user identity transitions abort in-flight private requests and synchronously clear registered private state so previous-user portfolio/watchlist/activity cannot remain in the DOM.

## CSRF and private requests

Every mutation and logout obtains a fresh token from `GET /api/auth/csrf`, validates `headerName === "X-CSRF-TOKEN"`, then sends that exact header with `credentials: "include"`. Tokens are not logged or persisted. Private requests use `cache: "no-store"` and never enter the public URL cache.

HTTP 400, 401, 403, 404, 409, 503, infrastructure, network, and abort outcomes are distinguished. RFC ProblemDetails is decoded when present; 204 is handled without JSON parsing.

## Portfolio and watchlist

WebICT mode uses:

- `GET /api/portfolio`
- `GET /api/portfolio/lots`
- `GET /api/portfolio/holdings`
- `GET /api/portfolio/activity`
- `GET /api/portfolio/watchlist`
- `PUT|DELETE /api/portfolio/watchlist/{symbol}`
- `POST /api/portfolio/buys`
- `POST /api/portfolio/sells`
- `POST /api/portfolio/lots/{lotId}/corrections`
- `POST /api/portfolio/positions/{symbol}/remove`

No request accepts or sends `user_id`. The UI renders the server portfolio summary, lots, holdings, immutable activity, and watchlist. It does not reconstruct holdings from activity, rewrite/delete BUY lots, delete history, or implement client FIFO. Imported SELL activity with `positionEffect=none` is labelled position-neutral. Valuation is holdings-only; there is no cash field or placeholder. Nullable quote/value fields render `N/A`, and the unpriced holding count is exposed.

Corrections and removals require a reason and send expected lot/portfolio versions. The UI displays versions needed for reconfirmation and correction before/after activity data.

## Mutation commands and operational gate

Buy, sell, correction, and removal create one `crypto.randomUUID()` only when confirmed and freeze the logical body. An unknown-outcome/network retry reuses that UUID and exact body, fetching fresh CSRF for every transport attempt. A changed field/version requires user reconfirmation and a new command/UUID.

On success, portfolio summary, lots, holdings, activity, and watchlist are refreshed. On 409, the complete snapshot is refreshed before a reconciliation message; stale corrections/removals and oversells are not automatically retried. Watchlist PUT/DELETE are naturally idempotent and use no mutation UUID.

On 503, authenticated read state remains visible, mutation controls pause, and the UI reports that writes are temporarily unavailable. WebICT mode never falls back to Supabase.

## Cache policy

- Public market GET: bounded URL-only cache and in-flight deduplication.
- Auth/portfolio/watchlist: uncached, `credentials: "include"`, `cache: "no-store"`.
- Private state: reset registry plus request abort on logout/401/account transition.
- No authenticated response is stored in the shared market cache.
- The last successful ticker/comparison response remains visible while a replacement request loads.

## Transitional Supabase and data-pipeline ownership

The following remain intentionally present for production rollback and the current data pipeline:

- `src/lib/supabase.ts`
- `src/lib/stockService.ts`
- Supabase-mode portfolio implementation in `src/components/pages/PortfolioPage.tsx`
- `src/scripts/parse_psx.py` and `src/scripts/fetch.py`
- `.github/workflows/psxdata.yml`
- historical schema material

They are not used for WebICT auth/portfolio/watchlist requests. Removal requires: migration 008 applied in the target environment, rehearsed identity/portfolio import, coordinated flags, validated WebICT production sessions and writes, rollback-window closure, and explicit ownership transfer for remaining market writers. The workflow’s service credential is server-side only; any potentially exposed or service-role-looking credential requires manual rotation and repository-secret cleanup.

## Staging rehearsal

Staging variables:

```dotenv
VITE_PLATFORM_MODE=webict
VITE_MARKET_API_BASE_URL=https://staging-api-origin.example
```

Do not provide `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` to the WebICT staging build. Backend staging prerequisites remain operational: migration 008, imported test identities/portfolios, allowed staging origin/cookies, auth cutover enabled only in staging, registration policy retained, and portfolio writes enabled only for the controlled write rehearsal.

Rehearse signed-out bootstrap, Google round-trip, disabled imported user, logout/CSRF, account switch, every read, mutation success, unknown outcome retry, 409 conflict, 503 gate, nullable valuation, legacy SELL neutrality, and rollback to an explicitly built Supabase-mode artifact.

## Cutover and rollback

Cutover is coordinated with backend/data owners: freeze authoritative Supabase writes, export/import and reconcile, apply required migration/flags, build with `webict`, run smoke checks, then route production traffic. This repository does not claim that any of those events has occurred.

Rollback uses the previously verified artifact built with `VITE_PLATFORM_MODE=supabase`; no runtime fallback exists. If WebICT mutations were enabled, backend/data owners must first decide the authoritative write boundary and reconciliation procedure before traffic rollback. Never merge histories client-side.

## Verification

Required local checks:

```bash
pnpm run typecheck
pnpm run lint
pnpm run test:comparison
pnpm run test:market-overview
pnpm test
pnpm run build
git diff --check
```

Tests cover lossless numeric transport, DTO failures, canonical routes, comparison selection/order/colours, market-index ranges/order/252 selection, auth/CSRF, all portfolio endpoints, retry identity, 409 reconciliation, 503 UI, privacy reset, nullable quotes, legacy SELL neutrality, no-cash semantics, and date-only stability.
