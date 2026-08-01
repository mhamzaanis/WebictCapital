WebICT Capital canonical platform contract

Canonical database, ingestion, API, frontend, operations, and data-qualitycontract for the PSX/SBP platform.

Item

Contract

Database

PostgreSQL 14 or newer

Database schemas

public (applied market/reference facts); app_identity (applied migration 007);
app_portfolio (proposed migration 008, not applied in production)

Business timezone

Asia/Karachi

Date/time exchange

ISO 8601; PostgreSQL date for logical dates and timestamptz for instants

Frontend access

Public market data through the API; current identity/portfolio through Supabase
until coordinated cutover; never connect the browser directly to PostgreSQL

Schema changes

Forward-only SQL migrations for existing databases; the embedded DDL below is
the complete public market-data DDL for a fresh database, not the application
schemas

Contract revision

2026-08-01.4

Production migration level

Migration 007 applied on 2026-08-01; migration 008 is proposed only

Current price basis

Raw, unadjusted PSX prices

Purpose and authority

This file is the cross-service source of truth for:

table, view, key, relationship, and data-type semantics;

which scraper owns each write surface;

scheduling and dependency order;

public API read models, authenticated identity/portfolio behavior, and frontend
consumption rules;

idempotency, history, freshness, and recovery behavior; and

the complete public market-data schema expected by a fresh installation and the
numbered migrations that govern application schemas.

It is documentation, not a migration runner. On an existing production
database, apply only the next reviewed numbered migration. Do not paste the
public market-data DDL section over an existing database, and do not modify or
rerun migrations 006 or 007.

When this file, a scraper, and an API DTO disagree, stop the deployment andresolve the mismatch. Do not silently coerce one source into another semanticshape.

This revision consolidates the six divergent schema copies supplied on2026-07-31. Where those copies conflicted, deployed and production-verifiedbehavior wins over older prose. In particular, the following are authoritative:

the daily scheduled entrypoint is pipeline_runner.py, not a shell &&chain and not two independent schedules;

company valuation requires the exact Karachi run-date quote, never the latestearlier quote;

daily quote/index/summary merges are conditional and preserve timestamps onan identical rerun;

migration 006 and its two quarantine tables are part of the productioncontract;

ticker comparison accepts two to four stocks and up to two benchmarks; and

storage code ALLSHR and public benchmark spelling KSEALL are explicitly
distinguished below;

migration 007 is applied in production while migration 008 is implemented,
reviewed, and tested but remains proposed and unapplied; and

the implemented Google-cookie and portfolio APIs remain cutover-gated while the
production React frontend and identity/portfolio writes remain on Supabase.

Distribution rule for every repository

Maintain one reviewed canonical copy of this file. The scraper, API, andfrontend repositories may mirror it for local context, but their copies areread-only outputs. A project-specific agent must propose contract changesagainst the canonical file and must not silently rewrite its own copy.

At minimum, CI should compare the canonical contract revision across thesecodebases:

Codebase/service

Contract responsibility

PsxSummaryScraper

Daily PSX import, index import, technical calculation, pipeline lifecycle

TickerScraper

Company/profile/equity/valuation/fundamental/event persistence

KiborScraper

Official SBP KIBOR catalogue and PDF ingestion

SbpFxRates

Official SBP FX catalogue, publication, and observation ingestion

ASP.NET Core API

Anonymous read-only market DTOs plus cutover-gated identity/session behavior and
authenticated native portfolio/watchlist mutations

React frontend

Currently Supabase-backed for identity/portfolio; future WebICT mode is API-only
for authentication and portfolio data, with chart alignment, gaps, nulls, and
formatting preserved

Identity and portfolio storage use dedicated application schemas and do notchange the ownership or meaning of public market facts. Their boundary andmigration status are documented later so an agent cannot assume proposedportfolio tables already exist.

Schema and implementation state

| Schema/surface | Implemented repository state | Production state |
| --- | --- | --- |
| public | Market/reference DDL, migrations, anonymous read APIs, and scraper writers are implemented. | Applied and authoritative for WebICT market/reference facts. |
| app_identity | Migration 007 plus cutover-gated Google cookie/session code are implemented and verified. | Migration 007 applied 2026-08-01; its three tables were empty immediately after application; no identity import has occurred. |
| app_portfolio | Migration 008, authenticated APIs, PortfolioImporter, and offline SupabaseExporter are implemented, reviewed, and tested. | Proposed and unapplied; objects and imported facts do not yet exist in production. |

Implemented code is not evidence that its proposed production objects or data
exist. AUTH_CUTOVER_ENABLED=false and ALLOW_NEW_USER_REGISTRATION=false remain
the deployed values, and the React frontend continues to use Supabase.

Contents

System topology

Runtime services and schedules

Ownership and source mapping

Provenance and source codes

Relational model and key semantics

API contract

Frontend contract

Known production state and unresolved work

Deployment and migration procedure

Complete public market-data DDL

Contract change checklist

System topology

flowchart LR
    PSX["PSX DPS and KSEStocks"] --> PSXS["PSX daily + company scrapers"]
    SBP["Official SBP catalogues and PDFs"] --> SBPS["KIBOR + FX scrapers"]
    PSXS --> DB[(PostgreSQL)]
    SBPS --> DB
    DB --> API["ASP.NET Core API"]
    API --> FE["Web frontend"]
    SUPA["Supabase identity + portfolio (current authority)"] --> FE
    CF[Cloudflared] --> API

PostgreSQL is the durable system of record for public market/reference facts and
the applied identity foundation. Scraper containers are workers invoked by
Dokploy schedules. The ASP.NET Core API is the only supported browser boundary
to PostgreSQL, and Cloudflared exposes that API without exposing PostgreSQL.
Until coordinated cutover, the React frontend continues to use Supabase for
identity and portfolio data; it must never connect directly to PostgreSQL.

Runtime services and schedules

All cron expressions below are interpreted in Asia/Karachi. Dokploy runs thecommand inside the already-deployed service container. Containers remain idlebetween jobs; internal Python schedulers must remain disabled.

Order

Dokploy service

Command

Cron

Local schedule

Purpose

1

PsxSummaryScraper

/usr/local/bin/python -u /app/pipeline_runner.py

30 17 * * 1-5

17:30 Mon–Fri

Non-overlapping daily import followed by incremental raw-price technical calculation after committed success or partial work

2

KiborScraper

/usr/local/bin/python -u /app/sbp_kibor.py

10 18 * * 1-5

18:10 Mon–Fri

Official SBP KIBOR publications

3

SbpFxRates

/usr/local/bin/python -u /app/sbp_fx_rates.py --max-publications 100

40 18 * * 1-5

18:40 Mon–Fri

Official SBP FX publications and normalized observations

4

TickerScraper

/usr/local/bin/python -u /app/psx_scraper.py --all-securities --no-json

20 19 * * 1,3,5

19:20 Mon/Wed/Fri

Company profiles, equity, valuation, fundamentals, ratios, announcements, payouts, and reports

The gaps reduce load on the database and upstream sites. They are operationalspacing, not a correctness mechanism: every importer must remain transactionallysafe and idempotent if jobs overlap or are retried. A job should fail fast whenits own advisory lock cannot be acquired; the PSX daily and company importersmust use distinct locks.

The always-on services are PostgreSQL, the ASP.NET Core API, and Cloudflared.They do not belong in the scraper schedule.

pipeline_runner.py is the scheduled one-shot entrypoint. It holds a distinctsession advisory lock across both child processes. It runscompute_technicals.py after a committed successful or partial daily import,including a synchronized import with zero fact writes. It preserves retryableor fatal component results and does not launch a follow-up step after fatalimport failure, confirmed importer-lock contention, or shutdown.compute_technicals.py remains available on demand with --full,--symbol SYMBOL, or --dry-run; do not schedule it separately from the dailypipeline.

Scheduler-facing exit statuses are 0 for success, synchronized/no changes,authoritative no-data, or a pipeline-lock collision where another completepipeline owns the work; 1 for committed partial/retryable work; 2 for fatalfailure; and 128 + signal for shutdown. Internal exit 3 is reserved for animporter or calculator advisory-lock collision. A child importer-lock collisionmaps to scheduler status 1 because it does not prove that a complete pipelineowns the work. A busy technical lock after a committed import maps to schedulerstatus 1 unless coverage of the newly committed quote watermark can be proven.Selecting zero affected securities is a successful idempotent technical run.

Both PSX worker images run as UID/GID 10001. Their idle service process iscontainer_idle.py, not sleep infinity. PID 1 forwards SIGTERM/SIGINT to anactive Dokploy docker exec process and waits for its database transaction tofinish or roll back. The daily wrapper uses a 60-second grace window; thecompany wrapper must provide a bounded grace window. SIGKILL cannot be handled,so durable database checkpoints remain mandatory.

Never restore the obsolete scheduled command:

parse_psx.py && compute_technicals.py

Importer status 1 represents committed partial/retryable work and must stillbe followed by incremental technical calculation. The pipeline runner preservesthat nonzero final status after technicals complete.

Ownership and source mapping

PSX daily market importer

parse_psx.py owns the daily market facts.

Data

Authoritative source

Write surface

Listed symbols and company names

PSX DPS closing-rate publication

security

Ticker OHLC, change, section, and turnover

PSX DPS closing-rate PDF

daily_quote

Whole-market volume and breadth

PSX DPS closing-rate PDF

market_summary

Current/latest KSE index snapshot

PSX DPS live index panels

market_index, index_daily

Historical KSE index snapshot

KSEStocks Market Summary

market_index, index_daily

Latest complete trading-day narrative

Configured LLM, using imported market facts

market_ai_summaries

KSE index values must never be parsed from the closing-rate PDF. The PDF isauthoritative only for ticker rows and market-wide summary fields. The currentday routes to PSX DPS index panels; a historical day routes to KSEStocks.Those routes are separate ownership scopes, not interchangeable globalsnapshots. dps_index explicitly manages KSE100, KSE100PR, ALLSHR,KSE30, KMI30, and KMIALLSHR. ksestocks_index explicitly managesKSE100, ALLSHR, KSE30, KMI30, and KMIALLSHR; KSEStocks has noKSE100PR contract. Optional codes outside the active route and rows owned byanother or unrelated source remain untouched.

ALLSHR is the storage/importer code used in the verified database and sourcecontracts. The comparison API currently accepts the public spelling KSEALL.The API must map that alias explicitly to ALLSHR; it must not create a secondmarket_index row, compare display names, or depend on a numeric index ID. Afuture migration may standardize the name only after all stored facts and APIclients are audited together.

daily_quote.turnover is traded share quantity, not PKR traded value. A valuesuch as close * turnover is only an estimated traded-value feature and mustbe labeled as derived. OHLC rows preserve official source observations. Zero ormissing open/high/low values and apparent range anomalies are never averaged,clamped, swapped, or fabricated in the raw table; downstream models must applyan explicit, versioned eligibility policy.

Backfill completeness is determined from required rows for each candidate date,not from MAX(trade_date) alone. A newer row must not hide an older hole. Eachdate commits atomically, so a stopped run resumes from remaining incompletedates. A network or parsing failure is retryable and must not be recorded as aholiday. The AI summary is skipped during historical backfill and is generatedonly for the latest complete trading date.

The daily importer plans closing-rate and index repair independently. If thestored closing component is already complete and only indexes are incomplete,it does not refetch or rewrite the quotes or market summary. HTTP, parsing,required-row completeness, and persistence failures remain actionable andvisible. A prior partial audit caused only by a reviewed optional index noticecan be finalized from independently validated complete database facts withoutrepeated source churn.

One exact required-index exception is reviewed and terminal. For ALLSHR on2026-07-21, both DPS and KSEStocks published open 106995.80, high 107857.74,low 106600.00, close 106568.82, change 149.03, change percent 0.14, volume1000730920, and previous close 106419.79. Because the close is 31.18 pointsbelow the published low, the observation remains invalid and is intentionallyabsent from index_daily; no value is inferred, clamped, swapped, or replacedwith KSE100PR. Only that date, canonical ALLSHR code, reviewed provider,and exact canonical numeric payload match fingerprint47b725f9da779b604cb5f0acad82055616bcdde72e5f5a70303ea07c39a04dc7.The successful psx_daily_import audit records the provider, values, reason,classification, resolution, and fingerprint in scrape_run.notes. That exactvalidated note resolves the required index component with a reviewed gap, sothe date is not automatically retried. Any changed payload is validated underthe ordinary strict rules and can either insert a corrected row or remainretryable. Operators can explicitly recheck the source withparse_psx.py --recheck-reviewed-anomalies 2026-07-21; complete closing factsare reused while the index component is fetched again.The reviewed gap resolves only the exact missing provider observation and doesnot expand its prune scope. It cannot delete a valid row owned by anotherprovider, including a DPS ALLSHR, and KSE100PR remains a distinct optionalDPS fact.

