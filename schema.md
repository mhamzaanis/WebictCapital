WebICT Capital canonical platform schema and operations contract
Canonical database, ingestion, API, frontend, infrastructure, and diagnostic contract for the PSX/SBP platform.

Item	Current contract
Contract revision	2026-08-10.1
Current-state cutoff	2026-08-10, Asia/Karachi
Database	PostgreSQL 14 or newer; PostgreSQL 18.4 used by disposable verification; query the deployed target for its exact version
Applied schemas	public, app_identity, app_portfolio
Business timezone	Asia/Karachi
Logical dates	PostgreSQL date; ISO YYYY-MM-DD on the wire
Instants	PostgreSQL timestamptz; ISO 8601 on the wire
Price basis	Raw, unadjusted PSX prices
Browser data access	Through the ASP.NET Core API only; never connect the browser directly to PostgreSQL
Migration level	Migrations 001–008 applied to the current API/database target; no migration 009 exists
Identity/portfolio import	No real Supabase export/import was performed; legacy portfolios were intentionally not migrated
Current API gates	AUTH_CUTOVER_ENABLED=true, ALLOW_NEW_USER_REGISTRATION=true, PORTFOLIO_WRITES_ENABLED=true
Current frontend	WebICT-mode feature branch at https://preview.webictcapital.com; main site remains unchanged pending VPS cutover
1. Purpose and authority
This file is the cross-project source of truth for:

schemas, tables, views, columns, keys, constraints, triggers, and relationship semantics;
the service that owns every write surface;
the meaning of dates, timestamps, decimals, nulls, source codes, and status values;
scraper scheduling, locking, idempotency, history, and recovery behavior;
public and authenticated API boundaries;
frontend consumption and exact-number rules;
current migration/deployment state; and
safe SQL and infrastructure diagnostics.
Executable migration files remain authoritative for the exact DDL they introduce. This document explains the resulting schema and how every project uses it. It is not a migration runner.

1.1 Existing-database rule
On the current deployed target, migrations 001–008 are already applied. Do not paste CREATE TABLE statements over that database and do not rerun migrations 006, 007, or 008. Verify the target and migration state before any future numbered migration.

1.2 Fresh-database rule
For a genuinely empty database:

establish the reviewed complete public market-data baseline;
apply migrations/007_identity_foundation.sql once;
apply migrations/008_portfolio_foundation.sql once;
verify every object, constraint, index, trigger, and ownership boundary;
seed source dimensions through importer upserts, not manual guessed IDs.
Do not assume IF NOT EXISTS proves that a pre-existing object has the correct definition.

1.3 Current state that supersedes revision 2026-08-01.5
Revision 2026-08-01.5 described migration 008 as proposed, all API gates as disabled, and the frontend as Supabase-backed. Those deployment statements are now stale.

The current API/database target has app_portfolio; Google authentication and native portfolio operations work; all three gates are enabled; the WebICT frontend is deployed separately on the preview domain. The public main frontend has not yet been replaced. The optional Supabase exporter/importer remains unused with real data.

1.4 Distribution rule
Keep one reviewed canonical copy. API, frontend, and scraper repositories may mirror it, but mirrors must be synchronized outputs. CI should compare the revision and preferably the exact file hash across repositories.

2. Project and sub-project map
local files

unused real-data path

unused real-data path

PSX DPS closing rates

PsxSummaryScraper

KSEStocks historical indexes

PSX company pages/documents

TickerScraper

SBP KIBOR catalogue/PDFs

KiborScraper

SBP FX catalogue/PDFs

SbpFxRates

public schema

compute_technicals.py

ASP.NET Core API

app_identity

app_portfolio

React/Vite frontend

SupabaseExporter
optional/offline

PortfolioImporter
optional/offline

Cloudflare Workers

Traefik/Dokploy

Cloudflare Tunnel





Project/sub-project	Responsibility	Database writes
PsxSummaryScraper / pipeline_runner.py	Daily PSX orchestration and lifecycle	Daily market facts, index facts, AI brief, provenance/audit
parse_psx.py	Closing-rate and index-source parsing/persistence	security, daily_quote, market_summary, market_index, index_daily, market_ai_summaries
compute_technicals.py	Incremental/full raw technical calculation	technical_indicator_daily only
TickerScraper	Company profile, equity, exact-date valuation, fundamentals, ratios, events, documents	Company relations in public
KiborScraper	Official SBP KIBOR catalogue/PDF ingestion	kibor_rate and provenance/audit
SbpFxRates	Official SBP FX publication/observation ingestion	fx_publication, fx_rate_observation, provenance/audit
ASP.NET Core API	Public market reads; Google sessions; portfolio/watchlist operations	app_identity and app_portfolio only during their owned operations
React/Vite frontend	API-only WebICT presentation and commands	No direct database access
SupabaseExporter	Optional read-only legacy snapshot	Local sensitive files only
PortfolioImporter	Optional reviewed cutover import	app_identity and app_portfolio in one controlled transaction
Dokploy/Traefik/Cloudflared	Runtime routing, containers, schedules	No domain-data writes
2.1 Research boundary
No authoritative research schema or table is currently part of the deployed contract. The old 006_research_service_proposal.sql conflicts with the already-applied migration 006 and must never be executed under that number. Any future research persistence requires a new specification, the next free migration number, a read-only market-data role, and a separate restricted research writer. Broker execution is outside this platform.

3. Runtime services and schedules
All schedules are interpreted in Asia/Karachi. Dokploy invokes commands in deployed containers; workers remain idle between scheduled/manual runs.

Order	Service	Command	Cron	Local schedule
1	PsxSummaryScraper	/usr/local/bin/python -u /app/pipeline_runner.py	30 17 * * 1-5	17:30 Mon–Fri
2	KiborScraper	/usr/local/bin/python -u /app/sbp_kibor.py	10 18 * * 1-5	18:10 Mon–Fri
3	SbpFxRates	/usr/local/bin/python -u /app/sbp_fx_rates.py --max-publications 100	40 18 * * 1-5	18:40 Mon–Fri
4	TickerScraper	/usr/local/bin/python -u /app/psx_scraper.py --all-securities --no-json	20 19 * * 1,3,5	19:20 Mon/Wed/Fri
Always-on services are PostgreSQL, the API, Traefik/Dokploy, and Cloudflared.

pipeline_runner.py is the scheduled PSX entrypoint. It holds one pipeline advisory lock across the daily importer and technical calculator. Do not schedule the obsolete shell chain parse_psx.py && compute_technicals.py.

Exit status	Scheduler meaning
0	Success, synchronized/no change, authoritative no-data, or complete-pipeline lock collision
1	Committed partial/retryable work
2	Fatal failure
128 + signal	Shutdown
Internal 3	Importer/calculator advisory-lock collision
4. Schema overview and relationships
4.1 Schemas
Schema	Purpose	State
public	Market/reference facts, provenance, company facts, KIBOR, FX, technical indicators, migration-006 quarantine evidence	Applied and authoritative
app_identity	Native WebICT users, Google identity mappings, authentication audit	Migration 007 applied
app_portfolio	Portfolios, lots, immutable activity, allocation/removal snapshots, watchlists, mutation replay/audit	Migration 008 applied
4.2 Relationship diagram
audits

sources

sources

sources

sources

has

exact_date_parent

exact_date_parent

versions

versions

versions

versions

events

events

documents

has

summarized

contains

google_identity

audited

owns

owns

contains

records

allocates

snapshots

deduplicates

audits

identifies

identifies

identifies

DATA_SOURCE

SCRAPE_RUN

DAILY_QUOTE

INDEX_DAILY

KIBOR_RATE

FX_PUBLICATION

SECURITY

