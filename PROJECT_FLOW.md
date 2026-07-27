# Webict Capital — Complete Project Flow & Architecture

> **Last updated:** July 27, 2026
> **Stack:** React 19 + Vite · TypeScript · Material UI · Framer Motion · Supabase Auth/user tables · WebICTCapital API · ECharts

---

## Table of Contents

1. [Application Bootstrap](#1-application-bootstrap)
2. [Global Layout & SEO](#2-global-layout--seo)
3. [Authentication System](#3-authentication-system)
4. [Navigation Structure](#4-navigation-structure)
5. [Page-by-Page Flow](#5-page-by-page-flow)
   - [Home `/`](#51-home-page-)
   - [Data `/data`](#52-data-page-data)
   - [Portfolio `/portfolio`](#53-portfolio-page-portfolio)
   - [Glossary `/glossary`](#54-glossary-page-glossary)
   - [Masterclasses `/masterclasses`](#55-masterclasses-page-masterclasses)
   - [SIP Calculator `/sip-calculator`](#56-sip-calculator-page-sip-calculator)
   - [Advisory `/advisory`](#57-advisory-page-advisory)
   - [About `/about`](#58-about-page-about)
6. [Shared Components](#6-shared-components)
7. [Data Layer — Supabase & Services](#7-data-layer--supabase--services)
8. [Caching & Performance](#8-caching--performance)
9. [Environment Variables](#9-environment-variables)
10. [External Services](#10-external-services)

---

## 1. Application Bootstrap

**Entry:** `src/main.tsx`

```
BrowserRouter
  └─ HelmetProvider          (react-helmet-async — per-page SEO)
       └─ ThemeProvider      (MUI custom theme)
            └─ AuthProvider  (Supabase auth context)
                 └─ App      (routing)
```

| File | Role |
|---|---|
| `index.html` | Static SEO shell — Schema.org JSON-LD, Open Graph, preloaded fonts |
| `src/main.tsx` | Wraps app in providers (Theme, Auth, Helmet, Router) |
| `src/App.tsx` | Defines all `<Route>` elements inside `<AppLayout>` |
| `src/app/AppLayout.tsx` | Shared layout wrapper (NavBar + Outlet + Footer + per-route SEO) |

---

## 2. Global Layout & SEO

**Component:** `AppLayout` (`src/app/AppLayout.tsx`)

Every page is rendered inside `AppLayout`, which provides:

| Feature | Implementation |
|---|---|
| **NavBar** | Sticky top bar with logo, desktop links, mobile drawer, user avatar/menu |
| **Footer** | Site links, social media (Instagram), copyright |
| **Page transitions** | `AnimatePresence` + `motion.div` fade-up on route change |
| **Per-route SEO** | `SEO_BY_PATH` object maps each pathname → `{ title, description, structuredData }` |
| **Open Graph / Twitter** | Injected via `<Helmet>` on every route change |
| **Structured Data** | JSON-LD schema per page (WebPage, DataCatalog, DefinedTermSet, Course list, WebApplication, Service, AboutPage) |

### SEO Map

| Route | Schema.org Type | Title Pattern |
|---|---|---|
| `/` | `WebPage` | Webict Capital \| PSX Stock Market Education… |
| `/about` | `AboutPage` | About Webict Capital \| PSX Investing… |
| `/data` | `DataCatalog` | PSX Market Data \| Daily Pakistan Stock Exchange… |
| `/glossary` | `DefinedTermSet` | PSX Investing Glossary \| Key Stock Market Terms… |
| `/masterclasses` | `ItemList` (Course) | PSX Investing Masterclasses \| Structured Learning… |
| `/sip-calculator` | `WebApplication` | SIP Calculator \| Estimate Your Systematic… |
| `/advisory` | `Service` | Investment Advisory \| Webict Capital - Coming Soon |
| `/portfolio` | *(uses `/` fallback)* | *(inherits home SEO)* |

---

## 3. Authentication System

**Provider:** `AuthContext` (`src/context/AuthContext.tsx`)
**Backend:** Supabase Auth with Google OAuth

### Flow

```
User clicks "Sign in" (AuthModal or locked feature)
  └─ signInWithGoogle()
       └─ supabase.auth.signInWithOAuth({ provider: 'google', options: { queryParams: { prompt: 'select_account' } } })
            └─ Redirects to Google → returns to app
                 └─ supabase.auth.onAuthStateChange() fires
                      └─ AuthContext updates `user` state
```

### Context API

| Export | Type | Description |
|---|---|---|
| `user` | `User \| null` | Current Supabase user object |
| `loading` | `boolean` | True while session is being resolved |
| `error` | `string \| null` | Last auth error message |
| `signInWithGoogle()` | `() => Promise<void>` | Triggers Google OAuth redirect |
| `signOut()` | `() => Promise<void>` | Signs out and clears session |
| `clearError()` | `() => void` | Resets error state |

### Where Google Sign-In Is Required

| Feature | Page | Guard Mechanism |
|---|---|---|
| Add/edit/delete trades | Portfolio | `requireUserId()` in `stockService.ts` throws if no user |
| View holdings & P&L | Portfolio | Data fetched only when `user` is truthy (`loadUserData`) |
| Watchlist add/remove | Portfolio | `requireUserId()` guard |
| Trade history | Portfolio | Fetched via `fetchUserTrades()` (requires auth) |
| AuthModal trigger | Portfolio | `isLocked` state opens modal automatically for anonymous users |

### Where Auth Is NOT Required

All other pages are fully public: Home, Data, Glossary, Masterclasses, SIP Calculator, Advisory, About.

---

## 4. Navigation Structure

**Config:** `src/content/siteContent.ts` → `navItems[]`

```
NavBar
├── Learn (dropdown)
│   ├── Glossary        → /glossary
│   └── Masterclasses   → /masterclasses
├── Tools (dropdown)
│   └── SIP Calculator  → /sip-calculator
├── My Portfolio         → /portfolio
├── Data                 → /data
├── Advisory             → /advisory
└── About us             → /about
```

**Footer columns** (`footerColumns`):
- Social Media: Instagram link
- Webict Capital: Glossary, Masterclasses, Portfolio, Data, Advisory, About us

---

## 5. Page-by-Page Flow

---

### 5.1 Home Page (`/`)

**Component:** `HomePage` (`src/components/pages/HomePage.tsx`)
**Auth Required:** ❌ No

#### Sections

| Section | Content | Data Source |
|---|---|---|
| Hero | Headline, tagline, CTA buttons (Explore Markets, View Masterclasses) | **Static** (hardcoded) |
| Stats bar | "300+ Investors trained", "12+ PSX workshops", "95% Satisfaction rate" | **Static** (`STATS` array) |
| Product cards | Markets/PSX Overview, Glossary, SIP Calculator — each with preview, description, link | **Static** (`PRODUCTS` array) |
| Newsletter | Email subscription form | **Web3Forms API** (`POST https://api.web3forms.com/submit`) |

#### External Calls
- **Web3Forms** — newsletter signup (access key: `6f47bd12-...`)

---

### 5.2 Markets Workspace (`/data`)

The former single Data page is now a route-backed Markets workspace. `/data`
is retained for compatibility and serves the Market Overview.

| Route | Component | Public data source |
|---|---|---|
| `/data` | `MarketsOverviewPage` | `GET /api/market-summary/latest/tickers` |
| `/data/stocks` | `StocksExplorerPage` | `GET /api/market-summary/latest/tickers` |
| `/data/compare` | `StockComparisonPage` | `GET /api/tickers/compare` |
| `/data/rates` | `RatesMacroPage` | `GET /api/rates/kibor`, `GET /api/rates/usd-pkr` |
| `/stocks/:symbol` | `StockDetailPage` | `GET /api/tickers/{symbol}` |

`src/lib/api/*` is the public market-data boundary. It uses
`VITE_MARKET_API_BASE_URL` with default `https://api.webictcapital.com`,
AbortController cancellation, request deduplication, bounded cache freshness,
date-only query serialization, typed DTOs, and normalized errors.

Confirmed endpoint gaps:
- Public Swagger/OpenAPI is not exposed at `/swagger/index.html` or
  `/swagger/v1/swagger.json`; route attributes and DTOs in the deployed API
  project were used as the contract source.
- `GET /api/market-summary/latest/tickers` has no date/range parameter,
  pagination, listing-level technical fields, or richer sector taxonomy beyond
  `section`.
- Listing columns such as market cap, latest RSI, and SMA relationship are not
  fabricated when unsupported.
- `TickerQuoteDto.marketCap` and `peRatioTtm` may be null in production
  responses and are rendered as unavailable.
- Browser requests currently require API CORS enablement. A GET with
  `Origin: http://127.0.0.1:5174` returned HTTP 200 JSON without
  `Access-Control-Allow-Origin`, so local visual verification renders the
  frontend network-error state until API CORS allows the frontend origin.

Legacy details retained below describe the pre-migration implementation and
remaining Portfolio dependencies.

### 5.2 Legacy Data Page (`/data`) - superseded

**Component:** `DataPage` (`src/components/pages/DataPage.tsx`)
**Auth Required:** ❌ No

#### Data Loading Flow

```
On mount:
  1. fetchMarketDailySummaryRows(1)        → Supabase RPC → latest market_daily_summary row
  2. Extract trade_date from summary
  3. Promise.all([
       fetchSupabaseTradeDay(summaryRow),   → Supabase table query → all stocks for that date
       fetchMarketAiSummary(tradeDate),     → Supabase table → market_ai_summaries
     ])
```

#### Sections & Data Sources

| Section | Data Source | Details |
|---|---|---|
| **Market Dashboard** (KSE-100, KSE-30, All Shares, KSE Meezan 30, etc.) | **Supabase** `market_daily_summary` table via `fetchMarketDailySummaryRows()` → `getMarketIndexSnapshots()` | Shows index close, change, change%, high/low/volume per index |
| **AI Market Summary** | **Supabase** `market_ai_summaries` table via `fetchMarketAiSummary()` | AI-generated daily analysis (generated server-side via Google Gemini API) |
| **Market Stats** (Advances/Declines/Unchanged/Volume) | **Supabase** `market_daily_summary` row fields | Derived from `advances`, `declines`, `unchanged`, `curr_volume` |
| **Stock Heatmap** | **Supabase** stock table rows | Treemap colored by change, sized by turnover |
| **Sector Activity** (Bar chart + Donut chart) | **Supabase** stock rows, grouped by `industry` | Aggregates turnover, gainers/losers per sector |
| **Top Gainers / Top Losers / Most Active** | **Supabase** stock rows, ranked client-side | Top N by change%, sorted descending/ascending |
| **Full Stock Table** | **Supabase** stock rows | Filterable by search, movement (gainers/losers/unchanged), industry |
| **CSV Export** | Client-side | Generates CSV blob from displayed stocks |

#### Supabase Tables Used
- `market_daily_summary` — market-level summary (indexes, advances/declines, volume)
- Stock data table (via RPC `fetchSupabaseTradeDay`) — per-stock OHLC, turnover, EPS, P/E
- `market_ai_summaries` — AI-generated market analysis text

---

### 5.3 Portfolio Page (`/portfolio`)

**Component:** `PortfolioPage` (`src/components/pages/PortfolioPage.tsx`)
**Auth Required:** ✅ Yes (for user-specific data) / Partial (market data loads anonymously)

#### Two-Tier Data Loading

```
On mount (refreshPortfolio):
  If NO user → loadMarketOnly():
    ├── fetchMarketDailySummaryRows(2)   → market indexes
    └── fetchUniqueSymbols()             → all market symbol snapshots

  If user exists → loadUserData():
    ├── fetchMarketDailySummaryRows(2)   → market indexes
    ├── fetchUserTrades()                → user's trade records (Supabase: user_trades)
    ├── fetchUniqueSymbols()             → all market snapshots
    └── fetchWatchlistSymbols()          → user's watchlist (Supabase: watchlists)
```

#### Sections & Data Sources

| Section | Auth? | Data Source | Details |
|---|---|---|---|
| **Market Overview** (KSE-100, KSE-30, indexes) | ❌ | **Supabase** `market_daily_summary` | Shows latest index values, change, history charts |
| **Market Index History** (1M/3M/6M/1Y) | ❌ | **Supabase** via `fetchMarketHistoryRows()` | Loaded lazily when modal opened |
| **Holdings Table** | ✅ | **Supabase** `user_trades` + live market data | Calculates shares, avg cost, market value, P&L |
| **Sector Allocation** (pie chart) | ✅ | Derived from holdings + market `sector` field | Client-side aggregation |
| **Portfolio Summary** (Total MV, Day P&L, Total P&L) | ✅ | Derived from holdings | Client-side calculation |
| **Trade History** (recent 10) | ✅ | **Supabase** `user_trades` | Sorted by date descending |
| **Watchlist** | ✅ | **Supabase** `watchlists` + live market data | Symbols enriched with live price/change/spark |
| **Add Trade Modal** | ✅ | Writes to **Supabase** `user_trades` via `addUserTrade()` | BUY/SELL form |
| **Add to Watchlist** | ✅ | Writes to **Supabase** `watchlists` via `addWatchlistSymbol()` | Symbol picker |
| **Stock Detail Drawer** | ❌ | **Supabase** via `fetchStockDetail()` RPC | Full stock profile with OHLC chart |
| **Auth Modal** | — | Triggers `signInWithGoogle()` | Opens when anonymous user tries protected action |

#### Supabase Tables Used
- `market_daily_summary` — indexes, market breadth
- `user_trades` — BUY/SELL records per user
- `watchlists` — user watchlist symbols
- Stock detail RPC (`get_stock_details`) — individual stock deep-dive

#### Key Guard: `requireUserId()`
Located in `stockService.ts`, this helper throws an error if no authenticated user ID is available. Used by:
- `fetchUserTrades()`
- `addUserTrade()`
- `deleteUserTrade()`
- `fetchWatchlistSymbols()`
- `addWatchlistSymbol()`
- `removeWatchlistSymbol()`

---

### 5.4 Glossary Page (`/glossary`)

**Component:** `GlossaryPage` (`src/components/pages/GlossaryPage.tsx`)
**Auth Required:** ❌ No

#### Data Source
- **Static** — imported from `src/components/pages/glossary.ts` (`glossaryEntries` array, ~139KB)
- Each entry: `{ letter, term, meaning, description }`

#### Features

| Feature | Implementation |
|---|---|
| Search | Client-side text filter across term + meaning + description |
| A–Z filter | Alphabet buttons, filters by `letter` field |
| Sort A→Z / Z→A | Client-side `localeCompare` |
| Pagination | 25 terms per page, client-side |
| Expand/collapse definitions | Accordion-style per term |
| Related terms | Auto-linked to same-letter terms |
| Popular terms sidebar | Static list (EPS, P/E Ratio, Dividend Yield, Market Cap, Beta) |

---

### 5.5 Masterclasses Page (`/masterclasses`)

**Component:** `MasterclassesPage` (`src/components/pages/MasterclassesPage.tsx`)
**Auth Required:** ❌ No

#### Data Source
- **Entirely static** — all content hardcoded in component (`SEASONS[]`, `FEATURES[]`, `AUDIENCES[]`)

#### Sections

| Section | Content |
|---|---|
| Hero | Title, description, hero image (`/herosection.webp`), "View Curriculum" CTA |
| Feature strip | 4 cards: Structured Learning, Expert Led, Practical, Certificate |
| Curriculum (4 seasons) | Accordion with season title + lesson list — Season 01–04, 3-4 lessons each |
| Audience band | "Who it's for" — Serious Investors, Professionals, Aspiring Analysts |

---

### 5.6 SIP Calculator Page (`/sip-calculator`)

**Component:** `SipCalculatorPage` (`src/components/pages/SipCalculatorPage.tsx`)
**Auth Required:** ❌ No

#### Data Source
- **Entirely client-side calculation** — no API calls

#### Features

| Feature | Details |
|---|---|
| Input sliders | Monthly investment (Rs 500–100K), Annual return (0–30%), Period (1–30 yrs) |
| Inflation toggle | Adjusts future value by 9% annual inflation rate |
| Metric cards | Invested amount, Est. returns, Total value |
| Growth chart | ECharts line chart (invested vs. total value over years) |
| Date display | SIP start date (May 2025) → calculated end date |
| Yearly breakdown table | Collapsible table: year, invested, gains, balance |
| Return breakdown | Visual bar showing invested % vs. gain % |
| "Why SIP" education | Static principles: Rupee Cost Averaging, Power of Compounding, Financial Discipline |
| Disclaimer | Static legal disclaimer text |

---

### 5.7 Advisory Page (`/advisory`)

**Component:** `AdvisoryPage` (`src/components/pages/AdvisoryPage.tsx`)
**Auth Required:** ❌ No

#### Data Source
- **Static content** + **Web3Forms API** for waitlist

#### Sections

| Section | Content | Data Source |
|---|---|---|
| Hero | "Advisory is coming" headline, hero image (`/advisory-hero.png`) | **Static** |
| Features grid | Strategy Sessions, Portfolio Reviews, Risk Guidance, Market Perspective | **Static** (`FEATURES[]`) |
| Waitlist form | Name, email, investor type dropdown, consent checkbox | **Web3Forms API** |
| "What to expect" sidebar | 5 expectation bullet points | **Static** (`EXPECTATIONS[]`) |
| FAQ accordion | 4 Q&A items in 2-column layout | **Static** (`FAQ_ITEMS[]`) |

---

### 5.8 About Page (`/about`)

**Component:** `AboutPage` (`src/components/pages/AboutPage.tsx`)
**Auth Required:** ❌ No

#### Data Source
- **Static content** + **Web3Forms API** for contact form

#### Sections

| Section | Content | Data Source |
|---|---|---|
| Hero | "Built for serious investors" + company info (Karachi, PSX focus) | **Static** |
| Vision | 3 pillars: Beyond the Obvious, Independent Thinking, Turning Data into Conviction | **Static** |
| Who/What/Why | 3 highlight cards | **Static** (`teamHighlights[]`) |
| Principles | Clarity Over Noise, Long-Term Discipline, Local Context Global Standards | **Static** (`principles[]`) |
| Founder message | Asaad Sohail's personal message + quote | **Static** |
| Closing tagline | "Stay Curious. Stay Disciplined." | **Static** |
| Contact form | Full name, email, subject, message → submit | **Web3Forms API** |

---

## 6. Shared Components

| Component | File | Used In | Purpose |
|---|---|---|---|
| `NavBar` | `src/components/layout/NavBar.tsx` | AppLayout | Top navigation, mobile drawer, user menu (sign out) |
| `Footer` | `src/components/layout/Footer.tsx` | AppLayout | Site links, copyright |
| `AuthModal` | `src/components/AuthModal.tsx` | Portfolio | Google sign-in dialog with benefits list |
| `StockDrawer` | `src/components/StockDrawer.tsx` | Portfolio, Data | Full stock detail modal (OHLC chart, financials, ranges) |
| `MotionReveal` | `src/components/animations/MotionReveal.tsx` | All pages | Scroll-triggered fade-up animation wrapper |
| `PulseSkeleton` | `src/components/PulseSkeleton.tsx` | StockDrawer | Loading skeleton placeholder |
| `CustomDataTable` | `src/components/pages/CustomDataTable.tsx` | Data | Paginated stock table with search highlighting |
| `FiltersBar` | `src/components/pages/FiltersBar.tsx` | Data | Movement filter (All/Gainers/Losers/Unchanged) |
| `MarketVisuals` | `src/components/market/MarketVisuals.tsx` | Data | Heatmap, BarChart, DonutChart components |
| `CustomSkeleton` | `src/components/pages/CustomSkeleton.tsx` | Data | Market dashboard loading skeletons |

---

## 7. Data Layer — Supabase & Services

### Supabase Client

**File:** `src/lib/supabase.ts`

```typescript
const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, {
  auth: { detectSessionInUrl: true }
})
```

### Stock Service

**File:** `src/lib/stockService.ts` (~1100 lines)

This remains the Supabase auth/user-table service for portfolio trades and
watchlists. Public market data for the Markets workspace now goes through
`src/lib/api/*`.

#### Public Functions (No Auth)

| Function | Supabase Source | Cache TTL | Description |
|---|---|---|---|
| `fetchMarketDailySummaryRows(limit)` | `market_daily_summary` table | 3 min | Latest N market summary rows |
| `fetchMarketHistoryRows(column, days)` | `market_daily_summary` table | 5 min | Historical index values |
| `fetchMarketAiSummary(date)` | `market_ai_summaries` table | 5 min | AI-generated daily market analysis |
| `fetchUniqueSymbols()` | RPC `get_unique_symbols` | 3 min | All traded symbols with latest price/change/spark |
| `fetchStockDetail(symbol)` | RPC `get_stock_details` | 2 min | Full stock profile (OHLC history, financials, corporate actions) |

#### Authenticated Functions (Require User)

| Function | Supabase Source | Description |
|---|---|---|
| `fetchUserTrades()` | `user_trades` table | All trades for current user |
| `addUserTrade(trade)` | `user_trades` table (INSERT) | Record a BUY/SELL |
| `deleteUserTrade(id)` | `user_trades` table (DELETE) | Remove a trade |
| `fetchWatchlistSymbols()` | `watchlists` table | User's watchlist symbol list |
| `addWatchlistSymbol(symbol)` | `watchlists` table (INSERT) | Add to watchlist |
| `removeWatchlistSymbol(symbol)` | `watchlists` table (DELETE) | Remove from watchlist |

Client-side `requireUserId()` is a UX guard, not an authorization boundary.
Production Supabase RLS must enforce that `user_trades.user_id` and
`watchlists.user_id` match `auth.uid()` for all select/insert/update/delete
policies.

### Supabase Tables

| Table | Used By | Description |
|---|---|---|
| `market_daily_summary` | Data, Portfolio | Daily market summary: indexes, advances/declines, volume |
| `market_ai_summaries` | Data | AI-generated market commentary per trade date |
| `user_trades` | Portfolio | User trade records (BUY/SELL with symbol, quantity, price, date) |
| `watchlists` | Portfolio | User watchlist entries (user_id + symbol) |
| Stock data (via RPCs) | Data, Portfolio, StockDrawer | Per-stock OHLC, turnover, EPS, P/E, financials, corporate actions |

---

## 8. Caching & Performance

`stockService.ts` implements a manual caching layer:

| Mechanism | Implementation |
|---|---|
| **TTL Cache** | `Map<string, { data, timestamp }>` — returns cached data if within TTL |
| **Request Deduplication** | `Map<string, Promise>` — concurrent calls for the same key share one in-flight request |
| **Cache Keys** | Function-specific (e.g. `market-summary-2`, `stock-detail-OGDC`) |
| **Default TTLs** | 2–5 minutes depending on data volatility |

This prevents redundant Supabase calls when navigating between pages or re-rendering components.

---

## 9. Environment Variables

| Variable | Required | Used By | Purpose |
|---|---|---|---|
| `VITE_SUPABASE_URL` | ✅ | `supabase.ts` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ | `supabase.ts` | Supabase anonymous/public key |
| `LLM_API_KEY` | Server-side | AI summary generation | Google Gemini API key |
| `LLM_API_URL` | Server-side | AI summary generation | Gemini API endpoint |

---

## 10. External Services

| Service | Usage | Pages |
|---|---|---|
| **WebICTCapital API** | Public market data, ticker detail/comparison, KIBOR, USD/PKR | Markets workspace |
| **Supabase** (Auth + Database) | Authentication (Google OAuth), user trades, watchlists, temporary Portfolio market enrichment | Portfolio |
| **Google OAuth** | User sign-in via Supabase Auth | Portfolio (AuthModal) |
| **Web3Forms** | Contact form & newsletter submissions | Home, About, Advisory |
| **Google Gemini API** | AI-generated daily market summaries (server-side, stored in Supabase) | Data |

---

## Summary: Auth Requirement Matrix

| Page | Route | Auth Required | Data Source |
|---|---|---|---|
| Home | `/` | ❌ | Static + Web3Forms |
| Markets Overview | `/data` | ❌ | WebICTCapital API |
| Stocks Explorer | `/data/stocks` | ❌ | WebICTCapital API |
| Stock Comparison | `/data/compare` | ❌ | WebICTCapital API |
| Rates & Macro | `/data/rates` | ❌ | WebICTCapital API |
| Stock Detail | `/stocks/:symbol` | ❌ | WebICTCapital API |
| Portfolio | `/portfolio` | ✅ Partial | Supabase (market: public, user data: auth) |
| Glossary | `/glossary` | ❌ | Static (local `glossary.ts`) |
| Masterclasses | `/masterclasses` | ❌ | Static (hardcoded) |
| SIP Calculator | `/sip-calculator` | ❌ | Client-side calculation only |
| Advisory | `/advisory` | ❌ | Static + Web3Forms |
| About | `/about` | ❌ | Static + Web3Forms |