The narrow recovery commandparse_psx.py --repair-dps-kse100pr 2026-07-21 fetches the official DPS panel,requires the panel as_of date to match, validates the observation normally,and conditionally merges only KSE100PR without pruning. The audited officialpayload is previous close 53642.22, high 54387.03, low 53683.37, close53704.98, volume 448767016, change 62.76, change percent 0.12, and as_of2026-07-21 15:50 Asia/Karachi. DPS supplied no open in that panel, so the storedopen remains null; the importer does not infer one. If the live panel has movedto another date, recovery fails rather than assigning newer values to the olddate.Since the DPS historical search does not return index rows, the separatereview-only fallback recovery/restore_dps_kse100pr_2026-07-21.sql uses thosesame audited official values. It is guarded, transactional, conditionallyidempotent, advisory-locked, and audited in scrape_run; it is an operationalrecovery artifact and not a migration.

Incoming quote and index snapshots are normalized and deduplicated before anywrite. Rows are merged in place first. Their inserted_at is preserved, andtheir updated_at changes only when the row-wise material payload is distinct.Only a validated complete, nonempty, at-least-threshold component may thenprune same-date natural keys absent from its incoming ID set. Index pruning isfurther restricted to existing rows whose source_id and canonical code bothbelong to the explicit active provider contract. Partial, empty, undersized,mixed-provider, missing-contract, or otherwise ambiguous snapshots neverprune. Each index prune is audited with canonical code, previous source code,and reason. A genuine complete-snapshotomission deletes only that absent quote or index; quote foreign-key cascadestherefore affect only the omitted quote's dependent valuation and technicalrows. An identical complete rerun performs zero fact writes and preserves allquote children and timestamps.

Technical-indicator calculator

compute_technicals.py is the sole writer of technical_indicator_daily.parse_psx.py remains the owner of daily_quote; the calculator reads thattable and security but must never update, delete, or otherwise repair eithersource table. It makes no external HTTP requests and produces no JSON files.

The calculator stores only price_basis = 'raw'. The schema permits anadjusted basis for a future, separately specified pipeline, but no adjustedprices currently exist and consumers must not interpret raw indicators assplit- or dividend-adjusted. calculation_version is calculation metadata, notpart of the primary key: recalculating a security with a new version replacesthe row for the same security, date, and price basis.

The worker validates its source and destination columns, then holds thesession-level PostgreSQL advisory lock named psx_technical_indicators for therun. Each security is a separate transaction. Thus an interrupted or partiallyfailed run preserves completed securities and safely rediscovers unfinishedones on its next invocation. If execution is interrupted during an activesecurity, that transaction is explicitly rolled back before the advisory lockis released, so the unlock commit cannot commit partial indicator work.

Initial and recovery behavior:

when technical_indicator_daily is empty, every security with quote historyis processed from its first quote through its latest quote;

otherwise, a security is affected when an eligible positive-close quote hasno raw technical row, its daily_quote.updated_at is distinct from thematching technical_indicator_daily.source_updated_at, or the storedcalculation version is not current. A security is also affected when anexisting raw technical row's source close becomes null, non-positive, ornon-finite;

--full explicitly selects all quote histories and --symbol MEBL explicitlyselects one complete history; --dry-run calculates and reports withoutwriting or deleting;

every affected security is recalculated from complete quote history, not froma short lookback, so a historical correction repairs all later recursiveEMA, RSI, MACD, and ATR values; and

conditional UPSERTs use IS DISTINCT FROM, so an identical rerun is a no-opand preserves calculated_at. After recalculation, every raw row whose dateis absent from the exact eligible-date set is removed, including rows whosesource quote still exists but has become null, non-positive, or non-finite.Cleanup never touches future adjusted-basis rows and is not restricted bycalculation version.

Only actual trading observations participate. Rows with a null, non-finite, ornon-positive close are skipped, and calendar/weekend rows are never generated.Close drives price indicators; turnover drives the volume indicator.These recovery and transaction-safety corrections require no database migration.

PSX company importer

psx_scraper.py, psx_company_transform.py, and psx_company_db.py form onelogical importer. security is the shared issuer dimension; the daily importerdefines its universe and the company importer may only enrich a nonblank companyname.

Component

Write surface

Persistence rule

Profile

company_profile_version

SCD2, one current version per security

Shares/free float

equity_profile_version

SCD2; market cap is deliberately excluded

Market valuation

daily_valuation

Full-PKR market cap and nullable source P/E, only when the same security has an exact Karachi run-date quote

Statements

financial_statement

SCD2 by security, fiscal year, and period

Ratios

financial_ratio

SCD2 by security and fiscal year

Announcements

announcement

Append/correct by issuer-scoped document ID, otherwise content hash

Payouts/results

company_payout

Append/correct by stable event hash

Financial-report files

financial_report_document

Append/correct by issuer-scoped document ID, otherwise content hash

Each ticker is one transaction. A failed ticker rolls back without undoingprevious successful tickers in the same run. Missing or regressed optional datamust not replace a complete current SCD2 row. Re-importing identical content isa no-op.

The transform and persistence layers distinguish persistable from complete.persistable means every field that would be stored is semantically valid;false means no version may be inserted, even on an empty database. completemeans a valid component is sufficiently complete to supersede a current SCD2row. Shares and free-float shares are nonnegative, free-float percent is in[0,100], and positive free-float shares may not exceed shares. Zero,malformed, missing, NaN, and Infinity source values are never used to infer areplacement field. A rejected equity component does not reject a separatelyvalid market cap, but that valuation still requires the exact run-date quote.

daily_valuation.pe_ratio_ttm is a nullable source observation. It is not PEG,and PEG from financial_ratio.values is not a substitute. At the 2026-07-31consolidation audit, all 483 valuation rows had market capitalization and zerohad P/E, so the current importer has not populated this column. That is a knownTickerScraper extraction/transform/persistence gap, not a missing databasecolumn and not an API calculation task. Until it is fixed, APIs return null andthe frontend displays N/A. Never average, forward-fill, or copy a current P/Ebackward. Historical P/E requires a point-in-time source or a separatelyversioned calculation from earnings that were actually available on each date.

Because the company job runs Monday/Wednesday/Friday, valuation observationsare intentionally sparser than daily_quote. A weekend/manual run does notattach current page values to Friday. The API must always expose the valuationasOf date independently of the quote range.

Duplicate statement periods and ratio years are compared by canonical payload.Identical duplicates collapse to one record. Conflicting duplicates make theentire natural key ambiguous, so all occurrences of that period/year areomitted with an actionable warning. No source-order winner is selected.

A reversed book-closure range is accepted only when genuinely distinct sourcecolumns explicitly label start/from and end/to and therefore prove a parsercolumn reversal. A shared range header is not independent evidence: itsreversed event is omitted and the warning retains the exact raw source range.

For --all-securities, the importer uses the latest observeddaily_quote.section, exact reviewed aliases, and fetched page/company-nameevidence. ETF identities, rights (including names ending (R), (R1), etc.),preference and non-voting instruments, debt, warrants, derivatives, namesmarked DELISTED/XDDELISTED, and obsolete names marked CHANGED are neutralper-ticker not_applicable outcomes. Symbol suffix guessing alone must neverexclude an ordinary issuer. The canonical fetched company-page ticker mustequal the requested ticker before persistence. Classification never deletessecurity or daily_quote history; retaining historical prices avoidssurvivorship bias.

The importer holds one session advisory lock and commits each tickerindependently. After each ticker it checkpoints rows_written, completed andper-outcome counts, the last completed ticker, and sanitized bounded outcomedetails in scrape_run.notes. Once a process acquires the lock, it finalizesolder still-running psx_company rows as failed/interrupted before creating anew run; a live lock owner cannot be marked stale. Normal exceptions andSIGTERM are finalized where possible. SIGKILL cannot be handled, so the latestcheckpoint is the audit trail. A rerun always re-evaluates selected tickers andrelies on idempotency rather than unsafe cursor skipping.

The latest reviewed full-run snapshot (scrape_run.id = 8089) requested 649tickers: 522 succeeded, 41 were partial, zero failed, 86 were neutralnot_applicable, and 461 domain rows were written. A partial ticker does notmean its committed components are corrupt; it means at least one component wasomitted or needs review. Known warning classes are:

Class

Last reviewed count

Required handling

Empty ratio years

38

Omit the empty year; do not manufacture zero ratios

Invalid equity values

12

Reject the equity component; examples include ADOS, BCML, WYETH, and PACE

Missing optional titles

8

Omit only the malformed optional entry

Reversed payout ranges

2

Omit unless independent labeled columns prove direction; AICL and DCR remain reviewed examples

Unsupported Q5/Q6 periods

2

Keep omitted and investigate DSML source semantics

Missing company profiles

2

Review source/page classification; MODAMR and PKGIR were observed

Non-finite PEG

1

Reject the ratio value; PEG is not P/E

Financial-report HTTP 404

1

Keep visible until an explicit source-backed no-data policy is reviewed; OLPL was observed

Counts are audit snapshots, not schema invariants. A changed upstream responsemust be validated normally. Reviewed optional omissions must not make theschedule fail forever, while HTTP, identity, ambiguity, invalid numeric, andpersistence failures remain visible in sanitized scrape_run.notes.

This importer does not write daily_quote, market_summary, market_index,index_daily, kibor_rate, fx_publication, or fx_rate_observation.

SBP KIBOR importer

sbp_kibor.py reads the official SBP publication catalogue and PDFs. It ownskibor_rate and uses the kibor data-source code. The supported source tenorsare 1W, 2W, 1M, 3M, 6M, 9M, and 1Y; each observation contains abid and offer for its publication date.

Backfill candidates come from the official catalogue. Therefore weekends andholidays without a publication are not missing rows. A transient download orparse failure remains retryable. An identical re-import must not alter values ortheir updated_at timestamp.

The importer keeps catalogue date, URL, declared document date, byte size,SHA-256, parser outcome, and any canonical alias in structured audit notes. Acatalogue alias stores facts only under the authoritative document date; itdoes not create a duplicate weekend row. A reviewed source anomaly is terminalno_data only for the exact pinned file and reason. If bytes change, ordinaryvalidation runs again.

The following ten catalogue entries are reviewed policy, not missing work:

Catalogue date

Resolution

Stored fact behavior

2021-01-09

Byte-identical Saturday alias of document date 2021-01-11

Reuse/import all seven canonical Monday facts; no Saturday facts

2021-02-20

Byte-identical Saturday alias of 2021-02-22

Reuse/import Monday facts only

2021-09-06

Official 2W row has offer 7.44 below bid 7.94

Terminal source anomaly; do not swap or insert a partial curve

2022-05-20

Official 6M offer token is malformed as 14..87

Terminal source anomaly; do not invent the value or insert a partial curve

2023-07-15

Byte-identical Saturday alias of 2023-07-17

Reuse/import Monday facts only

2023-07-26

Official PDF is truncated and lacks a valid terminal xref/EOF

Terminal source anomaly

2025-07-24

Official PDF is truncated and lacks a valid terminal xref/EOF

Terminal source anomaly

2025-07-31

Official 2W row has offer 11.34 below bid 11.84

Terminal source anomaly; do not swap

2025-08-01

Official PDF is truncated and lacks a valid terminal xref/EOF

Terminal source anomaly

2026-05-19

Catalogue attachment is an FX Mark-to-Market document, not KIBOR

Terminal dataset mismatch

The reviewed run after deployment classified all ten with zero failures and asecond run selected zero pending entries. These exceptions must remainSHA-pinned and test-covered; a generic “ignore bad PDFs” rule is forbidden.

SBP FX importer

sbp_fx_rates.py reads official SBP catalogue entries and PDFs and uses thefx data-source code. It owns fx_publication and fx_rate_observation.

One publication row records the source document and its logical dates. Its childobservations retain currency pair, tenor, and value shape. Four publicationfamilies are intentionally distinct:

conversion

open_market

weighted_average_customer

mark_to_market

Consumers must retain both rate_type and tenor; rates with differentsemantics must never be blended into one series. A row contains either a singlepositive rate or a positive ordered bid/offer pair, never both.

v_sbp_fx_rates is the full normalized query surface. For the platform's mainUSD/PKR chart and PSX correlation, use v_usdpkr_m2m_ready, which selects onlyMark-to-Market USD/PKR ready observations. The older generic fx_rate table isreserved for a future market-feed OHLC importer and is not populated by the SBPPDF scraper.

As with KIBOR, publication discovery is catalogue-driven. A missing catalogueentry is not synthesized, and a failed download is not treated as a holiday.

The FX importer extracts a label-aware declared date and verifies datasetidentity before parsing or persistence. Current/newest publications areprocessed before historical backlog; --max-publications 100 is a work bound,not a semantic limit. Download/parser failures and database persistencefailures are logged separately. The following wrong catalogue mappings arereviewed terminal rejections and produce no duplicate/mislabelled publication:

Catalogue key

Reviewed document identity

2024-03-08 conversion

Serves a Mark-to-Market document dated March 8

2025-06-26 open_market

Document declares June 27; canonical June 27 publication already owns the fact

2026-03-13 open_market

Document declares March 12; canonical March 12 publication owns the fact

2026-06-01 mark_to_market

Serves a weighted-average-customer sheet

2026-06-04 mark_to_market

Serves a weighted-average-customer sheet

2026-06-05 mark_to_market

Serves a weighted-average-customer sheet

2026-06-11 mark_to_market

Genuine Mark-to-Market sheet declares June 10; canonical June 10 publication owns the fact