DAILY_VALUATION

TECHNICAL_INDICATOR_DAILY

COMPANY_PROFILE_VERSION

EQUITY_PROFILE_VERSION

FINANCIAL_STATEMENT

FINANCIAL_RATIO

ANNOUNCEMENT

COMPANY_PAYOUT

FINANCIAL_REPORT_DOCUMENT

MARKET_INDEX

MARKET_SUMMARY

MARKET_AI_SUMMARIES

FX_RATE_OBSERVATION

USER_ACCOUNT

EXTERNAL_LOGIN

AUTHENTICATION_AUDIT

PORTFOLIO

WATCHLIST_ITEM

POSITION_LOT

PORTFOLIO_ACTIVITY

ACTIVITY_LOT_ALLOCATION

POSITION_REMOVAL_LOT

MUTATION_REQUEST

MUTATION_AUDIT





4.3 Storage patterns
Pattern	Tables	Semantics
Natural-key daily fact	daily_quote, market_summary, index_daily, daily_valuation, kibor_rate, reserved fx_rate, metal_rate	Conditional upsert; identical rerun preserves timestamps
SCD2	Profile, equity, financial statement, financial ratio	Half-open [valid_from, valid_to); one current row per natural key
Append/correct event history	Announcements, payouts, report documents	Never delete because later source response omits an event
Immutable application history	Portfolio activity, allocations, removal snapshots, mutation audit	Update/delete rejected by trigger
Mutable state with version	Portfolio, position lot, watchlist, mutation request	Ownership/provenance immutable; explicit allowed state transitions
5. Source and write ownership
5.1 Stable source codes
data_source.code	Meaning
psx_daily_import	PSX daily orchestration/audit
psx_closing	Official PSX closing-rate PDF facts
dps_index	Current official DPS index panels
ksestocks_index	Historical KSEStocks index observations
psx_company	PSX company pages/documents
kibor	Official SBP KIBOR publications
fx	Official SBP FX publications
metals	Reserved future metal importer
5.2 Source semantics
Ticker OHLC/change/turnover comes from PSX DPS closing-rate publications.
KSE index values never come from the closing-rate PDF.
Current index observations use DPS panels; historical observations use KSEStocks.
Stored index code ALLSHR is exposed publicly as KSEALL.
daily_quote.turnover is share quantity, not PKR traded value.
daily_valuation.market_cap is full PKR; the importer expands PSX “000s”.
Company valuation requires an exact Karachi run-date quote.
KIBOR bid and offer remain separate.
SBP FX rate families and tenors remain separate.
v_usdpkr_m2m_ready is the canonical USD/PKR analysis series.
Raw source anomalies are retained; analytics require a separately versioned eligibility policy.
5.3 scrape_run status
Status	Meaning
running	Active or abandoned run row awaiting finalization/recovery
success	Requested components completed and committed
partial	Valid work committed with retryable/actionable warnings
failed	No valid completion for the requested unit
no_data	Authoritative source/catalogue confirms no applicable data
not_applicable is a per-ticker outcome inside sanitized notes, not a scrape_run.status. rows_written is a mutation counter, not a fact-table row count.

6. public schema data dictionary
All unqualified names in this section belong to public.

6.1 Provenance and dimensions
data_source
Grain: one stable source identity.

Column	Type	Null	Meaning
id	smallserial	No	Primary key; database-local surrogate
code	text	No	Stable unique source code
name	text	No	Operator-facing name
base_url	text	Yes	Source base URL/provenance
scrape_run
Grain: one importer run/audit unit for one logical date.