These entries resolve as reviewed no_data, not failed retries. A changed URLor document must pass normal identity/date validation rather than inheritingthe old exception.

Relation ownership matrix

Only the named owner may mutate a relation in normal operation. Migrations andreviewed recovery scripts are exceptional operator actions.

Relation/view

Normal writer/owner

Primary readers

data_source, scrape_run

Each importer for its own source/run

Operators

security

PSX daily importer; company importer may enrich only a nonblank name under its contract

Company importer, API, research

daily_quote, market_summary, market_index, index_daily, market_ai_summaries

PSX daily importer

Technical calculator, API, research

technical_indicator_daily

Technical calculator

API, research

daily_valuation, company SCD2 tables, announcements, payouts, reports

PSX company importer

API, research

Company quarantine tables

Migration 006 only

Operators/auditors

kibor_rate

KIBOR importer

API, research

fx_publication, fx_rate_observation

SBP FX importer

Views, API, research

v_sbp_fx_rates, v_usdpkr_m2m_ready

Database schema/migrations

API, research

Generic fx_rate, metal_rate

No deployed importer

No production feature should assume coverage

v_current_* views

Database schema/migrations

API and ad-hoc read-only analysis

app_identity.user_account, app_identity.external_login,
app_identity.authentication_audit

ASP.NET Core identity/session code and the approved cutover importer; schema
shape is owned by applied migration 007

ASP.NET Core authentication, approved operators/auditors, and the approved
cutover importer

app_portfolio relations from migration 008 (proposed; absent from production)

ASP.NET Core portfolio/watchlist code and the approved cutover importer after
migration 008 is separately approved and applied; schema shape is owned by
migration 008

ASP.NET Core portfolio reads/mutations and approved operators/auditors after
application

Market-data scrapers must never write app_identity or app_portfolio. Browser
clients never access any PostgreSQL schema directly and never receive database
credentials.

Provenance and source codes

Every importer registers or reuses a stable data_source.code and recordsattempts in scrape_run. IDs are database-local surrogate keys; consumers usethe code.

data_source.code

Owner / meaning

psx_daily_import

Orchestration/audit record for a PSX daily import

psx_closing

Official PSX closing-rate PDF facts

dps_index

Current PSX DPS index panels

ksestocks_index

Historical KSEStocks index summary

psx_company

PSX company pages and documents

kibor

Official SBP KIBOR publications

fx

Official SBP FX publications

metals

Reserved for a future metal-rate importer

scrape_run.status has these meanings:

Status

Meaning

running

Active lock-owning import; the next lock owner recovers an abandoned row as failed/interrupted

success

All requested components completed and committed

partial

Some components/tickers committed and warnings are recorded

failed

No valid completion for the requested unit of work

no_data

The authoritative catalogue/source confirms no applicable data; never use this for a transient error

rows_written is an operational counter, not the final row count. The dailyimporter counts only actual fact inserts, material updates, and validatedcomplete-snapshot prunes; no-op conflicts count as zero. Structured notes alsosplit these counts by daily_quote, market_summary, and index_daily. Usefact-table queries to verify stored coverage.

not_applicable is never a scrape_run.status; it is a neutral per-tickeroutcome stored in the structured JSON text in scrape_run.notes. A run made uponly of success and not_applicable outcomes finishes success and exits zero.Reviewed expected optional omissions are non-actionable notices. HTTP and pageidentity failures, ambiguous duplicates, invalid numeric components, andpersistence failures remain actionable warnings/failures. Notes preserve everysanitized warning detail and never include credentials.

A reviewed_terminal_source_anomaly note is non-actionable only when itsprovider, logical date, canonical index code, complete canonical values, andSHA-256 fingerprint exactly match a code-reviewed policy. It recordsresolution = resolved_with_reviewed_gap; it does not manufacture a fact row.The automatic planner revalidates the structured note before treating themissing natural key as resolved.Resolution does not grant global snapshot authority and cannot prune anexisting observation from another provider.

Relational model and key semantics