Column	Type	Null	Meaning
id	bigserial	No	Primary key
source_id	smallint	No	FK → data_source.id
run_date	date	No	Logical trade/publication/run date
started_at, finished_at	timestamptz	Finish yes	Runtime interval
status	text	No	`running
rows_written	integer	No	Actual inserts/material updates/prunes counted by owner
notes	text	Yes	Sanitized structured diagnostics
Index: (source_id, run_date).

security
Grain: one listed/historical security symbol.

Column	Type	Null	Meaning
id	bigserial	No	Primary key
symbol	text	No	Unique stable public symbol
company_name	text	Yes	Latest convenience name
created_at, updated_at	timestamptz	No	Storage lifecycle
The daily importer owns the universe. The company importer may enrich only a nonblank name under its identity contract.

market_index
Grain: one stored index dimension.

Column	Type	Null	Meaning
id	smallserial	No	Primary key
code	text	No	Unique stored code, including ALLSHR
display_name	text	Yes	Presentation label
6.2 PSX daily facts and derived indicators
daily_quote
Primary key: (security_id, trade_date).

Column group	Type	Meaning
security_id	bigint	FK → security.id
trade_date	date	Logical trading date
open, high, low, close, change	numeric	Raw official observations; nullable
turnover	bigint	Traded-share quantity
section	text	PSX source section/category
source_id	smallint	FK → data_source.id
inserted_at, updated_at	timestamptz	First storage/material-update timestamps
Index: trade_date.

technical_indicator_daily
Primary key: (security_id, trade_date, price_basis). FK (security_id, trade_date) → daily_quote, ON DELETE CASCADE.

Column group	Type	Meaning
price_basis	text	raw or reserved adjusted; current writer uses raw
calculation_version	text	Current formula/version marker, last audited as ta_raw_v1
return_1d_pct, return_5d_pct, return_20d_pct	numeric	Return features
sma_20, sma_50, sma_200	numeric	Simple moving averages
ema_12, ema_26	numeric	Exponential moving averages
rsi_14	numeric	Relative Strength Index
macd, macd_signal, macd_histogram	numeric	MACD family
atr_14	numeric	Average True Range
bollinger_middle, bollinger_upper, bollinger_lower	numeric	Bollinger bands
volume_sma_20	numeric	Turnover moving average
source_updated_at	timestamptz	Exact source quote version consumed
calculated_at	timestamptz	Changes only when result/source/version changes
market_summary
Primary key: trade_date.

Columns: prev_volume bigint, curr_volume bigint, advances integer, declines integer, unchanged integer, flu_no text, source_id smallint, inserted_at timestamptz, updated_at timestamptz.

This stores whole-market breadth/volume. Index-specific values belong in index_daily.

market_ai_summaries
Primary key: (trade_date, summary_type). FK trade_date → market_summary, ON DELETE CASCADE.

Columns: model_name, prompt_version, input_hash char(64), nullable summary, nullable error_message, JSON arrays key_points, top_gainers, top_losers, volume_leaders, sector_activity, generated_at, and status pending|completed|failed.

Indexes support status, latest completed summary, and generation time. Historical backfill does not create AI summaries.

index_daily
Primary key: (index_id, trade_date).

Columns: prev_close, open, high, low, close, volume, change, change_pct, source-reported as_of, source_id, inserted_at, updated_at.

The source/provider contract and canonical code control pruning. A missing provider observation cannot delete another provider’s valid row.

6.3 Company valuation and SCD2 facts
daily_valuation
Primary key: (security_id, trade_date). Exact-parent FK → daily_quote, ON DELETE CASCADE.

Columns: nullable market_cap numeric, nullable pe_ratio_ttm numeric, source_id, inserted_at, updated_at. Market cap must be nonnegative. P/E is a source field; PEG is not a substitute.

company_profile_version
Primary key: id bigserial; FK security_id → security.

Columns: sector, business_description, address, website, registrar, auditor, fiscal_year_end, key_people jsonb, content_hash char(64), valid_from, valid_to, is_current, inserted_at.

One current row per security is enforced by a partial unique index. Current rows have null valid_to; historical rows have a later valid_to.

equity_profile_version
Primary key: id bigserial; FK security_id → security.

Columns: shares bigint, free_float_shares bigint, free_float_pct numeric, hash/validity/current fields, inserted_at. Values are nonnegative, percent is 0–100, and free-float shares cannot exceed shares.

financial_statement
Primary key: id bigserial; natural current key (security_id, fiscal_year, period).

Columns: sales, profit_after_tax, eps, complete normalized line_items jsonb, content hash, validity/current fields, inserted_at. Period is one of Annual, Q1, Q2, Q3, Q4.

financial_ratio
Primary key: id bigserial; natural current key (security_id, fiscal_year).

Columns: values jsonb, content hash, validity/current fields, inserted_at. Sector-specific ratio sets are versioned as a whole.

6.4 Company event/document history
announcement
Primary key: id bigserial; FK security_id → security.

Columns: issuer-scoped psx_document_id, announcement_date, title, category, pdf_url, documents jsonb, fallback content_hash, first_seen, inserted_at.

Unique identity is (security_id, psx_document_id) when present, otherwise (security_id, content_hash). Never recreate the obsolete global document-ID index.

company_payout
Primary key: id bigserial; FK security_id → security.

Columns: announced_at, period_ended, result_type, details, book-closure start/end, optional event_hash, required content_hash, first_seen, inserted_at. Book-closure end cannot precede start.

financial_report_document
Primary key: id bigserial; FK security_id → security.

Columns: report_type, period_ended_raw, nullable normalized date/year, posting_date, issuer-scoped psx_document_id, url, content_hash, first_seen, inserted_at.

Annual year-only source values remain year/raw text; no date is invented.

6.5 Migration-006 quarantine evidence
psx_company_daily_valuation_quarantine
Preserves the original valuation columns plus quarantine_reason, migration_code, quarantined_at, and original_row jsonb. It deliberately has no foreign keys so evidence survives later lifecycle changes.

psx_company_equity_version_quarantine
Preserves the original equity version, symbol, quarantine metadata, and original JSON row. It deliberately has no foreign keys.

Migration 006 quarantined 613 valuation rows and three equity rows. Do not rerun it.

6.6 KIBOR, FX, and reserved rate tables
kibor_rate
Primary key: (quote_date, tenor). Columns: bid numeric, offer numeric, source_id, inserted_at, updated_at. Canonical tenors are 1W, 2W, 1M, 3M, 6M, 9M, and 1Y.

fx_publication
Primary key: id bigserial; unique (publication_date, rate_type).

Columns: publication/effective/settlement dates, rate_type, provider, unit, source URL/file name, pinned PDF SHA-256/size/pages, observation count, source ID, timestamps.

Allowed families: conversion, open_market, weighted_average_customer, mark_to_market.

fx_rate_observation
Primary key: (publication_id, base_ccy, quote_ccy, tenor). FK publication → fx_publication, ON DELETE CASCADE.

Columns: currency pair, tenor, either one positive rate or a positive ordered bid/offer pair, and timestamps. The two shapes cannot be mixed.

fx_rate
Reserved generic market-feed OHLC table keyed by (quote_date, base_ccy, quote_ccy). No deployed SBP writer uses it because official PDF facts have rate-family and tenor semantics.

metal_rate
Reserved table keyed by (quote_date, metal, purity, unit, currency). No deployed writer currently guarantees coverage.

6.7 Views
View	Purpose
v_current_profile	Current profile version only
v_current_equity	Current equity version only
v_current_financials	Current financial-statement versions
v_current_ratios	Current financial-ratio versions
v_sbp_fx_rates	Full normalized, source-aware FX publication + observation surface
v_usdpkr_m2m_ready	Canonical Mark-to-Market USD/PKR ready series
7. app_identity schema data dictionary
Migration 007 created this schema. Its reviewed Git blob SHA remains 490e397a208075c7a0d90a37de22aa9fd584927a.

7.1 user_account
Primary key: id uuid.

Column	Type	Null	Meaning
id	uuid	No	Permanent WebICT user ID
email	text	Yes	Profile field; maximum 320 characters; never an identity key
email_verified	boolean	No	Profile verification state
display_name	text	Yes	Profile name, maximum 256
avatar_url	text	Yes	Profile image URL, maximum 2048
status	text	No	active or disabled
created_at, updated_at	timestamptz	No	Storage lifecycle
last_login_at	timestamptz	Yes	Latest successful login
A delete-protection trigger requires disabling rather than deleting a user.

7.2 external_login
Primary key: generated bigint id; FK user_id → user_account, ON DELETE RESTRICT.

Columns: provider, canonical issuer, Google subject, optional provider email, optional legacy Supabase identity UUID, creation/update/login timestamps.

Constraints:

provider is exactly google;
issuer is exactly https://accounts.google.com;
subject is nonblank and at most 255 characters;
(provider, issuer, subject) is unique;
one Google login per WebICT user;
legacy Supabase identity ID is unique when present.
Email is not used to link an unknown subject.

7.3 authentication_audit
Primary key: generated bigint id; nullable FK user_id → user_account, ON DELETE SET NULL.

Columns: bounded event_type, event_at, bounded request_id, and object-shaped metadata jsonb limited to 4096 UTF-8 bytes. Indexes support user/time and event/time investigations.

Audit metadata must be sanitized and must never contain OAuth tokens, cookies, credentials, raw claims, or secrets.

8. app_portfolio schema data dictionary
Migration 008 is applied to the current target. This schema has no cash table.

8.1 import_batch
Optional legacy cutover batch; unused by the real deployment path so far.

Primary key: id uuid; unique manifest SHA-256.

Columns: source, manifest version/hash, export instant, running/completed/failed status, user/identity/buy/sell/watchlist counts, started/finished timestamps, bounded manifest metadata, bounded error details.

Identity, source counts, and completed batches are immutable. User count must be positive and identity count must equal user count.

8.2 portfolio
Primary key: id uuid; FK user_id → app_identity.user_account; optional FK import_batch_id.

Columns: name, fixed PKR base currency, active|disabled|archived status, default flag, native|supabase_import origin, optimistic version bigint, timestamps.

At most one active default portfolio exists per user. Ownership, origin, import provenance, and creation time are immutable.

8.3 position_lot
Primary key: id uuid; FKs to portfolio, public.security, and optional import batch. Composite unique (id, portfolio_id, security_id) supports ownership-safe references.

Columns: positive whole-share quantity, numeric(20,6) unit cost, acquisition date, open|sold|removed status, legacy_opening|native_buy origin, optional legacy trade/import/source timestamp, optimistic version, created/updated/closed timestamps.

Open lots have null closed_at; sold/removed lots retain history with a close timestamp. Rows cannot be deleted.

8.4 portfolio_activity
Primary key: id uuid; FKs to portfolio, security, optional owned lot, and optional import batch.

Activity types:

legacy_opening;
legacy_sale;
native_buy;
native_sell;
lot_correction;
position_removal.
Core columns record source kind, side, position effect, quantity, price, trade/effective date, optional legacy provenance, reason, correction before/after quantity/cost/acquisition dates, portfolio versions, lot versions, and creation timestamp.

Rows are append-only. Native activity increments the portfolio version exactly once. Corrections also increment the lot version exactly once and preserve complete before/after snapshots. Legacy sales are position-neutral because the legacy frontend had already rewritten BUY rows.

8.5 activity_lot_allocation
Primary key: (activity_id, lot_id); composite FKs ensure the native sale, lot, portfolio, and security agree.

Columns: allocated quantity, unit_cost_at_allocation, acquisition_date_at_allocation, creation time. Allocation is limited to the locked open lot quantity and snapshots exact pre-change cost/date. Deferred triggers require allocation total to equal sale quantity and reject lots acquired after the sale date.

Rows are append-only.

8.6 position_removal_lot
Primary key: (activity_id, lot_id); composite FKs ensure removal activity and lot ownership agree.

Columns: removed quantity, cost/date snapshots, creation time. Deferred triggers require snapshot totals to equal removal activity and reject an effective date earlier than an affected acquisition.

Rows are append-only.

8.7 watchlist_item
Primary key: generated bigint id; FKs to user, public.security, and optional import batch. Unique (user_id, security_id).

Columns: active|removed status, native/import origin, optional legacy ID/source timestamps, creation/update timestamps. Add/restore/remove are idempotent state transitions. Ownership/provenance cannot change and rows cannot be deleted.

8.8 mutation_request
Primary key: (portfolio_id, mutation_id); composite portfolio/user FK and optional activity/result FK.

Columns: operation type, canonical 64-hex request fingerprint, reserved|completed status, result activity/portfolio/lot versions, creation/completion timestamps.

The mutation UUID cannot be all-zero. Exact replay returns the original completed result. Reusing the UUID for changed input is a conflict. Completed requests and request identity are immutable.

8.9 mutation_audit
Primary key: generated bigint id; ownership-safe portfolio/user FK and optional security FK.

Columns: bounded mutation type/request ID, object-shaped bounded metadata, occurrence timestamp. Rows are append-only and indexed by portfolio/time and user/time.

8.10 Trigger/function catalogue
Function family	Purpose
reject_delete	Blocks physical deletion of portfolio, lot, watchlist, import batch, and mutation request
reject_immutable_change	Blocks update/delete of activity, allocations, removal snapshots, and mutation audit
guard_*_update	Keeps identity, ownership, provenance, fingerprints, and completed results immutable
validate_*_time	Enforces export-instant limits and Karachi current-date rules
validate_allocation_snapshot	Locks open lot and validates allocation quantity/cost/date
validate_removal_snapshot	Validates exact open-lot removal snapshot
validate_native_sale_allocations	Deferred exact sale-total and acquisition-date validation
validate_position_removal_lots	Deferred exact removal-total and date validation
9. Cross-schema application semantics
9.1 Identity
Google subject + canonical issuer owns identity.
Email is profile data only.
Disabled users cannot obtain an active session.
New registration is currently enabled, but this is an operational/product decision and should be reconsidered before main-site promotion.
9.2 Portfolio
Portfolio value is holdings-only.
Native buys create open lots and immutable activity atomically.
Native sells are oversell-protected and allocate eligible lots FIFO by acquisition date, creation time, then UUID.
Corrections update retained open-lot state while activity preserves before/after facts.
Position removal closes and snapshots lots; it does not delete them.
Portfolio/lot versions prevent stale overwrites.
Mutation UUID/fingerprint protects retries.
Reasons are nonblank and at most 1024 UTF-8 bytes.
9.3 Frontend commission
Commission is not a separate database field. The frontend defaults to 0.15%, calculates with decimal arithmetic, and sends an adjusted unitPrice:

buy stored unit price  = displayed gross price × (1 + rate / 100)
sell stored unit price = displayed gross price × (1 - rate / 100)
Only the adjusted price is persisted. Original displayed price, fee rate, broker fee, and taxes cannot be reconstructed. A future auditable fee model requires a new API specification and migration.

10. API and frontend consumption contract
10.1 Anonymous market routes
Route	Purpose
GET /health	Health probe
GET /api/market-summary/latest/tickers	Canonical latest summary/ticker catalogue
GET /market-summary	Compatibility alias
GET /api/tickers/{symbol}	Selected ticker detail
GET /api/tickers/compare	Two–four stocks and zero–two benchmarks
GET /api/market-indexes/{code}/history	KSE100, KSE30, KMI30, public KSEALL history
GET /api/rates/kibor	Canonical KIBOR
GET /rates/kibor	Compatibility alias
GET /api/rates/usd-pkr	Canonical SBP M2M-ready USD/PKR
GET /rates/usd-pkr	Compatibility alias
Canonical/alias market-summary and rates actions are anonymous and GET-only. Unsupported mutation verbs return 405.

10.2 Authentication routes
Route	Purpose
GET /api/auth/google/start	Start challenge after return-URL validation
GET /signin-google	Exact Google middleware redirect target
GET /api/auth/google/callback	Complete external-cookie flow and issue application cookie
GET /api/auth/me	Supported WebICT profile
GET /api/auth/csrf	Antiforgery cookie and X-CSRF-TOKEN value
POST /api/auth/logout	CSRF-protected logout
Google callback registration is exactly https://api.webictcapital.com/signin-google for the current domain.

10.3 Portfolio routes
Route	Purpose
GET /api/portfolio	Default portfolio summary
GET /api/portfolio/lots	Open lots
GET /api/portfolio/holdings	Aggregated holdings/current quote valuation
GET /api/portfolio/activity	Immutable activity, limit 1–500
GET /api/portfolio/watchlist	Active watchlist/latest quote
PUT /api/portfolio/watchlist/{symbol}	Idempotent add/restore
DELETE /api/portfolio/watchlist/{symbol}	Idempotent removal
POST /api/portfolio/buys	Native buy
POST /api/portfolio/sells	FIFO native sell
POST /api/portfolio/lots/{lotId}/corrections	Lot correction
POST /api/portfolio/positions/{symbol}/remove	Position removal
Ownership comes only from the application cookie NameIdentifier; no request accepts user_id. All mutations require a fresh CSRF token. The internal authentication scheme is WebICTApplication.

10.4 Exact numeric/date rules
API decimals and int64 values are exact JSON numeric tokens.
WebICT frontend uses lossless JSON, Decimal, and bigint rather than native floating-point coercion.
Null means unavailable/not applicable, not zero.
Date-only values remain calendar dates and must not shift under browser timezone conversion.
Market cap is full PKR.
Free-float percent is already a percentage and is not divided by 100.
Public market responses may use public caching; authenticated portfolio responses do not use that cache.
10.5 Frontend modes
VITE_PLATFORM_MODE is mandatory and fail-closed:

webict: WebICT API for market/auth/portfolio/watchlist;
supabase: explicit legacy rollback adapter.
WebICT mode must not initialize or call Supabase. The current WebICT feature branch is deployed at preview.webictcapital.com; webictcapital.com remains on the unchanged main deployment until the VPS/cutover plan completes.

11. Migration ledger
Migration	Current state	Purpose
001	Applied	Initial PSX company persistence
002	Applied	Company idempotency and issuer-scoped identity corrections
003	Applied	Company constraints and persistence hardening
004	Applied	Normalized SBP FX publications, observations, views
005	Applied	Raw technical indicators
006	Applied 2026-07-21	Guarded company valuation/equity cleanup and quarantine
007	Applied 2026-08-01	app_identity foundation
008	Applied to current target by 2026-08-10	app_portfolio foundation and optional cutover contract
009	Does not exist	Next number is unallocated
Migration files are forward-only. Never edit applied files. The DBeaver command history is evidence of what was run, not a reusable installation script.

12. Data-quality ledger
Last supplied dated audits reported:

540,184 eligible positive-close quotes with zero missing/stale raw ta_raw_v1 technical rows;
migration-006 quarantine counts of 613 valuations and three equity rows;
18,024 raw quotes with close outside published range and 245 with open outside range, preserved as raw observations;
483 valuation rows with market cap and zero P/E rows at that audit point;
index coverage through 2026-07-24 as below.
Stored index	Present	Missing	First	Last
ALLSHR	1,331	44	2021-01-01	2026-07-24
KMI30	1,353	22	2021-01-01	2026-07-24
KMIALLSHR	1,328	47	2021-01-01	2026-07-24
KSE100	1,349	26	2021-01-01	2026-07-24
KSE30	1,351	24	2021-01-01	2026-07-24
The exact ALLSHR source anomaly on 2026-07-21 is intentionally absent and pinned by fingerprint 47b725f9da779b604cb5f0acad82055616bcdde72e5f5a70303ea07c39a04dc7.

Audit counts are observations, not invariants. Rerun the queries below and record a new date before making a current completeness claim.

13. Safe DBeaver diagnostic workflow
13.1 Safety rules
For investigation, begin with a read-only transaction:

BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL statement_timeout = '60s';
SET LOCAL lock_timeout = '5s';

-- Run read-only diagnostics here.

ROLLBACK;
Confirm the database and user before every session.
Do not run migration DDL from this diagnostics section.
Do not use DBeaver “auto-commit” for reviewed multi-statement migrations.
If any transaction statement fails, issue ROLLBACK before continuing.
Avoid selecting raw auth metadata, emails, Google subjects, cookies, credentials, or full scraper notes unless the incident requires it.
Use EXPLAIN (ANALYZE, BUFFERS) only when executing the query is safe; plain EXPLAIN does not run it.
13.2 Connection identity
SELECT
    current_database() AS database_name,
    current_user AS database_user,
    current_schema() AS current_schema,
    current_setting('server_version') AS server_version,
    current_setting('TimeZone') AS session_timezone,
    pg_is_in_recovery() AS is_read_replica,
    clock_timestamp() AS database_time;
Expected application logic uses Asia/Karachi explicitly for business dates even if a session timezone differs.

13.3 Schema/object existence
SELECT
    to_regnamespace('public') AS public_schema,
    to_regnamespace('app_identity') AS identity_schema,
    to_regnamespace('app_portfolio') AS portfolio_schema,
    to_regclass('public.daily_quote') AS daily_quote,
    to_regclass('public.technical_indicator_daily') AS technicals,
    to_regclass('public.fx_publication') AS fx_publication,
    to_regclass('public.v_usdpkr_m2m_ready') AS usdpkr_view,
    to_regclass('app_identity.user_account') AS user_account,
    to_regclass('app_identity.external_login') AS external_login,
    to_regclass('app_portfolio.portfolio') AS portfolio,
    to_regclass('app_portfolio.position_lot') AS position_lot,
    to_regclass('app_portfolio.portfolio_activity') AS portfolio_activity,
    to_regclass('app_portfolio.mutation_request') AS mutation_request;
Every expected value should be non-null.

13.4 Complete column inventory
SELECT
    table_schema,
    table_name,
    ordinal_position,
    column_name,
    data_type,
    udt_name,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema IN ('public', 'app_identity', 'app_portfolio')
ORDER BY table_schema, table_name, ordinal_position;
13.5 Constraints
SELECT
    ns.nspname AS schema_name,
    rel.relname AS table_name,
    con.conname,
    con.contype,
    con.convalidated,
    pg_get_constraintdef(con.oid, true) AS definition
FROM pg_constraint AS con
JOIN pg_class AS rel ON rel.oid = con.conrelid
JOIN pg_namespace AS ns ON ns.oid = rel.relnamespace
WHERE ns.nspname IN ('public', 'app_identity', 'app_portfolio')
ORDER BY ns.nspname, rel.relname, con.conname;
convalidated should be true for ordinary applied constraints.

13.6 Indexes
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname IN ('public', 'app_identity', 'app_portfolio')
ORDER BY schemaname, tablename, indexname;
13.7 Triggers
SELECT
    event_object_schema,
    event_object_table,
    trigger_name,
    action_timing,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema IN ('public', 'app_identity', 'app_portfolio')
ORDER BY event_object_schema, event_object_table, trigger_name, event_manipulation;
13.8 Functions and views
SELECT
    ns.nspname AS schema_name,
    p.proname AS function_name,
    pg_get_function_identity_arguments(p.oid) AS arguments,
    pg_get_function_result(p.oid) AS result_type
FROM pg_proc AS p
JOIN pg_namespace AS ns ON ns.oid = p.pronamespace
WHERE ns.nspname IN ('app_identity', 'app_portfolio')
ORDER BY ns.nspname, p.proname, arguments;

SELECT schemaname, viewname, definition
FROM pg_views
WHERE schemaname IN ('public', 'app_identity', 'app_portfolio')
ORDER BY schemaname, viewname;
13.9 Table sizes, dead rows, and vacuum state
SELECT
    schemaname,
    relname AS table_name,
    n_live_tup,
    n_dead_tup,
    pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
    last_analyze,
    last_autoanalyze,
    last_vacuum,
    last_autovacuum
FROM pg_stat_user_tables
WHERE schemaname IN ('public', 'app_identity', 'app_portfolio')
ORDER BY pg_total_relation_size(relid) DESC;
Statistics are estimates. Use targeted count(*) only where exact counts are operationally necessary.

13.10 Database activity and long-running queries
SELECT
    pid,
    usename,
    application_name,
    client_addr,
    state,
    wait_event_type,
    wait_event,
    clock_timestamp() - query_start AS query_age,
    left(query, 500) AS query_preview
FROM pg_stat_activity
WHERE datname = current_database()
  AND pid <> pg_backend_pid()
  AND state <> 'idle'
ORDER BY query_start;
13.11 Blocked sessions
SELECT
    pid AS blocked_pid,
    usename,
    clock_timestamp() - query_start AS blocked_for,
    pg_blocking_pids(pid) AS blocking_pids,
    wait_event_type,
    wait_event,
    left(query, 500) AS blocked_query
FROM pg_stat_activity
WHERE datname = current_database()
  AND cardinality(pg_blocking_pids(pid)) > 0
ORDER BY query_start;
Do not terminate sessions until the owning job and transaction impact are understood.

13.12 Database counters
SELECT
    datname,
    numbackends,
    xact_commit,
    xact_rollback,
    blks_read,
    blks_hit,
    temp_files,
    temp_bytes,
    deadlocks,
    stats_reset
FROM pg_stat_database
WHERE datname = current_database();
13.13 Logging, timeout, and RLS settings
SELECT name, setting, unit, source
FROM pg_settings
WHERE name IN (
    'statement_timeout',
    'lock_timeout',
    'idle_in_transaction_session_timeout',
    'log_min_duration_statement',
    'log_lock_waits',
    'deadlock_timeout',
    'timezone'
)
ORDER BY name;

SELECT
    ns.nspname AS schema_name,
    rel.relname AS table_name,
    rel.relrowsecurity AS row_level_security,
    rel.relforcerowsecurity AS force_row_level_security
FROM pg_class AS rel
JOIN pg_namespace AS ns ON ns.oid = rel.relnamespace
WHERE ns.nspname IN ('public', 'app_identity', 'app_portfolio')
  AND rel.relkind = 'r'
ORDER BY ns.nspname, rel.relname;
The API enforces application ownership and does not rely on browser-accessible PostgreSQL RLS. An unexpected RLS setting can therefore change API behavior and must be investigated.

14. Scraper and market-data diagnostics
14.1 Latest run per source
WITH ranked AS (
    SELECT
        ds.code,
        sr.id,
        sr.run_date,
        sr.started_at,
        sr.finished_at,
        sr.status,
        sr.rows_written,
        row_number() OVER (
            PARTITION BY ds.code
            ORDER BY sr.started_at DESC, sr.id DESC
        ) AS rn
    FROM public.scrape_run AS sr
    JOIN public.data_source AS ds ON ds.id = sr.source_id
)
SELECT code, id, run_date, started_at, finished_at, status, rows_written
FROM ranked
WHERE rn = 1
ORDER BY code;
14.2 Recent failures and partial runs
SELECT
    ds.code,
    sr.id,
    sr.run_date,
    sr.started_at,
    sr.finished_at,
    sr.status,
    sr.rows_written,
    left(sr.notes, 2000) AS notes_preview
FROM public.scrape_run AS sr
JOIN public.data_source AS ds ON ds.id = sr.source_id
WHERE sr.status IN ('failed', 'partial')
ORDER BY sr.started_at DESC
LIMIT 100;
Review notes for source/date/component classification. Never paste unsanitized notes into public tickets.

14.3 Stale running rows
SELECT
    ds.code,
    sr.id,
    sr.run_date,
    sr.started_at,
    clock_timestamp() - sr.started_at AS running_for,
    sr.rows_written
FROM public.scrape_run AS sr
JOIN public.data_source AS ds ON ds.id = sr.source_id
WHERE sr.status = 'running'
  AND sr.finished_at IS NULL
  AND sr.started_at < clock_timestamp() - interval '2 hours'
ORDER BY sr.started_at;
A stale row is audit evidence. Confirm no live advisory-lock owner before any recovery action.

14.4 Market freshness summary
SELECT
    (SELECT max(trade_date) FROM public.market_summary) AS latest_market_summary,
    (SELECT max(trade_date) FROM public.daily_quote) AS latest_quote,
    (SELECT max(trade_date) FROM public.index_daily) AS latest_index,
    (SELECT max(trade_date) FROM public.technical_indicator_daily
      WHERE price_basis = 'raw') AS latest_raw_technical,
    (SELECT max(trade_date) FROM public.daily_valuation) AS latest_valuation,
    (SELECT max(quote_date) FROM public.kibor_rate) AS latest_kibor,
    (SELECT max(quote_date) FROM public.v_usdpkr_m2m_ready) AS latest_usdpkr;
Different datasets legitimately have different schedules. Compare each date with its source calendar rather than forcing equality.

14.5 Per-session component counts
SELECT
    ms.trade_date,
    (SELECT count(*) FROM public.daily_quote q
      WHERE q.trade_date = ms.trade_date) AS quote_rows,
    (SELECT count(*) FROM public.index_daily i
      WHERE i.trade_date = ms.trade_date) AS index_rows,
    EXISTS (
        SELECT 1
        FROM public.market_ai_summaries a
        WHERE a.trade_date = ms.trade_date
          AND a.summary_type = 'daily_market_close'
          AND a.status = 'completed'
    ) AS completed_ai_summary
FROM public.market_summary AS ms
ORDER BY ms.trade_date DESC
LIMIT 60;
AI summary absence is expected for historical backfill.

14.6 Missing required index codes on known sessions
WITH required(code) AS (
    VALUES ('KSE100'), ('KSE30'), ('ALLSHR'), ('KMI30'), ('KMIALLSHR')
)
SELECT ms.trade_date, required.code
FROM public.market_summary AS ms
CROSS JOIN required
JOIN public.market_index AS mi ON mi.code = required.code
LEFT JOIN public.index_daily AS id
  ON id.index_id = mi.id
 AND id.trade_date = ms.trade_date
WHERE id.index_id IS NULL
ORDER BY ms.trade_date DESC, required.code;
Interpret provider contracts and the reviewed 2026-07-21 ALLSHR exception before classifying a gap as an error.

14.7 Technical coverage
WITH eligible AS (
    SELECT security_id, trade_date, updated_at
    FROM public.daily_quote
    WHERE close IS NOT NULL
      AND close > 0
      AND close::text NOT IN ('NaN', 'Infinity', '-Infinity')
)
SELECT
    count(*) AS eligible_quotes,
    count(*) FILTER (WHERE ti.security_id IS NULL) AS missing_technical_rows,
    count(*) FILTER (
        WHERE ti.security_id IS NOT NULL
          AND (
              ti.calculation_version IS DISTINCT FROM 'ta_raw_v1'
              OR ti.source_updated_at IS DISTINCT FROM eligible.updated_at
          )
    ) AS stale_technical_rows
FROM eligible
LEFT JOIN public.technical_indicator_daily AS ti
  ON ti.security_id = eligible.security_id
 AND ti.trade_date = eligible.trade_date
 AND ti.price_basis = 'raw';
Expected missing/stale counts are zero after a healthy pipeline.

14.8 Raw quote range anomalies
SELECT
    count(*) FILTER (
        WHERE high IS NOT NULL AND low IS NOT NULL
          AND close IS NOT NULL
          AND (close > high OR close < low)
    ) AS close_outside_range,
    count(*) FILTER (
        WHERE high IS NOT NULL AND low IS NOT NULL
          AND open IS NOT NULL
          AND (open > high OR open < low)
    ) AS open_outside_range,
    count(*) FILTER (WHERE turnover < 0) AS negative_turnover
FROM public.daily_quote;
Nonzero range anomalies are raw-source observations requiring classification, not automatic updates.

14.9 Valuation health
SELECT
    count(*) AS valuation_rows,
    count(market_cap) AS market_cap_rows,
    count(pe_ratio_ttm) AS pe_rows,
    min(trade_date) AS first_date,
    max(trade_date) AS latest_date
FROM public.daily_valuation;

SELECT count(*) AS valuation_without_exact_quote
FROM public.daily_valuation AS v
LEFT JOIN public.daily_quote AS q
  USING (security_id, trade_date)
WHERE q.security_id IS NULL;

SELECT count(*) AS misattributed_valuation_dates
FROM public.daily_valuation
WHERE trade_date < (inserted_at AT TIME ZONE 'Asia/Karachi')::date;
The last two counts must be zero.

14.10 SCD2 current-row invariants
SELECT
    'company_profile_version' AS relation,
    security_id::text AS natural_key,
    count(*) FILTER (WHERE is_current) AS current_rows
FROM public.company_profile_version
GROUP BY security_id
HAVING count(*) FILTER (WHERE is_current) <> 1

UNION ALL

SELECT
    'equity_profile_version',
    security_id::text,
    count(*) FILTER (WHERE is_current)
FROM public.equity_profile_version
GROUP BY security_id
HAVING count(*) FILTER (WHERE is_current) <> 1

UNION ALL

SELECT
    'financial_statement',
    concat_ws(':', security_id, fiscal_year, period),
    count(*) FILTER (WHERE is_current)
FROM public.financial_statement
GROUP BY security_id, fiscal_year, period
HAVING count(*) FILTER (WHERE is_current) <> 1

UNION ALL

SELECT
    'financial_ratio',
    concat_ws(':', security_id, fiscal_year),
    count(*) FILTER (WHERE is_current)
FROM public.financial_ratio
GROUP BY security_id, fiscal_year
HAVING count(*) FILTER (WHERE is_current) <> 1;
Expected result: no rows.

14.11 KIBOR coverage and latest common curve
SELECT
    min(quote_date) AS first_date,
    max(quote_date) AS latest_date,
    count(*) AS tenor_observations,
    count(DISTINCT quote_date) AS publication_dates
FROM public.kibor_rate;

WITH latest AS (
    SELECT max(quote_date) AS quote_date
    FROM public.kibor_rate
)
SELECT k.quote_date, k.tenor, k.bid, k.offer
FROM public.kibor_rate AS k
JOIN latest USING (quote_date)
ORDER BY array_position(
    ARRAY['1W','2W','1M','3M','6M','9M','1Y']::text[],
    k.tenor
);
14.12 FX coverage
SELECT
    rate_type,
    min(publication_date) AS first_date,
    max(publication_date) AS latest_date,
    count(*) AS publications,
    sum(observation_count) AS declared_observations
FROM public.fx_publication
GROUP BY rate_type
ORDER BY rate_type;

SELECT
    min(quote_date) AS first_usdpkr_ready,
    max(quote_date) AS latest_usdpkr_ready,
    count(*) AS observations
FROM public.v_usdpkr_m2m_ready;
15. Identity diagnostics
15.1 Counts by user status
SELECT status, count(*)
FROM app_identity.user_account
GROUP BY status
ORDER BY status;
15.2 Google mapping cardinality
SELECT
    u.id AS user_id,
    u.status,
    count(l.id) AS google_login_count
FROM app_identity.user_account AS u
LEFT JOIN app_identity.external_login AS l
  ON l.user_id = u.id
 AND l.provider = 'google'
GROUP BY u.id, u.status
HAVING count(l.id) <> 1
ORDER BY u.id;
For the current Google-only product, expected result is no rows. Do not print subjects/emails merely to count mappings.

15.3 Recent authentication events
SELECT
    id,
    user_id,
    event_type,
    event_at,
    request_id,
    octet_length(metadata::text) AS metadata_bytes
FROM app_identity.authentication_audit
ORDER BY event_at DESC, id DESC
LIMIT 200;
Inspect metadata only when needed and only in a secured operator session.

15.4 Active user without active default portfolio
SELECT u.id AS user_id
FROM app_identity.user_account AS u
LEFT JOIN app_portfolio.portfolio AS p
  ON p.user_id = u.id
 AND p.status = 'active'
 AND p.is_default
WHERE u.status = 'active'
GROUP BY u.id
HAVING count(p.id) <> 1
ORDER BY u.id;
Expected result is no rows for fully initialized native users.

16. Portfolio diagnostics
16.1 Portfolio/user overview
SELECT
    u.status AS user_status,
    p.status AS portfolio_status,
    p.origin,
    p.is_default,
    count(*) AS portfolios
FROM app_portfolio.portfolio AS p
JOIN app_identity.user_account AS u ON u.id = p.user_id
GROUP BY u.status, p.status, p.origin, p.is_default
ORDER BY u.status, p.status, p.origin, p.is_default;
16.2 Open holdings reconstructed from lots
SELECT
    l.portfolio_id,
    s.symbol,
    sum(l.quantity) AS quantity,
    sum(l.quantity * l.unit_cost) AS total_cost,
    sum(l.quantity * l.unit_cost) / NULLIF(sum(l.quantity), 0) AS average_unit_cost,
    min(l.acquisition_date) AS first_acquisition,
    max(l.acquisition_date) AS latest_acquisition,
    count(*) AS open_lots
FROM app_portfolio.position_lot AS l
JOIN public.security AS s ON s.id = l.security_id
WHERE l.status = 'open'
GROUP BY l.portfolio_id, s.symbol
ORDER BY l.portfolio_id, s.symbol;
16.3 Latest quote valuation for open holdings
WITH holdings AS (
    SELECT portfolio_id, security_id, sum(quantity) AS quantity
    FROM app_portfolio.position_lot
    WHERE status = 'open'
    GROUP BY portfolio_id, security_id
), latest_quote AS (
    SELECT DISTINCT ON (security_id)
        security_id, trade_date, close
    FROM public.daily_quote
    WHERE close IS NOT NULL
    ORDER BY security_id, trade_date DESC
)
SELECT
    h.portfolio_id,
    s.symbol,
    h.quantity,
    q.trade_date AS latest_price_date,
    q.close AS latest_price,
    h.quantity * q.close AS market_value
FROM holdings AS h
JOIN public.security AS s ON s.id = h.security_id
LEFT JOIN latest_quote AS q ON q.security_id = h.security_id
ORDER BY h.portfolio_id, s.symbol;
16.4 Recent immutable activity
SELECT
    a.portfolio_id,
    a.id AS activity_id,
    s.symbol,
    a.activity_type,
    a.source_kind,
    a.position_effect,
    a.quantity,
    a.unit_price,
    a.trade_date,
    a.portfolio_version_before,
    a.portfolio_version_after,
    a.created_at
FROM app_portfolio.portfolio_activity AS a
JOIN public.security AS s ON s.id = a.security_id
ORDER BY a.created_at DESC, a.id DESC
LIMIT 200;
16.5 Native sale allocation reconciliation
SELECT
    a.id AS activity_id,
    a.portfolio_id,
    a.quantity AS sale_quantity,
    coalesce(sum(x.quantity), 0) AS allocated_quantity
FROM app_portfolio.portfolio_activity AS a
LEFT JOIN app_portfolio.activity_lot_allocation AS x
  ON x.activity_id = a.id
WHERE a.activity_type = 'native_sell'
GROUP BY a.id, a.portfolio_id, a.quantity
HAVING coalesce(sum(x.quantity), 0) <> a.quantity;
Expected result: no rows.

16.6 Position-removal reconciliation
SELECT
    a.id AS activity_id,
    a.portfolio_id,
    a.quantity AS removed_quantity,
    coalesce(sum(r.quantity), 0) AS snapshotted_quantity
FROM app_portfolio.portfolio_activity AS a
LEFT JOIN app_portfolio.position_removal_lot AS r
  ON r.activity_id = a.id
WHERE a.activity_type = 'position_removal'
GROUP BY a.id, a.portfolio_id, a.quantity
HAVING coalesce(sum(r.quantity), 0) <> a.quantity;
Expected result: no rows.

16.7 Stale reserved mutation requests
SELECT
    portfolio_id,
    mutation_id,
    user_id,
    operation_type,
    created_at,
    clock_timestamp() - created_at AS reserved_for
FROM app_portfolio.mutation_request
WHERE status = 'reserved'
  AND created_at < clock_timestamp() - interval '5 minutes'
ORDER BY created_at;
Investigate application/transaction logs before any action. A reserved row may belong to an in-flight transaction only if it is visible after commit; ordinary rollback removes it.

16.8 Watchlist state
SELECT
    w.user_id,
    w.status,
    w.origin,
    count(*) AS items,
    max(w.updated_at) AS latest_update
FROM app_portfolio.watchlist_item AS w
GROUP BY w.user_id, w.status, w.origin
ORDER BY w.user_id, w.status, w.origin;
16.9 User-specific investigation template
Replace the UUID in one secured session. Do not paste user profile values into tickets.

WITH target AS (
    SELECT '00000000-0000-0000-0000-000000000000'::uuid AS user_id
)
SELECT
    p.id AS portfolio_id,
    p.status,
    p.is_default,
    p.version,
    p.created_at,
    p.updated_at
FROM app_portfolio.portfolio AS p
JOIN target AS t ON t.user_id = p.user_id;

WITH target AS (
    SELECT '00000000-0000-0000-0000-000000000000'::uuid AS user_id
)
SELECT
    a.id,
    s.symbol,
    a.activity_type,
    a.quantity,
    a.unit_price,
    a.trade_date,
    a.created_at
FROM app_portfolio.portfolio_activity AS a
JOIN app_portfolio.portfolio AS p ON p.id = a.portfolio_id
JOIN public.security AS s ON s.id = a.security_id
JOIN target AS t ON t.user_id = p.user_id
ORDER BY a.created_at DESC;
17. Infrastructure and log diagnostics
PostgreSQL tables do not contain Docker, Traefik, Cloudflared, or API process logs. Use the deployment host for those.

17.1 Discover current containers
sudo docker ps --format 'table {{.Names}}\t{{.Status}}' \
  | grep -Ei 'webictcapital|cloudflared|traefik'
17.2 API logs
API_ID="$(sudo docker ps -q --filter 'name=webictcapital-api' | head -n1)"
sudo docker logs --since 30m --timestamps "$API_ID"
Use exact --since/--until windows when correlating a browser request or Cloudflare Ray ID.

17.3 Worker logs
WORKER_ID="$(sudo docker ps -q --filter 'name=webictcapital-dailypsxsummary' | head -n1)"
sudo docker logs --since 2h --timestamps "$WORKER_ID"
Change the name filter for ticker, KIBOR, or FX services. A container may be idle and still healthy between jobs.

17.4 PostgreSQL container logs
DB_ID="$(sudo docker ps -q --filter 'name=webictcapital-database' | head -n1)"
sudo docker logs --since 30m --timestamps "$DB_ID"
Correlate connection failures, restarts, recovery, checkpoints, deadlocks, and out-of-disk errors with the API/scraper timestamp. Do not publish logs containing connection strings or user data.

17.5 Cloudflared and Traefik
CLOUDFLARED_ID="$(sudo docker ps -q --filter 'name=webictcapital-cloudflared' | head -n1)"
sudo docker logs --since 30m --timestamps "$CLOUDFLARED_ID"

sudo tail -n 300 /etc/dokploy/traefik/dynamic/access.log
Current trust chain:

Cloudflared network webictcapital-cloudflared-b1gqqp, last observed subnet 172.24.0.0/16;
Traefik trusts that controlled subnet on the HTTP entrypoint;
API trusts the controlled Traefik-facing dokploy-network, last configured as 10.0.1.0/24;
API accepts one forwarded hop.
Recheck CIDRs after recreating networks or moving to the VPS.

17.6 Resource pressure and restarts
sudo docker stats --no-stream

sudo docker inspect "$API_ID" \
  --format 'status={{.State.Status}} health={{if .State.Health}}{{.State.Health.Status}}{{end}} restarts={{.RestartCount}} started={{.State.StartedAt}}'
17.7 Public smoke checks
curl -fsS https://api.webictcapital.com/health

curl -i \
  -H 'Origin: https://preview.webictcapital.com' \
  https://api.webictcapital.com/api/market-summary/latest/tickers
The CORS response should name the exact origin and allow credentials where appropriate.

For Google OAuth, confirm the authorization request contains:

redirect_uri=https://api.webictcapital.com/signin-google
An HTTP callback indicates proxy-forwarding trust is broken.

17.8 Symptom-to-investigation map
Symptom	First checks
Market request network error	Browser request URL, DNS, Cloudflare response/Ray ID, CORS headers, API health, Traefik/Cloudflared logs
HTTP 404 from API hostname	Confirm tunnel public-hostname route and actual API controller path; test /health separately
HTTP 400 on mutation	Inspect ProblemDetails; validate DTO/date/decimal fields and fresh CSRF cookie/header
HTTP 401 after Google callback	Check Secure application cookie, API Data Protection volume, exact frontend origin, active user_account, Google mapping, and /api/auth/me
Google redirect_uri_mismatch	Inspect generated redirect_uri; it must be HTTPS and exactly /signin-google; verify proxy trust and Google Console entry
HTTP 409 portfolio conflict	Refresh portfolio/lot versions; inspect mutation UUID/fingerprint state; check oversell/date-eligible lots; never resend changed data under the same UUID
HTTP 503 portfolio mutation	Check PORTFOLIO_WRITES_ENABLED; auth and CSRF may still be healthy
HTTP 503 Google start/completion	Check AUTH_CUTOVER_ENABLED
Unknown Google identity rejected	Check ALLOW_NEW_USER_REGISTRATION and whether the subject already has an external_login row; never match by email
Intermittent HTTP 502	Correlate Cloudflare Ray/time with API health, restarts, host resources, Traefik access, Cloudflared, and database logs
Empty P/E	Check daily_valuation.pe_ratio_ttm coverage; do not substitute PEG or calculate in frontend
Missing chart points	Check actual source publication/trading dates and reviewed gaps before classifying as data loss
17.9 Intermittent Cloudflare 502
If origin_bad_gateway returns:

record UTC timestamp, Ray ID, route, and retry-after;
check API health/restarts/resource pressure;
inspect API logs for the exact window;
inspect Traefik access logs;
inspect Cloudflared reconnect/origin errors;
check host network and database connection availability;
do not classify it as a frontend bug without origin evidence.
18. Current deployment and security contract
18.1 Domains
Domain	Current role
api.webictcapital.com	Home-server API through Cloudflare Tunnel until VPS move
preview.webictcapital.com	WebICT frontend feature branch
webictcapital.com	Existing main frontend, intentionally unchanged
The current frontend uses a full cross-origin API base URL. Do not replace it with relative /api unless a same-origin proxy is deliberately implemented and tested.

18.2 API environment names
ASPNETCORE_ENVIRONMENT
DATABASE_URL
AUTH_CUTOVER_ENABLED
ALLOW_NEW_USER_REGISTRATION
PORTFOLIO_WRITES_ENABLED
FRONTEND_ORIGIN
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
DATA_PROTECTION_KEYS_PATH
TRUSTED_PROXY_NETWORKS
AllowedHosts
For preview, FRONTEND_ORIGIN is the exact preview HTTPS origin and AllowedHosts includes the public API hostname.

18.3 Cookies and CSRF
WebICTCapital.Auth: host-only, HTTP-only, SameSite=Lax, Secure in production, bounded to eight hours.
WebICTCapital.External: host-only, HTTP-only, SameSite=Lax, Secure in production, /api/auth, bounded to five minutes.
Google tokens are not saved.
Every mutation/logout obtains a fresh token from /api/auth/csrf and sends X-CSRF-TOKEN.
Data Protection uses application name WebICTCapitalApi and persistent path /var/lib/webictcapital-api/dataprotection-keys.
18.4 Secrets
Never place database credentials, Google client secrets, LLM keys, Supabase service-role keys, Cloudflare tunnel tokens, cookies, or OAuth tokens in source, Vite variables, logs, documentation, or chat.

Credential-shaped values were exposed during troubleshooting. Rotate every value that may have been real and verify that none entered Git history.

19. Optional exporter/importer status
The tools remain implemented and tested, but the operator chose not to migrate existing Supabase portfolios.

No real export was run.
No real import was run.
Existing Supabase portfolio history is absent from app_portfolio.
Native WebICT identities/portfolios can be created through enabled registration.
The exporter remains a separate read-only administrative CLI.
The importer consumes local reviewed files only.
Real export artifacts must never enter the repository or normal API image.
Last legacy Supabase user audit: 167 total users, with zero currently banned, deleted, unconfirmed, or anonymous at that audit time. This was a source snapshot, not an import result.

Verify that no real batch was imported:

SELECT
    count(*) AS import_batches,
    count(*) FILTER (WHERE status = 'completed') AS completed_batches,
    max(finished_at) AS latest_finished_batch
FROM app_portfolio.import_batch;
For the chosen native-start path, expected counts are zero.

If the import path is ever revived, legacy BUYs are opening lots and legacy SELLs are position-neutral history; no cash is inferred.

20. Change and troubleshooting checklist
Every future change must answer:

Which project owns the write?
Which schema/relation/API/frontend feature consumes it?
Does it change a natural key, source identity, date meaning, unit, null meaning, price basis, calculation version, or wire type?
Is it documentation-only, code-only, an operational recovery, or a new forward-only migration?
Are identical reruns still no-ops with stable timestamps?
Can partial, empty, mixed-provider, or ambiguous input delete facts?
Are history, ownership, idempotency, CSRF, and optimistic versions preserved?
Are scraper, database, API, exact-number, frontend-isolation, and routing tests updated?
Has the canonical revision been advanced and mirrored?
Have secret scans and deployment smoke tests passed?
No agent or operator may declare the platform healthy from process exit codes alone. Completion requires fact coverage, constraint state, source freshness, endpoint checks, authenticated behavior, and infrastructure evidence appropriate to the change.