erDiagram
    DATA_SOURCE ||--o{ SCRAPE_RUN : audits
    DATA_SOURCE ||--o{ DAILY_QUOTE : sources
    DATA_SOURCE ||--o{ INDEX_DAILY : sources
    DATA_SOURCE ||--o{ KIBOR_RATE : sources
    DATA_SOURCE ||--o{ FX_PUBLICATION : sources

    SECURITY ||--o{ DAILY_QUOTE : has
    DAILY_QUOTE ||--o| DAILY_VALUATION : exact_date_parent
    DAILY_QUOTE ||--o{ TECHNICAL_INDICATOR_DAILY : exact_date_parent
    SECURITY ||--o{ COMPANY_PROFILE_VERSION : versions
    SECURITY ||--o{ EQUITY_PROFILE_VERSION : versions
    SECURITY ||--o{ FINANCIAL_STATEMENT : versions
    SECURITY ||--o{ FINANCIAL_RATIO : versions
    SECURITY ||--o{ ANNOUNCEMENT : accumulates
    SECURITY ||--o{ COMPANY_PAYOUT : accumulates
    SECURITY ||--o{ FINANCIAL_REPORT_DOCUMENT : accumulates

    MARKET_SUMMARY ||--o{ MARKET_AI_SUMMARIES : summarized_by
    MARKET_INDEX ||--o{ INDEX_DAILY : has
    FX_PUBLICATION ||--|{ FX_RATE_OBSERVATION : contains

Foreign keys use database-local surrogate IDs internally. Natural keys andlogical dates define public identity and idempotency.

Stable dimensions and opaque IDs

security.id, market_index.id, publication IDs, and event IDs are surrogatekeys. Sequence values are expected to be sparse and non-contiguous becausePostgreSQL sequences are not rolled back and conflict attempts may consumevalues. This is normal. APIs and frontend routes must identify securities bysecurity.symbol and indexes by market_index.code, never by display order orthe apparent size of an ID.

Daily facts

Daily-series tables use a natural entity/date key and are safe to UPSERT:

Table

Grain / key

Notes

daily_quote

one security per trade_date

Authoritative PSX ticker OHLC and turnover

technical_indicator_daily

one security, trade_date, and price basis

Derived raw-price indicators; current calculation version replaces the same basis row

market_summary

one trade_date

Market-wide breadth and volume

index_daily

one index per trade_date

Source is DPS or KSEStocks, never the PDF

daily_valuation

one security per trade_date

Full PKR market cap and nullable source P/E; company market-cap value is multiplied by 1,000

kibor_rate

one quote_date and tenor

Bid/offer point observation

fx_rate

one date and currency pair

Reserved generic OHLC surface; it has no tenor column and is not written by the SBP PDF importer

metal_rate

one date/metal/purity/unit

Reserved until a metal importer is deployed

Trading and publication gaps are meaningful. APIs and charts must not fabricateweekend or holiday observations and must not linearly interpolate them unless aseparate analytical feature explicitly requests it.

Missing data, source anomalies, zero values, and null values are differentstates. Raw facts remain unchanged. Any imputation, smoothing, corporate-actionadjustment, liquidity filter, or outlier treatment belongs in a separatelyversioned analytical feature and never overwrites these source tables.

Versioned facts (SCD2)

company_profile_version, equity_profile_version, financial_statement, andfinancial_ratio use half-open validity intervals [valid_from, valid_to).Exactly one current row exists per natural key, enforced by partial uniqueindexes.

Import result

Required behavior

New persistable content

Insert a current row; invalid content is rejected even when no current row exists

Identical content_hash

No write

Incomplete/regressed payload

Preserve current row and report a warning

Same-day corrected content

Update the current row because date precision cannot represent two same-day versions

Later corrected content

Close the current interval and insert a new current row

Run date older than valid_from

Reject the change

Current-value API reads filter is_current = true. Historical/restatement readsreturn validity fields and order by valid_from; they must not infer versionsfrom updated_at.

Event and document history

Announcements, payouts, and financial-report documents are not deleted merelybecause a later source response omits them. Stable source identifiers permitmetadata correction while preserving first_seen. Content hashes provide thefallback identity where no source identifier exists.

PSX document IDs are issuer-scoped. Unique keys therefore includesecurity_id; a global unique document-ID index is invalid for this schema.

Timestamp meaning

Field

Meaning

inserted_at / first_seen

First successful observation; preserve it during corrections

updated_at on conditional importers

Last material stored-value change

valid_from / valid_to

Business validity for SCD2 history

generated_at

AI-summary generation time

source_updated_at on a technical row

daily_quote.updated_at used by that calculation

calculated_at

First insert or most recent material indicator/version/source change; identical recalculation preserves it

scrape_run.started_at / finished_at

Operational run lifecycle

The daily importer uses row-wise IS DISTINCT FROM predicates fordaily_quote, market_summary, and index_daily, and a material-changepredicate for market_index. An identical accepted rerun therefore preservesevery fact timestamp. A corrected quote changes daily_quote.updated_at; thatis the source watermark that selects the security for technical recalculation.

API contract

The ASP.NET Core API owns connection pooling, public market reads,
cutover-gated identity/session behavior, and authenticated native portfolio and
watchlist mutations. It uses one shared NpgsqlDataSource; repositories execute
parameterized queries. /health is a liveness endpoint and intentionally does
not make deployment health depend on a temporary database outage. Multi-query
public response composition uses a read-only repeatable-read transaction so
ranges, as-of rows, and child sections come from one PostgreSQL snapshot.
Public market endpoints remain anonymous and read-only; they never perform
scraper or portfolio writes. Portfolio writes are separate authenticated,
CSRF-protected transactions.

Existing read surfaces

Consumer use

API surface

Primary database read set

Latest daily market page

GET /api/market-summary/latest/tickers (canonical)

GET /market-summary (compatibility alias)

market_summary, daily_quote, market_ai_summaries, index_daily, market_index

Single ticker

GET /api/tickers/{symbol}

Security, quotes, raw technical_indicator_daily, valuation, current/versioned company facts, and events

Ticker comparison

GET /api/tickers/compare?symbols=MEBL&symbols=HBL&benchmarks=KSE100

Quotes, raw technicals, profile, equity, valuation, statements, ratios, and optional benchmark history for two to four symbols

KIBOR curve/history

GET /api/rates/kibor

kibor_rate bid/offer observations by publication quote_date and canonical tenor

Canonical USD/PKR

GET /api/rates/usd-pkr

v_usdpkr_m2m_ready point rates and publication metadata only

MarketSummaryController explicitly maps both
GET /api/market-summary/latest/tickers and GET /market-summary to the same
GetLatestTickers action and MarketSummaryTickersResponse. The /api route is the
canonical compatibility route retained from earlier production documentation;
/market-summary is the short alias. Both routes are anonymous and GET-only.
POST, PUT, PATCH, and DELETE return HTTP 405. With data, both return identical
HTTP 200 response content anchored to the newest market_summary date; when no
market_summary row exists, both return HTTP 404 with the same
"No market summary tickers were found." message. Repository/infrastructure
failures remain server errors. Neither route may be silently removed during the
Supabase/frontend migration.

Single-ticker query parameters:

Parameter

Contract

from, to

Optional inclusive quote range; from <= to; a lower bound before 2021-01-01 resolves to 2021-01-01; maximum resolved span is 10 years

include

Comma-separated subset of quotes,profile,equity,valuation,financials,ratios,announcements,payouts,reports,technicals; omitted means all sections

financialYears

Integer from 1 through 20; omitted defaults to 5

eventLimit

Integer from 1 through 100; omitted defaults to 20 for bounded event/document lists

includeRestatements

When true, include historical SCD2 versions with validity metadata

Symbols are trimmed and normalized to uppercase. Unknown symbols return HTTP404; malformed ranges, includes, limits, duplicates, or comparisons returnRFC-compatible ProblemDetails with HTTP 400. A requested section with no datais represented by its documented empty/null shape; infrastructure failures arenot converted into successful empty responses.

Comparison-specific parameters:

Parameter

Contract

symbols

Two to four distinct symbols; repeated parameters and comma-separated values are accepted; response order follows normalized request order

benchmark, benchmarks

Zero to two distinct benchmarks; repeated benchmarks and comma-separated values are accepted

from, to

Optional inclusive shared range with the same lower-bound and 10-year rules as ticker detail

include

Subset of quotes,profile,equity,valuation,financials,ratios,technicals; omitted means all comparison sections

financialYears

Integer from 1 through 20; omitted defaults to 5

The public benchmark allow-list is KSE100, KSE30, KMI30, and KSEALL.KSEALL maps to stored market_index.code = 'ALLSHR'; all other codes resolvedirectly by market_index.code. Unsupported codes return HTTP 400. A supportedbenchmark with no dimension/history returns HTTP 404 and identifies everyunresolved code. Stock and benchmark order follows the request. Numeric IDs anddisplay order are never part of the contract.

The default comparison date range is resolved from the requested stock symbols,not from benchmark coverage, so stock charts remain comparable. Benchmarksretain genuine missing dates inside that range.

Valuation is an as-of object, not a value to smear over every quote. It carriesdaily_valuation.trade_date as asOf; a quote-level valuation join uses bothsecurity_id and exact trade_date. peRatioTtm remains nullable. The APIdoes not calculate P/E from PEG, EPS, current market cap, or frontend inputs.

The single-ticker response exposes technicals as priceBasis,calculationVersion, nullable asOf, and ascending points. Each point carriestradeDate plus the persisted return, moving-average, RSI, MACD, ATR, Bollinger,and volume-SMA decimal fields. The public contract is fixed to raw andta_raw_v1; clients cannot select another basis or version. asOf is the lastactual row inside the inclusive requested range. The API does not forward-fillor search before from. A requested technical section with no matching rows isan empty raw/ta_raw_v1 series; an unrequested section is null. The comparisonresponse reuses the same series DTO for every requested security and the sharedrequested range.

Technical-indicator API semantics

Technical indicators are a derived read surface, never a replacement for theauthoritative quote series. When an API endpoint exposes them, it must join bysecurity_id and trade_date, filter price_basis = 'raw' andcalculation_version = 'ta_raw_v1', and return the basis and version in the DTOor in unambiguous response metadata. APIs must not silently label raw values asadjusted.

Indicator rows align to actual eligible trading observations. Warm-up valuesare null rather than zero: returns require their stated lag, SMA/Bollinger andvolume SMA require complete windows, EMA requires its initialization period,RSI requires 14 changes, ATR requires 14 true ranges, and MACD signal requiresnine available MACD values. Return and RSI fields are percentage values alreadyexpressed on a 0–100 scale where applicable; consumers must not multiply them by100 again. Missing turnover produces a null volume_sma_20 until the rolling20-observation window is complete again.

ta_raw_v1 formulas are:

Column

Exact formula / initialization

return_1d_pct, return_5d_pct, return_20d_pct

((current close / close N trading observations earlier) - 1) * 100

sma_20, sma_50, sma_200

Arithmetic mean of the last N closes; complete N-observation window only

ema_12, ema_26

Adjust-false recursion with alpha = 2 / (N + 1) and EMA[0] = close[0]; hidden until N observations exist

macd

ema_12 - ema_26; first available with ema_26

macd_signal

Adjust-false EMA(9) of available MACD values, initialized at the first MACD and hidden until nine MACD values exist

macd_histogram

macd - macd_signal

rsi_14

Wilder gain/loss means seeded from the first 14 close changes, then (previous_average * 13 + current) / 14; RSI is 100 - 100 / (1 + average_gain / average_loss)

atr_14

True range is max(high-low, abs(high-previous_close), abs(low-previous_close)); first observation uses high-low. Wilder ATR is seeded by the first 14 true ranges, then (previous_atr * 13 + current_true_range) / 14

bollinger_middle

sma_20

bollinger_upper, bollinger_lower

sma_20 +/- 2 * population_stddev(last 20 closes), with population divisor 20 (ddof=0)

volume_sma_20

Arithmetic mean of the last 20 turnover observations; all 20 must be present

For RSI, zero average loss with positive average gain is 100, zero average gainwith positive average loss is 0, and a completely flat gain/loss window is 50.All non-finite calculation results are persisted as null.

Rates API contract

Rates endpoints use the existing schema without a migration. Repositories readthese canonical surfaces:

Feature

Canonical read surface

Required filters/dimensions

KIBOR curve/history

kibor_rate

quote_date, tenor; return bid and offer separately

Main USD/PKR series

v_usdpkr_m2m_ready

Optional date range only

FX explorer

v_sbp_fx_rates

Preserve and expose rate_type, tenor, base_ccy, and quote_ccy

FX publication provenance

fx_publication joined to observations

Use when the client requests source document metadata

Do not map SBP bid/offer data into OHLC fields, average a spread into a rate, orcombine rate families. API decimals must remain decimals; do not convert themthrough binary floating point.

The deployed query names recorded by the API project are startDate andendDate, both optional, inclusive, date-only values. The KIBOR route does notaccept a tenor filter; every successful response is constrained to the built-incanonical set 1W, 2W, 1M, 3M, 6M, 9M, 1Y. When both dates are omitted, thecurrently deployed default is 2025-01-01 through 2025-12-31. Unknown queryarguments, invalid dates, or startDate > endDate return HTTP 400ProblemDetails.

GET /api/rates/kibor returns tenorOrder, ascending observations, and alatestCurve built from one common latest quoteDate inside the applied range;it never selects a different latest date for each tenor. Bid and offer remainseparate nullable decimals and are never averaged.

GET /api/rates/usd-pkr uses the same deployed date parameter names/default.It reads exclusively from v_usdpkr_m2m_ready and identifies the response aspair USD/PKR, rate type mark_to_market, tenor ready, label “SBPMark-to-Market — Ready”, and unit “PKR per USD”. Each ascending point containsquoteDate, decimal rate, nullable effectiveDate, and—where the deployedDTO exposes it—source publication updatedAt. asOf is the final actual point.The endpoint must not query generic fx_rate or mix other rate types, pairs, orM2M tenors.

Both responses expose available/requested or applied ranges according to theirDTOs, preserve genuine missing publication dates, and return HTTP 200 with emptypoint arrays and null asOf/asOfDate for a valid empty range. Configurationand database failures remain failures rather than empty success.

An approved future improvement is to replace the fixed 2025 default withendDate = latest available source date and startDate = one year before that,clamping KIBOR to its earliest available 2021-01-04. That behavior is notdeployed merely because it is documented as a recommendation; changing itrequires API tests, OpenAPI updates, and frontend coordination. Do not re-addthe older from/to or tenors API contract accidentally.

Authentication API contract

The implemented authentication surface is cutover-gated. These are the actual
controller and middleware paths:

| Method and path | Authentication | Implemented contract |
| --- | --- | --- |
| GET /api/auth/google/start?returnUrl={url} | Anonymous | Returns 503 while AUTH_CUTOVER_ENABLED=false; otherwise validates the same-origin frontend return URL and starts the Google challenge with HTTP 302. Invalid return URLs return HTTP 400 ProblemDetails. |
| GET /signin-google | Google middleware only | Authorized Google redirect target. This is not a controller completion endpoint and frontend code does not call it directly. |
| GET /api/auth/google/callback | Five-minute external cookie | Validates the Google provider marker and return URL, resolves the WebICT user, clears the external cookie, issues the application cookie on success, and redirects only to the validated frontend URL. Failures use the generic auth=failed redirect. |
| GET /api/auth/me | Application cookie | Returns {id, email, emailVerified, displayName, avatarUrl}. |
| GET /api/auth/csrf | Anonymous | Returns {headerName, token}; headerName is X-CSRF-TOKEN and the response also establishes the readable antiforgery cookie. |
| POST /api/auth/logout | Application cookie plus CSRF | Clears the application cookie and returns HTTP 204. |

Google identity ownership is the canonical issuer
https://accounts.google.com plus the nonblank Google subject, whose maximum
length is 255 characters. The subject is the external identity key. Email,
emailVerified, displayName, and avatarUrl are profile fields only; email is
never used to discover, merge, or link an unknown identity. Disabled users and
unknown identities cannot obtain a session while new registration is disabled.
AUTH_CUTOVER_ENABLED=false prevents Google completion from issuing a new WebICT
application session. When cutover is later enabled,
ALLOW_NEW_USER_REGISTRATION=false permits only pre-imported external identities;
enabling registration separately permits only genuinely new post-cutover users.

The host-only WebICTCapital.Auth cookie is HTTP-only, SameSite=Lax, Secure in
production, non-sliding, non-persistent, and bounded to eight hours. The
host-only WebICTCapital.External cookie is HTTP-only, SameSite=Lax, Secure in
production, scoped to /api/auth, and bounded to five minutes. Google tokens are
not saved. The application cookie contains the WebICT UUID identifiers, not raw
Google principals or profile claims. AuthSchemes.Application has the exact
internal value WebICTApplication. That scheme string is a server implementation
detail; frontend clients depend on the cookie and HTTP API behavior, not the
scheme name.

Browser requests that need either cookie use credentials: "include". Every
state-changing route sends the request token returned by /api/auth/csrf in the
X-CSRF-TOKEN header. An unauthenticated cookie challenge returns HTTP 401
ProblemDetails and an authorization denial returns HTTP 403 ProblemDetails.
Invalid CSRF returns HTTP 400 ProblemDetails. The current /api/auth/me branch
for a cookie whose user is no longer active returns a bare HTTP 401; consumers
must treat either 401 representation as signed out.

Production requires an exact HTTPS FRONTEND_ORIGIN for credentialed CORS and
return-URL validation, a restricted AllowedHosts value naming the public API
host, and explicitly trusted Traefik CIDRs in TRUSTED_PROXY_NETWORKS. The API
processes one X-Forwarded-For/X-Forwarded-Proto hop before CORS and
authentication; arbitrary clients cannot supply trusted forwarded values.
Google Cloud registers https://<API_HOST>/signin-google, not the React origin
unless it is also the API host. ASP.NET Data Protection uses application name
WebICTCapitalApi and a persistent, non-root-writable Dokploy volume at
/var/lib/webictcapital-api/dataprotection-keys. See
docs/IDENTITY_MIGRATION.md and DOKPLOY.md for operator detail.

Authenticated portfolio API contract

All /api/portfolio routes require the application cookie and recheck that its
NameIdentifier UUID belongs to an active app_identity.user_account. No route,
query, or request DTO accepts user_id. All mutations require X-CSRF-TOKEN.
The controller exposes the following exact routes:

| Method and path | Request | Success response |
| --- | --- | --- |
| GET /api/portfolio | None | HTTP 200 PortfolioSummaryResponse. |
| GET /api/portfolio/lots | None | HTTP 200 array of PositionLotResponse. |
| GET /api/portfolio/holdings | None | HTTP 200 array of HoldingResponse. |
| GET /api/portfolio/activity?limit=100 | Optional limit from 1 through 500 | HTTP 200 array of PortfolioActivityResponse. |
| GET /api/portfolio/watchlist | None | HTTP 200 array of WatchlistItemResponse. |
| PUT /api/portfolio/watchlist/{symbol} | No body | HTTP 200 WatchlistItemResponse containing the actual latest quote/date read by the write transaction. |
| DELETE /api/portfolio/watchlist/{symbol} | No body | HTTP 204, including when already absent or removed. |
| POST /api/portfolio/buys | NativeTradeRequest | HTTP 201 PortfolioMutationResponse. |
| POST /api/portfolio/sells | NativeTradeRequest | HTTP 201 PortfolioMutationResponse. |
| POST /api/portfolio/lots/{lotId}/corrections | LotCorrectionRequest | HTTP 201 LotCorrectionResponse. |
| POST /api/portfolio/positions/{symbol}/remove | PositionRemovalRequest | HTTP 201 PortfolioMutationResponse. |

The exact camel-case request DTOs are:

NativeTradeRequest = {mutationId: UUID, symbol: string, quantity: positive
int64 whole shares, unitPrice: nonnegative decimal(20,6), tradeDate: date,
expectedPortfolioVersion: positive int64}.

LotCorrectionRequest = {mutationId: UUID, quantity: positive int64 whole
shares, unitCost: nonnegative decimal(20,6), acquisitionDate: date,
correctionDate: date, expectedLotVersion: positive int64,
expectedPortfolioVersion: positive int64, reason: nonblank UTF-8 text of at
most 1024 bytes}.

PositionRemovalRequest = {mutationId: UUID, effectiveDate: date,
expectedPortfolioVersion: positive int64, reason: nonblank UTF-8 text of at
most 1024 bytes}.

The exact camel-case response DTOs are:

PortfolioSummaryResponse = {id: UUID, name: string, baseCurrency: string,
status: string, isDefault: boolean, version: int64, holdingsMarketValue: decimal,
unpricedHoldingCount: int32, createdAt: instant, updatedAt: instant}.

PositionLotResponse = {id: UUID, securityId: int64, symbol: string, quantity:
int64, unitCost: decimal, acquisitionDate: date, origin: string, version: int64,
sourceCreatedAt: instant|null, createdAt: instant, updatedAt: instant}.

HoldingResponse = {securityId: int64, symbol: string, companyName: string|null,
quantity: int64, totalCost: decimal, averageUnitCost: decimal, latestPrice:
decimal|null, latestPriceDate: date|null, marketValue: decimal|null}.

PortfolioActivityResponse = {id: UUID, securityId: int64, symbol: string,
activityType: string, sourceKind: string, side: string|null, positionEffect:
string, quantity: int64, unitPrice: decimal|null, tradeDate: date,
legacySupabaseTradeId: int64|null, sourceCreatedAt: instant|null,
allocationMethod: string|null, hasReliableLotAllocation: boolean|null,
createdAt: instant, reason: string|null, beforeQuantity: int64|null,
afterQuantity: int64|null, beforeUnitCost: decimal|null, afterUnitCost:
decimal|null, beforeAcquisitionDate: date|null, afterAcquisitionDate: date|null,
portfolioVersionBefore: int64|null, portfolioVersionAfter: int64|null,
lotVersionBefore: int64|null, lotVersionAfter: int64|null}.

WatchlistItemResponse = {securityId: int64, symbol: string, companyName:
string|null, latestPrice: decimal|null, latestPriceDate: date|null, createdAt:
instant, updatedAt: instant}.

PortfolioMutationResponse = {activityId: UUID, portfolioVersion: int64}.

LotCorrectionResponse = {activityId: UUID, portfolioVersion: int64, lotVersion:
int64}.

Logical dates are ISO date-only values and instants use ISO 8601. JSON numeric
prices, costs, and values preserve decimal semantics. No portfolio response has
a cash field.

Native sells lock the active default portfolio and relevant security/lot state,
reject overselling, consider only lots acquired on or before tradeDate, and
allocate FIFO by acquisitionDate, createdAt, then lot UUID. Allocation rows
snapshot allocated quantity, unit cost, and acquisition date. A later correction
therefore cannot rewrite sold-share cost basis. Lot correction activity preserves
immutable before/after quantity, cost, acquisition date, lot versions, portfolio
versions, affected lot, effective date, and reason. Position removal preserves
per-lot quantity/cost/acquisition snapshots in PostgreSQL, closes rather than
deletes the lots, and exposes its aggregate immutable activity through the
activity response.

The four POST operations require a nonempty client-generated mutationId and
current portfolio/lot versions. Exact replay of the same operation and canonical
request returns the original activity/version result; reuse with different
input returns HTTP 409. Stale versions and oversells also return 409. Validation
errors return 400, missing portfolios/securities/lots/positions return 404, and
missing or inactive identity returns 401; controller domain errors use
ProblemDetails. Authorization denial returns 403 ProblemDetails, and missing or
invalid CSRF returns 400 ProblemDetails. Watchlist PUT/DELETE are naturally idempotent and require no
mutation UUID.

Surviving imported Supabase BUY rows become legacy opening lots and determine
initial holdings. Imported SELL rows remain visible as position-neutral legacy
history and are never subtracted again or assigned invented lot allocations or
realized profit. Native activity uses the new transactional semantics. The model
contains no cash balance, cash ledger, or synthetic cash entry. Detailed schema,
transaction, and cutover behavior remains in docs/PORTFOLIO_MIGRATION.md and
docs/CUTOVER_EXPORT_CONTRACT.md rather than duplicating migration 008 SQL here.

API consistency and performance

Use market_summary.trade_date as the authoritative date for a complete dailymarket response, then query quotes, indexes, and a completed AI summary forthat same date. Do not independently choose MAX(trade_date) from every table.

The index snapshot returned with a market day must use that requested marketdate, not the globally latest index date.

Join daily_valuation by both security and quote date.

Default company reads to current SCD2 rows; expose restatements only when therequest asks for them.

Bound event results and date spans. Add pagination before exposing unboundedhistorical event collections.

Use a repeatable-read transaction or an equivalent single-snapshot query whencomposing a response from several tables.

Never return DATABASE_URL, scraper notes containing credentials, contenthashes, or internal lock identifiers to public clients.

Frontend contract

The frontend consumes API DTOs, not database rows. Database names in this tableexplain lineage only.

Screen/feature

API data needed

Display rules

Market overview

Latest market summary, same-date indexes/tickers, completed AI brief

Show the trade date and source freshness; omit a missing/failed AI brief without hiding market facts

Ticker detail

Quotes, raw technical indicators, as-of valuation, current profile/equity, fundamentals, ratios, announcements, payouts, reports

Route by uppercase symbol; show available and requested quote ranges; label indicators as raw and preserve warm-up nulls

Ticker comparison

Two to four stock items plus zero to two optional benchmark series on one shared stock range

Preserve requested order; align by actual trade date; preserve gaps; label technical basis, valuation asOf, and fiscal period/year

KIBOR

GET /api/rates/kibor tenor-level bid/offer curve and history

Keep canonical tenor order; show distinct Bid and Offer series/legends; never collapse or average the spread

USD/PKR

GET /api/rates/usd-pkr backed only by v_usdpkr_m2m_ready

Label “SBP Mark-to-Market — Ready”, unit “PKR per USD”; display quote/effective dates and source freshness

FX explorer

Full normalized FX surface through the API

Require/label rate type and tenor; render either a rate or bid/offer pair

Frontend numeric rules:

treat prices, ratios, rates, EPS, market capitalization, and percentages asdecimal values; format only at presentation time;

market_cap is full PKR, not thousands of PKR;

free_float_pct is already a percentage value and must not be divided by 100;

turnover and index volume are whole-number quantities;

null means unavailable/not applicable, not zero; and

date-only values must not shift under browser timezone conversion. Displaylogical dates as their ISO calendar date and render instants inAsia/Karachi unless the user explicitly selects another timezone.

The browser must never calculate or impute authoritative P/E, KIBOR, FX,technical indicators, financial statements, or benchmark history. Inparticular, PEG is not P/E. While peRatioTtm remains absent, render N/A withits valuation asOf date rather than hiding the entire valuation card.

Chart rules:

align observations by actual logical date; do not create weekend rows;

connect or leave gaps only according to an explicitly documented visualoption; never persist an interpolated value;

label raw price series as unadjusted and never imply total return;

keep stock and benchmark axes/normalization explicit; if the frontend usesnormalized performance, show the base date and formula; and

pass request cancellation signals for changing chart ranges and retain thelast successful view while a replacement request is loading.

Identity and portfolio frontend transition

The production React frontend still uses Supabase for identity and portfolio
data. No real export/import or frontend cutover has occurred. After coordinated
cutover, WebICT mode must use this API only for authentication, portfolio, and
watchlist data; it must not silently fall back to Supabase writes after WebICT
mode is selected.

Credentialed requests set credentials: "include". Before each state-changing
request, the client obtains {headerName, token} from GET /api/auth/csrf with
credentials included, then returns token in the X-CSRF-TOKEN request header.
No API request accepts user_id; ownership comes only from the application
cookie. A client-generated mutation UUID is created once per logical buy, sell,
correction, or removal and reused unchanged for retries of that request. The
client refreshes portfolio state after every successful mutation and after HTTP
409 before deciding whether to retry with current versions.

Date-only fields stay ISO calendar-date strings and must not pass through a
timezone conversion that changes the date. Decimal prices, costs, quantities,
and values remain decimals through transport and display logic rather than
binary-floating-point approximations. Portfolio responses have no cash field;
the UI must not display an absent migrated cash balance as zero.

The final switch is one coordinated operation: freeze Supabase writes, take the
final repeatable-read export, validate exact-byte checksums, approve/apply
migration 008, dry-run and execute the import, reconcile every mapped value,
then enable the separately approved API/frontend mode. Until that sequence is
complete, Supabase remains authoritative and writable.

For cache validation, future API work may derive ETags or Last-Modified valuesfrom a response-level version/freshness calculation. It must not blindly use onetable's updated_at for a response composed from multiple tables.

Known production state and unresolved work

The following is a dated audit ledger, not immutable schema. Re-run theverification queries after each deployment/backfill and update the observationdate instead of silently deleting an old caveat.

Verified healthy invariants

At the last supplied audits through 2026-07-24:

daily_quote had no duplicate natural keys, non-finite numeric values, highbelow low, or negative turnover;

daily_valuation had no row without its exact quote and no remainingmisattributed pre-insertion trade date;

index_daily had no duplicate natural keys, high-below-low, open/closeoutside range, percentage mismatch, or previous-close reconciliation failureamong stored rows;

540,184 eligible positive-close quote rows had zero missing and zero staleraw ta_raw_v1 technical rows; and

migration 006 quarantine counts were 613 valuation rows and three equityrows, with zero remaining stale valuation candidates.

These checks establish relational and calculation consistency. They do notclaim that every upstream observation is economically clean or every tradingsession has every optional index.

Raw PSX quote anomalies

A broad range check flagged 18,024 historical daily_quote rows where close wasoutside the published high/low and 245 where open was outside the range. Manyare official zero/missing-OHLC representations for illiquid, suspended,delisted, GEM, right, preference, or otherwise unusual instruments; they arenot automatically 18,024 corrupt records. The raw table preserves them.

Required follow-up is to add a separate, versioned quality/eligibility layer foranalytics and modeling. Do not “repair” these rows with averages. Models shouldexclude or flag observations using explicit rules for positive finite OHLC,turnover, instrument class, suspension/limit state, and minimum trailingliquidity.

Historical index gaps

Against 1,375 observed market sessions through 2026-07-24, the last audit was:

Stored index code

Present

Missing

First

Last

ALLSHR

1,331

44

2021-01-01

2026-07-24

KMI30

1,353

22

2021-01-01

2026-07-24

KMIALLSHR

1,328

47

2021-01-01

2026-07-24

KSE100

1,349

26

2021-01-01

2026-07-24

KSE30

1,351

24

2021-01-01

2026-07-24

The exact reviewed ALLSHR gap on 2026-07-21 is intentional. Other gapsremain backfill work. Surmaya Financials was identified as a possible secondaryhistorical source but is not yet an authoritative writer. Before using it,capture source provenance, stage rows outside canonical facts, compare againstofficial/primary observations, review discrepancies, and approve an additivemigration or controlled importer. Interns may research and document evidence;they must not directly edit production fact tables.

Valuation and P/E coverage

The supplied audit contained 483 daily_valuation rows, all with market cap andnone with pe_ratio_ttm; observed dates were 2026-07-20 through2026-07-21. MEBL had two market-cap rows; FABL and HBL had one each. Thismeans both P/E population and newer exact-date valuation freshness needoperational verification after enabling the company schedule. Existing marketcaps are not evidence that historical P/E exists.

SBP coverage

KIBOR reviewed aliases/anomalies and FX catalogue mismatches documented aboveare intentional gaps, not empty spaces to fill. The FX backlog is processednewest-first in bounded batches. v_usdpkr_m2m_ready is usable only for datesactually present in its canonical source; research requiring a longer windowmust exclude the feature until completeness for that window is proven.

Identity, portfolios, and research boundaries

Migration 007_identity_foundation.sql was applied to production on 2026-08-01.Its app_identity.user_account, app_identity.external_login, andapp_identity.authentication_audit tables were empty immediately afterapplication, and all reviewed constraints, indexes, and delete protection wereverified. Authentication remains disabled with AUTH_CUTOVER_ENABLED=false andALLOW_NEW_USER_REGISTRATION=false. No Supabase identities or portfolios havebeen imported.

Migration 008_portfolio_foundation.sql and its API/importer implementation are
implemented, reviewed, and tested, but the migration remains a proposal and has
not been applied to production. Supabase remains authoritative and writable
until the final freeze and authoritative export. The legacy portfolio source is
a hybrid model: surviving BUY rows are authoritative current open lots; SELL
rows are sale-history events whose position effect was already applied by
destructive BUY-row rewrites in the old frontend. Imported SELL rows must
therefore not be subtracted from imported BUY lots. Original BUY IDs and
timestamps do not represent complete immutable acquisition history.

The proposed migration preserves native correction history as immutablebefore/after quantity, cost, acquisition date, affected lot, reason, lotversions, and portfolio versions. Native FIFO sale allocations snapshotallocated quantity, unit cost, and acquisition date before open-lot statechanges. PostgreSQL composite ownership constraints and deferred triggersrequire activities, lots, allocations, portfolios, securities, mutation auditusers, sale totals, and removal totals to agree. Native mutation dates obey theAsia/Karachi logical date and imported dates/timestamps cannot exceed thebatch export instant.

POST buy, sell, lot-correction, and position-removal requests require aclient-generated UUID. The database stores the operation and canonical requestfingerprint in the same transaction. Exact replay returns the original activityand versions; reusing a key for changed input is a conflict. Watchlist PUT andDELETE remain naturally idempotent.

There is no source cash balance in Supabase tables, auth metadata, or the
current portfolio frontend. Migration and API code must not invent, infer,
average, or initialize cash. Current portfolio value is holdings-only. The
React frontend remains on Supabase until a later explicitly reviewed frontend
migration phase. No real export or import has occurred. Do not drop the old
Supabase project or recreate or link users from email. Browser clients must
never receive a database credential.

Cutover export and import boundary

The manifest describes exactly four deterministic data files: users.json,
google-identities.json, user-trades.json, and watchlists.json. Each manifest
entry records the SHA-256 of the exact file bytes. The exporter reads the source
column public.user_trades.trade_type and writes it as JSON property type. Because
the audited public.watchlists source has no updated_at column, exported
updatedAt is null and the importer uses createdAt as the target updated time.

Users are not filtered out when source status changes. A deleted user, a user
banned at the exporter transaction timestamp, an unconfirmed user, or an
anonymous user exports with status disabled; all others export active. Disabled
imported users remain unable to receive an active WebICT application session.
The export/import contract requires a nonempty user file and exactly one
unambiguous Google identity per user. The permanent identity remains the
Supabase user UUID plus canonical Google issuer/subject, never email.

SupabaseExporter is a separate offline source tool. It reads auth.users,
auth.identities, public.user_trades, and public.watchlists in one REPEATABLE READ,
READ ONLY transaction. PortfolioImporter consumes local reviewed files only.
Its dry-run uses a nonblocking advisory lock and a REPEATABLE READ, READ ONLY
target transaction while committing zero writes; a real import uses one
SERIALIZABLE target transaction and exact value reconciliation. Sensitive real
exports are never committed or copied into the normal API image/container. The
normal image contains PortfolioImporter for operator-only execution and excludes
SupabaseExporter. See docs/CUTOVER_EXPORT_CONTRACT.md for the exact file schema
and commands.

The psx_trading_bot phase-one research migration was a proposal only and wasnot executed. Its filename 006_research_service_proposal.sql now conflictswith the already-applied production migration 006. If research persistence isapproved later, re-audit and renumber it to the next free migration; keep theresearch reader read-only and use a distinct writer role. No broker executionbelongs in this platform contract.

Only creation/connection setup for webict_research_ro was reported; noauthoritative research schema, research tables, grants, or default privilegeswere applied. Do not assume that role can read market tables or write researchmetadata. Any credential ever pasted into chat or documentation must be rotatedand kept only in the deployment secret store.

Deployment and migration procedure

Existing production database

Production is post-migration-007 as of 2026-08-01. Migration 008 remains
unapplied. This documentation consolidation does not authorize a database
change. Never infer migration state from filenames in one repository; verify
the target database and the project migration ledger.

Migration

Production state

Purpose

001

Applied

Initial PSX company persistence

002

Applied

Company idempotency and issuer-scoped identity corrections

003

Applied

Company constraints and persistence hardening

004

Applied

Normalized SBP FX publications, observations, and views

005

Applied

Raw technical-indicator persistence

006

Applied 2026-07-21

Guarded company valuation/equity cleanup and quarantine

007

Applied 2026-08-01

Additive app_identity foundation; all three tables were empty immediately after application

008

Proposed only

Additive app_portfolio foundation and offline cutover importer contract

For historical public-schema context only, the commands through migration 005
were:

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/001_psx_company_persistence.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/002_psx_company_idempotency.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/003_psx_company_constraints.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/004_sbp_fx_persistence.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/005_technical_indicators.sql

Migration 005_technical_indicators.sql creates technical_indicator_daily, its
(security_id, trade_date, price_basis) primary key, raw/adjusted basis check,
quote foreign key with cascade delete, and trade-date index. Production has
already applied migration 005; the embedded fresh-install DDL below is scoped to
the complete public market-data state. Application schemas remain governed by
their numbered migration files.

Migration 006_psx_company_cleanup.sql was a production-audit-guarded,forward-only transaction. The confirmedpre-fix audit found 1,113 valuation rows, of which exactly 613 used atrade_date earlier than their Karachi insertion date (maximum error 2,017days), plus the exact current ADOS id=10, BCML id=73, and WYETH id=630equity rows encoded in the migration. It aborts unless all 613 valuationcandidates belong to data_source.code = 'psx_company' and all three fullyguarded equity rows match. It creates recoverable quarantine tables, assertsquarantine and delete counts match, asserts no valuation candidate remains,then adds and validatesck_equity_version_free_float_not_above_shares. Any count/source mismatchrolls back the entire transaction, including quarantine-table creation. It doesnot modify securities, quotes, technical indicators, profiles, statements,ratios, announcements, payouts, reports, KIBOR, FX, or indexes.

Production applied migration 006 successfully on 2026-07-21. It quarantined613 daily_valuation rows and three equity_profile_version rows, left 482valid valuation rows and zero stale valuation candidates, and validatedck_equity_version_free_float_not_above_shares. Migration 006 must not beexecuted again.

Production applied migration 007_identity_foundation.sql successfully on
2026-08-01. Its three app_identity tables were empty immediately afterward.
Migration 007 must not be modified, replaced, or rerun; its reviewed Git blob
SHA is 490e397a208075c7a0d90a37de22aa9fd584927a. Authentication remains
cutover-gated and no identity or portfolio import has occurred.

Migration 008_portfolio_foundation.sql is implemented, reviewed, tested,
forward-only, and additive, but remains a proposed and unapplied production
migration. Do not apply it without separate operator approval. It creates
app_portfolio storage only; it creates no cash table and does not alter public
market facts or migration 007.

The phase-two importer reads reviewed local files only. Its dry-run uses anonblocking advisory lock and a read-only target transaction to validate bothfiles and target conflicts with zero writes. Completed identical batchesundergo exact value reconciliation, not count-only acceptance. A separateadministrative Supabase exporter uses one repeatable-read read-only source snapshotand writes deterministic private files plus exact-byte checksums, with themanifest last. Run the real exporter only after the final write freeze; nevercommit exports or copy them into the normal API container.

Running these files through DBeaver is also valid when connected to the intendeddatabase and public schema, auto-commit behavior is understood, and the wholefile is executed with stop-on-error behavior. Never apply a migration whileassuming that IF NOT EXISTS validates an incompatible pre-existing object;run the verification queries after deployment.

Minimum post-migration checks:

SELECT current_database(), current_schema();

SELECT to_regclass('public.fx_publication')       AS fx_publication,
       to_regclass('public.fx_rate_observation')  AS fx_rate_observation,
       to_regclass('public.v_sbp_fx_rates')       AS v_sbp_fx_rates,
       to_regclass('public.v_usdpkr_m2m_ready')   AS v_usdpkr_m2m_ready,
       to_regclass('public.technical_indicator_daily') AS technical_indicator_daily,
       to_regclass('public.psx_company_daily_valuation_quarantine')
           AS valuation_quarantine,
       to_regclass('public.psx_company_equity_version_quarantine')
           AS equity_quarantine;

SELECT conname, convalidated
FROM pg_constraint
WHERE conrelid IN (
    'public.scrape_run'::regclass,
    'public.fx_publication'::regclass,
    'public.fx_rate_observation'::regclass,
    'public.technical_indicator_daily'::regclass,
    'public.equity_profile_version'::regclass
)
ORDER BY conrelid::regclass::text, conname;

Operational coverage checks (read-only):

-- Technical coverage must be complete for eligible raw closes.
WITH eligible AS (
    SELECT *
    FROM daily_quote
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
LEFT JOIN technical_indicator_daily AS ti
  ON ti.security_id = eligible.security_id
 AND ti.trade_date = eligible.trade_date
 AND ti.price_basis = 'raw';

-- Valuation coverage and the known P/E population gap.
SELECT
    count(*) AS valuation_rows,
    count(market_cap) AS market_cap_rows,
    count(pe_ratio_ttm) AS pe_rows,
    min(trade_date) AS first_valuation_date,
    max(trade_date) AS latest_valuation_date
FROM daily_valuation;

-- Must always return zero.
SELECT count(*) AS valuation_without_exact_quote
FROM daily_valuation AS v
LEFT JOIN daily_quote AS q
  USING (security_id, trade_date)
WHERE q.security_id IS NULL;

SELECT count(*) AS misattributed_valuation_dates
FROM daily_valuation
WHERE trade_date < (inserted_at AT TIME ZONE 'Asia/Karachi')::date;

-- Quarantine evidence from applied migration 006.
SELECT
    (SELECT count(*) FROM psx_company_daily_valuation_quarantine)
        AS valuation_quarantine,
    (SELECT count(*) FROM psx_company_equity_version_quarantine)
        AS equity_quarantine;

-- Historical index coverage by canonical stored code.
WITH sessions AS (
    SELECT count(*) AS n FROM market_summary
)
SELECT
    mi.code,
    sessions.n AS market_sessions,
    count(id.trade_date) AS observations,
    sessions.n - count(id.trade_date) AS missing,
    min(id.trade_date) AS first_date,
    max(id.trade_date) AS latest_date
FROM market_index AS mi
CROSS JOIN sessions
LEFT JOIN index_daily AS id ON id.index_id = mi.id
WHERE mi.code IN ('KSE100', 'KSE30', 'ALLSHR', 'KMI30', 'KMIALLSHR')
GROUP BY mi.code, sessions.n
ORDER BY mi.code;

-- No abandoned company runs should remain after a healthy lock-owning run.
SELECT count(*) AS unfinished_company_runs
FROM scrape_run AS sr
JOIN data_source AS ds ON ds.id = sr.source_id
WHERE ds.code = 'psx_company'
  AND sr.status = 'running'
  AND sr.finished_at IS NULL;

-- Canonical rate coverage, without inventing publication dates.
SELECT min(quote_date), max(quote_date), count(*) FROM kibor_rate;
SELECT min(quote_date), max(quote_date), count(*) FROM v_usdpkr_m2m_ready;

Deploy scraper/API code only after its required migrations are present. Eachservice must validate the tables, columns, unique indexes, and requiredvalidated constraints it owns before any network or backfill work begins. Thecompany importer specifically verifiesck_equity_version_free_float_not_above_shares.

Fresh database

For a new empty database, establish the complete public market-data schema with
the DDL below, then apply migrations/007_identity_foundation.sql to establish
the applied application identity schema. Seed data_source through the importers'
normal UPSERT logic. The embedded DDL intentionally contains no app_identity or
app_portfolio objects, does not schedule jobs, create application users, grant
privileges, or expose a network port. Apply migration 008 only after its separate
operator approval; this contract does not authorize that production change.

Complete public market-data DDL (fresh installations only)

Compatibility marker for existing schema-extraction tests only; this is not a
complete-database claim: Complete PostgreSQL schema (fresh installations only)

-- ============================================================================
-- Market Data Warehouse — schema.sql  (PostgreSQL 14+)
-- ============================================================================
-- Design goals
--   1. Scalable: PSX closing rates + company fundamentals today; KIBOR, USD/PKR,
--      gold & silver later. Adding a new daily series = one small table.
--   2. No redundancy for daily scrapes: every time-series table is keyed by
--      (entity, date). Re-running the same day UPSERTs in place.
--   3. Keep history when values change: slowly-changing facts (profile,
--      financials, ratios, share structure) are versioned (SCD2). A new row is
--      written ONLY when a content hash changes; otherwise the run is a no-op.
--
-- Two storage patterns
--   A) DAILY SERIES  -> PK ends in the observation date; ON CONFLICT DO UPDATE.
--   B) VERSIONED (SCD2) -> (natural_key..., content_hash, valid_from, valid_to,
--      is_current). One "current" row per key; superseded rows are retained.
--
-- content_hash: sha256 hex of the meaningful fields, computed in the scraper
-- (Python: hashlib.sha256(canonical_json.encode()).hexdigest()). Keeping it in
-- the app avoids a pgcrypto dependency and stays deterministic across engines.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0. Provenance / run tracking (optional but cheap; good for debugging)
-- ---------------------------------------------------------------------------

CREATE TABLE data_source (
    id        smallserial PRIMARY KEY,
    code      text UNIQUE NOT NULL,          -- stable codes documented above
    name      text NOT NULL,
    base_url  text
);

CREATE TABLE scrape_run (
    id           bigserial PRIMARY KEY,
    source_id    smallint NOT NULL REFERENCES data_source(id),
    run_date     date NOT NULL,              -- logical trade/observation date
    started_at   timestamptz NOT NULL DEFAULT now(),
    finished_at  timestamptz,
    status       text NOT NULL DEFAULT 'running',
    rows_written integer NOT NULL DEFAULT 0,
    notes        text,
    CONSTRAINT ck_scrape_run_status
        CHECK (status IN ('running', 'success', 'partial', 'failed', 'no_data'))
);
CREATE INDEX idx_scrape_run_source_date ON scrape_run (source_id, run_date);


-- ---------------------------------------------------------------------------
-- 1. Dimensions (stable entities referenced by many facts)
-- ---------------------------------------------------------------------------

-- One row per listed symbol. symbol is the stable natural key.
CREATE TABLE security (
    id            bigserial PRIMARY KEY,
    symbol        text UNIQUE NOT NULL,       -- 'MEBL'
    company_name  text,                       -- latest seen name (convenience)
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);

-- One row per stored market index (KSE100, ALLSHR, KMIALLSHR, ...).
-- Public API alias KSEALL maps to stored code ALLSHR.
CREATE TABLE market_index (
    id            smallserial PRIMARY KEY,
    code          text UNIQUE NOT NULL,       -- 'KSE100'
    display_name  text
);


-- ---------------------------------------------------------------------------
-- 2. PSX daily series (from the closing-rate PDF)  [pattern A]
-- ---------------------------------------------------------------------------

-- Per-symbol daily OHLC bar. This is the authoritative daily price row.
CREATE TABLE daily_quote (
    security_id  bigint NOT NULL REFERENCES security(id),
    trade_date   date   NOT NULL,
    open         numeric,
    high         numeric,
    low          numeric,
    close        numeric,
    turnover     bigint,
    change       numeric,
    section      text,                        -- PSX sector/section label from the PDF
    source_id    smallint REFERENCES data_source(id),
    inserted_at  timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (security_id, trade_date)
);
CREATE INDEX idx_daily_quote_date ON daily_quote (trade_date);

-- Derived technical indicators. compute_technicals.py owns this table and
-- reads daily_quote without modifying it. The active implementation writes
-- raw prices only; adjusted is reserved for a future separately defined feed.
CREATE TABLE technical_indicator_daily (
    security_id         bigint NOT NULL,
    trade_date          date NOT NULL,
    price_basis         text NOT NULL DEFAULT 'raw',
    calculation_version text NOT NULL,

    return_1d_pct       numeric,
    return_5d_pct       numeric,
    return_20d_pct      numeric,

    sma_20              numeric,
    sma_50              numeric,
    sma_200             numeric,
    ema_12              numeric,
    ema_26              numeric,

    rsi_14              numeric,
    macd                numeric,
    macd_signal         numeric,
    macd_histogram      numeric,
    atr_14              numeric,

    bollinger_middle    numeric,
    bollinger_upper     numeric,
    bollinger_lower     numeric,
    volume_sma_20       numeric,

    source_updated_at   timestamptz NOT NULL,
    calculated_at       timestamptz NOT NULL DEFAULT now(),

    PRIMARY KEY (security_id, trade_date, price_basis),

    CONSTRAINT fk_technical_daily_quote
        FOREIGN KEY (security_id, trade_date)
        REFERENCES daily_quote (security_id, trade_date)
        ON DELETE CASCADE,

    CONSTRAINT ck_technical_price_basis
        CHECK (price_basis IN ('raw', 'adjusted'))
);

CREATE INDEX idx_technical_indicator_date
    ON technical_indicator_daily (trade_date);

-- Whole-market breadth/volume for the day. (KSE100/KSE30 header figures are
-- intentionally NOT stored here — they live in index_daily to avoid duplication.)
CREATE TABLE market_summary (
    trade_date   date PRIMARY KEY,
    prev_volume  bigint,
    curr_volume  bigint,
    advances     integer,
    declines     integer,
    unchanged    integer,
    flu_no       text,
    source_id    smallint REFERENCES data_source(id),
    inserted_at  timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now()
);

-- One generated market brief per trade date and summary type.
-- Historical backfills do not create summaries. Only the latest complete
-- imported trade date can create or update the daily_market_close summary.
CREATE TABLE IF NOT EXISTS market_ai_summaries (
    trade_date       date NOT NULL
                     REFERENCES market_summary(trade_date) ON DELETE CASCADE,
    summary_type     text NOT NULL DEFAULT 'daily_market_close',
    model_name       text NOT NULL,
    prompt_version   text NOT NULL,
    input_hash       char(64) NOT NULL,
    summary          text,
    error_message    text,
    key_points       jsonb NOT NULL DEFAULT '[]'::jsonb,
    top_gainers      jsonb NOT NULL DEFAULT '[]'::jsonb,
    top_losers       jsonb NOT NULL DEFAULT '[]'::jsonb,
    volume_leaders   jsonb NOT NULL DEFAULT '[]'::jsonb,
    sector_activity  jsonb NOT NULL DEFAULT '[]'::jsonb,
    generated_at     timestamptz NOT NULL DEFAULT now(),
    status           text NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'completed', 'failed')),
    PRIMARY KEY (trade_date, summary_type)
);

CREATE INDEX idx_market_ai_summaries_status
    ON market_ai_summaries (status);

CREATE INDEX idx_market_ai_summaries_latest_completed
    ON market_ai_summaries (summary_type, trade_date DESC)
    WHERE status = 'completed';

CREATE INDEX idx_market_ai_summaries_generated_at
    ON market_ai_summaries (generated_at DESC);

-- Per-index daily values (from the DPS site panel).
CREATE TABLE index_daily (
    index_id     smallint NOT NULL REFERENCES market_index(id),
    trade_date   date NOT NULL,
    prev_close   numeric,
    open         numeric,
    high         numeric,
    low          numeric,
    close        numeric,
    volume       bigint,
    change       numeric,
    change_pct   numeric,
    as_of        timestamptz,    -- exact snapshot time reported by the site
    source_id    smallint REFERENCES data_source(id),
    inserted_at  timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (index_id, trade_date)
);
CREATE INDEX idx_index_daily_date ON index_daily (trade_date);


-- ---------------------------------------------------------------------------
-- 3. Company page — daily vs. structural split
-- ---------------------------------------------------------------------------

-- DAILY [pattern A]: values that move every day with price.
-- market cap and source P/E are price-sensitive, so they belong here,
-- NOT in the versioned equity/financial tables (otherwise every day = new row).
-- Company-page source convention: PSX labels market cap as "Market Cap (000's)".
-- The importer multiplies that source value by 1000; market_cap is full PKR.
-- A valuation is written only when the exact Karachi run date already exists
-- in daily_quote. On weekends, holidays, or a failed closing import it is
-- skipped rather than attaching a current value to an older trading date.
CREATE TABLE daily_valuation (
    security_id    bigint NOT NULL REFERENCES security(id),
    trade_date     date NOT NULL,
    market_cap     numeric,
    pe_ratio_ttm   numeric,
    source_id      smallint REFERENCES data_source(id),
    inserted_at    timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (security_id, trade_date),
    CONSTRAINT fk_daily_valuation_quote
        FOREIGN KEY (security_id, trade_date)
        REFERENCES daily_quote (security_id, trade_date)
        ON DELETE CASCADE,
    CONSTRAINT ck_daily_valuation_market_cap
        CHECK (market_cap IS NULL OR market_cap >= 0)
);
CREATE INDEX idx_daily_valuation_date ON daily_valuation (trade_date);

-- VERSIONED [pattern B]: company profile (sector, description, people, etc.).
-- Changes rarely; one current row per security, superseded rows retained.
CREATE TABLE company_profile_version (
    id                    bigserial PRIMARY KEY,
    security_id           bigint NOT NULL REFERENCES security(id),
    sector                text,
    business_description  text,
    address               text,
    website               text,
    registrar             text,
    auditor               text,
    fiscal_year_end       text,
    key_people            jsonb,        -- [{"name":..,"designation":..}, ...]
    content_hash          char(64) NOT NULL,
    valid_from            date NOT NULL,   -- run date this version first appeared
    valid_to              date,            -- NULL while current
    is_current            boolean NOT NULL DEFAULT true,
    inserted_at           timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ck_profile_version_interval
        CHECK (valid_to IS NULL OR valid_to > valid_from),
    CONSTRAINT ck_profile_version_current
        CHECK (
            (is_current AND valid_to IS NULL)
            OR (NOT is_current AND valid_to IS NOT NULL)
        )
);
CREATE UNIQUE INDEX uq_profile_current
    ON company_profile_version (security_id) WHERE is_current;
CREATE INDEX idx_profile_hist ON company_profile_version (security_id, valid_from);

-- VERSIONED [pattern B]: share structure (shares outstanding / free float).
-- Structural, not daily — market_cap deliberately excluded (see daily_valuation).
CREATE TABLE equity_profile_version (
    id                 bigserial PRIMARY KEY,
    security_id        bigint NOT NULL REFERENCES security(id),
    shares             bigint,
    free_float_shares  bigint,
    free_float_pct     numeric,
    content_hash       char(64) NOT NULL,
    valid_from         date NOT NULL,
    valid_to           date,
    is_current         boolean NOT NULL DEFAULT true,
    inserted_at        timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ck_equity_version_values
        CHECK (
            (shares IS NULL OR shares >= 0)
            AND (free_float_shares IS NULL OR free_float_shares >= 0)
            AND (free_float_pct IS NULL OR free_float_pct BETWEEN 0 AND 100)
        ),
    CONSTRAINT ck_equity_version_free_float_not_above_shares
        CHECK (
            shares IS NULL
            OR free_float_shares IS NULL
            OR free_float_shares <= shares
        ),
    CONSTRAINT ck_equity_version_interval
        CHECK (valid_to IS NULL OR valid_to > valid_from),
    CONSTRAINT ck_equity_version_current
        CHECK (
            (is_current AND valid_to IS NULL)
            OR (NOT is_current AND valid_to IS NOT NULL)
        )
);
CREATE UNIQUE INDEX uq_equity_current
    ON equity_profile_version (security_id) WHERE is_current;
CREATE INDEX idx_equity_hist ON equity_profile_version (security_id, valid_from);

-- Audit/quarantine tables created by migration 006. They intentionally have no
-- foreign keys, so recovery evidence survives later lifecycle changes.
CREATE TABLE psx_company_daily_valuation_quarantine (
    security_id          bigint NOT NULL,
    trade_date           date NOT NULL,
    market_cap           numeric,
    pe_ratio_ttm         numeric,
    source_id            smallint,
    inserted_at          timestamptz NOT NULL,
    updated_at           timestamptz NOT NULL,
    quarantine_reason    text NOT NULL,
    migration_code       text NOT NULL,
    quarantined_at       timestamptz NOT NULL DEFAULT now(),
    original_row         jsonb NOT NULL
);

CREATE TABLE psx_company_equity_version_quarantine (
    id                   bigint NOT NULL,
    security_id          bigint NOT NULL,
    symbol               text NOT NULL,
    shares               bigint,
    free_float_shares    bigint,
    free_float_pct       numeric,
    content_hash         char(64) NOT NULL,
    valid_from           date NOT NULL,
    valid_to             date,
    is_current           boolean NOT NULL,
    inserted_at          timestamptz NOT NULL,
    quarantine_reason    text NOT NULL,
    migration_code       text NOT NULL,
    quarantined_at       timestamptz NOT NULL DEFAULT now(),
    original_row         jsonb NOT NULL
);

-- VERSIONED [pattern B]: financial statements, keyed by (security, fy, period).
-- New quarters simply INSERT; unchanged reappearances no-op; restatements make
-- a new version and keep the old one. This is the main "keep history" table.
CREATE TABLE financial_statement (
    id                bigserial PRIMARY KEY,
    security_id       bigint NOT NULL REFERENCES security(id),
    fiscal_year       integer NOT NULL,
    period            text NOT NULL,
    sales             numeric,
    profit_after_tax  numeric,
    eps               numeric,
    line_items        jsonb,                  -- complete normalized source matrix
    content_hash      char(64) NOT NULL,
    valid_from        date NOT NULL,
    valid_to          date,
    is_current        boolean NOT NULL DEFAULT true,
    inserted_at       timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ck_financial_statement_period
        CHECK (period IN ('Annual', 'Q1', 'Q2', 'Q3', 'Q4')),
    CONSTRAINT ck_financial_statement_interval
        CHECK (valid_to IS NULL OR valid_to > valid_from),
    CONSTRAINT ck_financial_statement_current
        CHECK (
            (is_current AND valid_to IS NULL)
            OR (NOT is_current AND valid_to IS NOT NULL)
        )
);
CREATE UNIQUE INDEX uq_fin_current
    ON financial_statement (security_id, fiscal_year, period) WHERE is_current;
CREATE INDEX idx_fin_hist
    ON financial_statement (security_id, fiscal_year, period, valid_from);

-- VERSIONED [pattern B]: ratios, keyed by (security, fiscal_year).
-- Row set differs by sector, so values are stored as JSONB and versioned whole.
-- Query a specific ratio with:  values->>'Net Profit Margin (%)'
CREATE TABLE financial_ratio (
    id            bigserial PRIMARY KEY,
    security_id   bigint NOT NULL REFERENCES security(id),
    fiscal_year   integer NOT NULL,
    values        jsonb NOT NULL,             -- {"Net Profit Margin (%)":21.18, ...}
    content_hash  char(64) NOT NULL,
    valid_from    date NOT NULL,
    valid_to      date,
    is_current    boolean NOT NULL DEFAULT true,
    inserted_at   timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ck_financial_ratio_interval
        CHECK (valid_to IS NULL OR valid_to > valid_from),
    CONSTRAINT ck_financial_ratio_current
        CHECK (
            (is_current AND valid_to IS NULL)
            OR (NOT is_current AND valid_to IS NOT NULL)
        )
);
CREATE UNIQUE INDEX uq_ratio_current
    ON financial_ratio (security_id, fiscal_year) WHERE is_current;
CREATE INDEX idx_ratio_hist ON financial_ratio (security_id, fiscal_year, valid_from);

-- EVENT HISTORY: announcements accumulate and are never removed. Stable-ID
-- rows may receive corrected metadata; first_seen remains immutable.
-- Dedup by PSX document id when present; otherwise by a content hash
-- (some board-meeting rows are image-only and have no PDF/document id).
CREATE TABLE announcement (
    id                bigserial PRIMARY KEY,
    security_id       bigint NOT NULL REFERENCES security(id),
    psx_document_id   text,
    announcement_date date,
    title             text NOT NULL,
    category          text,                   -- Financial Results|Board Meetings|Others
    pdf_url           text,
    documents         jsonb NOT NULL DEFAULT '[]'::jsonb,
    content_hash      char(64),               -- hash(security,date,title,category) for null-id rows
    first_seen        date NOT NULL,
    inserted_at       timestamptz NOT NULL DEFAULT now()
);

-- Document IDs are issuer-scoped; do not recreate the old global uq_ann_docid.
CREATE UNIQUE INDEX uq_ann_security_docid
    ON announcement (security_id, psx_document_id)
    WHERE psx_document_id IS NOT NULL;
CREATE UNIQUE INDEX uq_ann_hash
    ON announcement (security_id, content_hash) WHERE psx_document_id IS NULL;
CREATE INDEX idx_ann_security_date ON announcement (security_id, announcement_date DESC);

-- EVENT HISTORY: company payout/result declarations are never removed.
-- announced_at is interpreted as an Asia/Karachi wall time. event_hash covers
-- stable event fields; content_hash also covers correction-prone details.
CREATE TABLE company_payout (
    id                  bigserial PRIMARY KEY,
    security_id         bigint NOT NULL REFERENCES security(id),
    announced_at        timestamptz NOT NULL,
    period_ended        date,
    result_type         text,
    details             text,
    book_closure_start  date,
    book_closure_end    date,
    event_hash          char(64),
    content_hash        char(64) NOT NULL,
    first_seen          date NOT NULL,
    inserted_at         timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ck_company_payout_book_closure
        CHECK (
            book_closure_start IS NULL
            OR book_closure_end IS NULL
            OR book_closure_end >= book_closure_start
        )
);
CREATE UNIQUE INDEX uq_company_payout_hash
    ON company_payout (security_id, content_hash);
CREATE UNIQUE INDEX uq_company_payout_event_hash
    ON company_payout (security_id, event_hash)
    WHERE event_hash IS NOT NULL;
CREATE INDEX idx_company_payout_security_announced
    ON company_payout (security_id, announced_at DESC);

-- EVENT HISTORY: issuer financial-report documents are never removed. Rows
-- with a stable PSX document ID may receive corrected metadata while preserving
-- first_seen. Annual periods containing only a year retain period_ended_raw and
-- fiscal_year; no period-end date is inferred. IDs are text because legacy IDs
-- can be alphanumeric (for example, MEBL_Q4_2016).
CREATE TABLE financial_report_document (
    id                     bigserial PRIMARY KEY,
    security_id            bigint NOT NULL REFERENCES security(id),
    report_type            text NOT NULL,
    period_ended_raw       text NOT NULL,
    normalized_period_end  date,
    fiscal_year            integer,
    posting_date           date,
    psx_document_id        text,
    url                    text,
    content_hash           char(64) NOT NULL,
    first_seen             date NOT NULL,
    inserted_at            timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_fin_report_document_id
    ON financial_report_document (security_id, psx_document_id)
    WHERE psx_document_id IS NOT NULL;
CREATE UNIQUE INDEX uq_fin_report_hash_fallback
    ON financial_report_document (security_id, content_hash)
    WHERE psx_document_id IS NULL;
CREATE INDEX idx_fin_report_security_posting
    ON financial_report_document (security_id, posting_date DESC);


-- ---------------------------------------------------------------------------
-- 4. Rates: KIBOR / FX / metals
-- ---------------------------------------------------------------------------
-- KIBOR, generic FX OHLC, and metals use daily-series keys. Official SBP FX
-- publications use a normalized publication header plus currency/tenor facts
-- because several semantically different datasets can exist on the same date.

-- KIBOR by tenor (1W, 2W, 1M, 3M, 6M, 9M, 1Y, ...).
CREATE TABLE kibor_rate (
    quote_date   date NOT NULL,
    tenor        text NOT NULL,
    bid          numeric,
    offer        numeric,
    source_id    smallint REFERENCES data_source(id),
    inserted_at  timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (quote_date, tenor)
);

-- Generic market-feed FX OHLC quotes, keyed by date and pair (no tenor). The
-- official SBP PDF importer does not
-- write here because those publications are point rates with distinct
-- semantics and, for M2M, multiple tenors.
CREATE TABLE fx_rate (
    quote_date   date NOT NULL,
    base_ccy     char(3) NOT NULL,            -- 'USD'
    quote_ccy    char(3) NOT NULL,            -- 'PKR'
    open         numeric,
    high         numeric,
    low          numeric,
    close        numeric,
    bid          numeric,
    offer        numeric,
    source_id    smallint REFERENCES data_source(id),
    inserted_at  timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (quote_date, base_ccy, quote_ccy)
);

-- One metadata row for each official SBP FX PDF. Keeping document and date
-- metadata here avoids repeating it for every currency/tenor observation.
CREATE TABLE fx_publication (
    id                 bigserial PRIMARY KEY,
    publication_date   date NOT NULL,
    rate_type          text NOT NULL,
    effective_date     date,
    settlement_date    date,
    provider           text NOT NULL,
    unit               text NOT NULL,
    source_url         text NOT NULL,
    file_name          text NOT NULL,
    pdf_sha256         char(64) NOT NULL,
    pdf_size_bytes     integer NOT NULL,
    pdf_pages          smallint NOT NULL,
    observation_count  integer NOT NULL,
    source_id          smallint NOT NULL REFERENCES data_source(id),
    inserted_at        timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_fx_publication_date_type
        UNIQUE (publication_date, rate_type),
    CONSTRAINT ck_fx_publication_rate_type
        CHECK (rate_type IN (
            'conversion', 'open_market',
            'weighted_average_customer', 'mark_to_market'
        )),
    CONSTRAINT ck_fx_publication_provider CHECK (btrim(provider) <> ''),
    CONSTRAINT ck_fx_publication_unit CHECK (btrim(unit) <> ''),
    CONSTRAINT ck_fx_publication_source_url
        CHECK (source_url ~ '^https://(www\.)?sbp\.org\.pk/'),
    CONSTRAINT ck_fx_publication_pdf_sha256
        CHECK (pdf_sha256 ~ '^[0-9a-f]{64}$'),
    CONSTRAINT ck_fx_publication_pdf_size CHECK (pdf_size_bytes > 0),
    CONSTRAINT ck_fx_publication_pdf_pages CHECK (pdf_pages > 0),
    CONSTRAINT ck_fx_publication_observation_count
        CHECK (observation_count > 0)
);
CREATE INDEX idx_fx_publication_type_date
    ON fx_publication (rate_type, publication_date DESC);

-- Normalized point-rate observations. Single-rate publications use rate;
-- buying/selling publications use bid/offer. The two shapes cannot be mixed.
CREATE TABLE fx_rate_observation (
    publication_id  bigint NOT NULL
                    REFERENCES fx_publication(id) ON DELETE CASCADE,
    base_ccy        char(3) NOT NULL,
    quote_ccy       char(3) NOT NULL DEFAULT 'PKR',
    tenor           text NOT NULL DEFAULT 'spot',
    rate            numeric,
    bid             numeric,
    offer           numeric,
    inserted_at     timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (publication_id, base_ccy, quote_ccy, tenor),
    CONSTRAINT ck_fx_observation_base_ccy
        CHECK (base_ccy ~ '^[A-Z]{3}$'),
    CONSTRAINT ck_fx_observation_quote_ccy
        CHECK (quote_ccy ~ '^[A-Z]{3}$'),
    CONSTRAINT ck_fx_observation_pair CHECK (base_ccy <> quote_ccy),
    CONSTRAINT ck_fx_observation_tenor CHECK (btrim(tenor) <> ''),
    CONSTRAINT ck_fx_observation_value_shape
        CHECK (
            (rate IS NOT NULL AND rate > 0 AND bid IS NULL AND offer IS NULL)
            OR
            (rate IS NULL AND bid IS NOT NULL AND bid > 0
             AND offer IS NOT NULL AND offer > 0 AND bid <= offer)
        )
);
CREATE INDEX idx_fx_observation_pair_tenor
    ON fx_rate_observation (base_ccy, quote_ccy, tenor, publication_id);

-- Precious metals — gold & silver, by purity and unit.
CREATE TABLE metal_rate (
    quote_date   date NOT NULL,
    metal        text NOT NULL,               -- 'GOLD','SILVER'
    purity       text NOT NULL,               -- '24K','22K','999', ...
    unit         text NOT NULL,               -- 'tola','10g','gram','ounce'
    currency     char(3) NOT NULL DEFAULT 'PKR',
    price        numeric NOT NULL,
    source_id    smallint REFERENCES data_source(id),
    inserted_at  timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (quote_date, metal, purity, unit, currency)
);


-- ---------------------------------------------------------------------------
-- 5. Convenience views (current version only)
-- ---------------------------------------------------------------------------

CREATE VIEW v_current_profile AS
    SELECT * FROM company_profile_version WHERE is_current;

CREATE VIEW v_current_equity AS
    SELECT * FROM equity_profile_version WHERE is_current;

CREATE VIEW v_current_financials AS
    SELECT * FROM financial_statement WHERE is_current;

CREATE VIEW v_current_ratios AS
    SELECT * FROM financial_ratio WHERE is_current;

-- Full source-aware FX surface. Consumers must retain rate_type and tenor.
CREATE VIEW v_sbp_fx_rates AS
SELECT
    p.publication_date AS quote_date,
    p.rate_type,
    o.base_ccy,
    o.quote_ccy,
    o.tenor,
    o.rate,
    o.bid,
    o.offer,
    p.effective_date,
    p.settlement_date,
    p.provider,
    p.source_id,
    p.updated_at AS publication_updated_at,
    o.updated_at AS rate_updated_at
FROM fx_publication AS p
INNER JOIN fx_rate_observation AS o ON o.publication_id = p.id;

-- Canonical USD/PKR series for correlation with PSX market data.
CREATE VIEW v_usdpkr_m2m_ready AS
SELECT
    p.publication_date AS quote_date,
    o.rate,
    p.source_id,
    p.effective_date,
    p.updated_at
FROM fx_publication AS p
INNER JOIN fx_rate_observation AS o ON o.publication_id = p.id
WHERE p.rate_type = 'mark_to_market'
  AND o.base_ccy = 'USD'
  AND o.quote_ccy = 'PKR'
  AND o.tenor = 'ready'
  AND o.rate IS NOT NULL;


-- ============================================================================
-- 6. UPSERT PATTERNS  (reference — run from the scraper)
-- ============================================================================
-- Pattern A — conditional daily-series merge. Example: daily_quote.
--
--   INSERT INTO daily_quote (security_id, trade_date, open, high, low, close,
--                            turnover, change, section, source_id)
--   VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
--   ON CONFLICT (security_id, trade_date) DO UPDATE
--       SET open=EXCLUDED.open, high=EXCLUDED.high, low=EXCLUDED.low,
--           close=EXCLUDED.close, turnover=EXCLUDED.turnover,
--           change=EXCLUDED.change, section=EXCLUDED.section,
--           source_id=EXCLUDED.source_id,
--           updated_at=now()
--   WHERE (daily_quote.open, daily_quote.high, daily_quote.low,
--          daily_quote.close, daily_quote.turnover, daily_quote.change,
--          daily_quote.section, daily_quote.source_id)
--      IS DISTINCT FROM
--         (EXCLUDED.open, EXCLUDED.high, EXCLUDED.low, EXCLUDED.close,
--          EXCLUDED.turnover, EXCLUDED.change, EXCLUDED.section,
--          EXCLUDED.source_id);
--
-- Merge a validated complete snapshot before deleting target-date keys absent
-- from its incoming ID set. Never prune for partial, empty, undersized, or
-- ambiguous input. index_daily additionally requires an explicit provider
-- contract and may delete only absent codes owned by that same source_id;
-- cross-provider and out-of-contract rows are preserved, and every deletion is
-- audited. The same conditional-update shape applies to index_daily
-- and market_summary; market_index display names also update only on change.
-- Other owning importers define the corresponding conditional behavior for
-- daily_valuation, kibor_rate, fx_rate, and metal_rate.
-- technical_indicator_daily additionally uses a row-wise IS DISTINCT FROM
-- predicate and changes calculated_at only when its version, indicator values,
-- or source_updated_at materially differ.
--
-- ----------------------------------------------------------------------------
-- Pattern B — versioned insert-on-change, executed under SELECT ... FOR UPDATE.
--
-- Net effect per natural key:
--   * brand-new persistable value    -> insert one current row
--   * structurally invalid value     -> reject, including on an empty database
--   * unchanged content_hash         -> zero writes
--   * incomplete/regressed payload   -> preserve current row and warn
--   * changed on the same run date   -> update current row in place
--   * changed on a later run date    -> close current row, insert new current row
--   * run date older than valid_from -> reject
--
-- The same behavior covers company_profile_version, equity_profile_version,
-- financial_statement, and financial_ratio. The database constraints enforce
-- one current row and a valid [valid_from, valid_to) interval.
--
-- ----------------------------------------------------------------------------
-- Announcements — never deleted; stable-ID metadata may be corrected:
--
--   INSERT INTO announcement (security_id, psx_document_id, announcement_date,
--                             title, category, pdf_url, documents, content_hash,
--                             first_seen)
--   VALUES (...)
--   ON CONFLICT (security_id, psx_document_id)
--       WHERE psx_document_id IS NOT NULL
--   DO UPDATE SET announcement_date = EXCLUDED.announcement_date,
--                 title = EXCLUDED.title,
--                 category = EXCLUDED.category,
--                 pdf_url = EXCLUDED.pdf_url,
--                 documents = EXCLUDED.documents
--   WHERE the correction-prone columns are distinct;
--
-- Null-document-ID rows use (security_id, content_hash) and DO NOTHING.
-- ============================================================================

Contract change checklist

Every future change to this file must answer all of the following:

Is the change documentation-only, code-only, an operational recovery, or aforward-only migration?

Which service owns the write and which services consume it?

Does it change a natural key, source identity, date meaning, unit, nullmeaning, price basis, calculation version, or API field?

Are existing rows migrated, quarantined, retained, or intentionally leftuntouched?

Are identical reruns still no-ops with stable timestamps?

Can partial, empty, mixed-provider, or ambiguous input delete facts?

Are scraper, disposable-PostgreSQL, API, OpenAPI, and frontend tests updatedtogether where applicable?

Has the canonical contract revision been advanced and synchronized to everyrepository without modifying already-applied migrations?

No agent may declare the platform “all good” from scraper exit codes alone.Completion requires fact coverage, constraint, freshness, and endpoint checksappropriate to the changed surface.
