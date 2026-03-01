# GRANgoTY (NGO Grants Aggregator) - AI Agent Instructions

Welcome to the GRANgoTY project! This `AGENTS.md` file contains essential context, architectural decisions, and conventions to help you work effectively on this codebase.

## 🧾 Project Summary
**GRANgoTY** is a web application that aggregates NGO funding/grant opportunities primarily from Polish and European sources, presenting them in a clean, filterable, multi-language interface.

- **Design Philosophy**: Hacker News-inspired, minimal, high-density list UI. Keyboard accessible.
- **Core Value**: Reduce the time NGOs spend searching for grants by scraping disparate government, regional, and EU portals into one centralized, filterable list.

## 🏗️ Tech Stack
- **Framework**: Nuxt 4 + Vue 3 (Composition API) + TypeScript
- **UI**: `@nuxt/ui` v4 + Tailwind CSS v4 (CSS-first, no `tailwind.config.ts`)
- **State**: Pinia stores (`@pinia/nuxt`)
- **i18n**: `@nuxtjs/i18n` v10 (5 languages, prefix routing)
- **Storage**: Upstash Redis (KV store)
- **Scraping**: Crawlee + Cheerio
- **Translation**: DeepL API
- **Deployment**: Vercel (ISR + cron jobs)
- **Monitoring**: Pino logging + Sentry

---

## 📁 Nuxt 4 Directory Structure & Conventions

**CRITICAL: This project uses Nuxt 4 directory structure.**
Do NOT create files in the root directory like in Nuxt 3.

```
ngo-grants-aggregator/
├── app/                    # ALL frontend code lives here
│   ├── assets/             # CSS (Tailwind v4 config is in tailwind.css)
│   ├── components/         # Auto-imported Vue components
│   ├── composables/        # Auto-imported composables (e.g., useGrants, useKeyboardShortcuts)
│   ├── layouts/            # Page layouts
│   ├── locales/            # i18n JSON files
│   ├── pages/              # File-based routing (/ and /grant/[id])
│   ├── stores/             # Pinia stores (grants.ts, filters.ts, ui.ts)
│   ├── types/              # TypeScript interfaces
│   └── app.vue             # Main entry component
├── app/server/             # Nitro backend code
│   ├── api/                # API endpoints (grants, cron, debug)
│   ├── scrapers/           # Crawlee scrapers (organized by tiers)
│   └── utils/              # Server-side utils (Redis, logger, errors)
├── public/                 # Static assets (favicon, etc.)
├── i18n.config.ts          # i18n configuration
├── nuxt.config.ts          # Main Nuxt config (points srcDir to 'app/')
└── vercel.json             # Deployment config (ISR rules, crons)
```

---

## 🎨 UI & Styling (Tailwind v4 + @nuxt/ui)

### Tailwind CSS v4
We have migrated to Tailwind CSS v4. **There is no `tailwind.config.ts`**.
- All configuration, custom colors (`--color-hn-orange`, `--color-primary-*`), and theme variables are defined in `app/assets/styles/tailwind.css` using the `@theme` directive.
- Content scanning is handled via `@source` directives in the CSS file.
- We use the `@tailwindcss/vite` plugin in `nuxt.config.ts`.
- **Note**: Modifiers like `!important` are placed at the end of classes in v4 (e.g., `bg-red-500!`).

### Design System
- **Hacker News Aesthetic**: Minimalist, dense information display. Uses custom classes like `.hn-list-item`, `.bg-hn-beige`.
- **Keyboard Shortcuts**: Fully implemented via `useKeyboardShortcuts.ts` (`j`/`k` for navigation, `s` to save, `o`/`Enter` to open, `/` for search, `?` for help).

---

## 🕷️ Scraping Architecture (Crawlee + Cheerio)

The scraping system is the heart of the backend. It lives in `app/server/scrapers/`.

### Tier System
Scrapers are organized into 5 tiers in `sources/index.ts`:
1. **Tier 1 (National)**: FunduszeNgo, Grantowo
2. **Tier 2 (Government)**: Witkac API, Gov.pl Pozytek, NIW Generator
3. **Tier 3 (Regional)**: Warsaw, Wrocław, Łódź, Poznań, Podkarpackie, Gdańsk, Leszno
4. **Tier 4 (European)**: EU Funding Tenders, Eurodesk, Active Citizens Fund
5. **Tier 5 (Sector)**: Aktywni Plus

*Note: Some scrapers (Małopolska, Kraków NGO) exist as files but are currently commented out in the registry.*

### Implementation Pattern
- Scrapers extend `BaseScraper` (`app/server/scrapers/base-scraper.ts`).
- We use **Crawlee** with **Cheerio** for fast, static HTML parsing. Dynamic sites requiring Playwright are noted but generally avoided for performance unless necessary.
- Data is normalized into the `Grant` interface before saving.

---

## 💾 Storage (Upstash Redis)

We use Upstash Redis for persistent storage across Vercel serverless functions.
- Client implementation is in `app/server/utils/redis.ts`.
- It uses standard Redis sets (`sadd`, `smembers`) for indexing (by source, category, region) and stores the actual JSON payloads as standard keys.
- **Environment Variables**: Uses Vercel KV standard vars (`KV_REST_API_URL`, `KV_REST_API_TOKEN`). Falls back to in-memory mock storage if env vars are missing during local dev.

---

## 🛡️ Error Handling & Monitoring

We have a production-grade error stack detailed in `ERROR_HANDLING_README.md`.

- **ScraperError Class**: Standardized error classification (Network, Timeout, RateLimit, Parse, NotFound, Server, Auth, Blocking, Unknown).
- **Circuit Breaker**: Prevents cascading failures when a target site goes down.
- **Retry Logic**: Exponential backoff with jitter.
- **Rate Limiting**: Token bucket algorithm to respect target site limits.
- **Logging**: Structured logging using `pino`.
- **Sentry**: Configured for both client (`sentry.client.config.ts`) and server. It scrubs PII (Polish PESEL, NIP, emails) before sending.

---

## 🌍 i18n (Internationalization)

- **Module**: `@nuxtjs/i18n` v10
- **Languages**: Polish (pl) [Default], English (en), Ukrainian (uk), Belarusian (be), German (de).
- **Strategy**: Prefix routing (`/en/grant/123`).
- **Files**: Translations are stored in `app/locales/*.json`.
- **Note**: Pluralization rules are custom defined in `i18n.config.ts` (especially for Slavic languages).

---

## ⚠️ Known Issues & Ongoing Work

1. **ESLint**: The project needs to migrate the ESLint config to v10. The `lint` script currently skips execution with a warning.
2. **Inactive Scrapers**: Some regional scrapers (e.g., Łódź, Poznań) exist in `sources/` but are not fully activated in the `allScrapers` registry array.
3. **Hydration**: We use `useHydrationSafeDate.ts` and `<SafeHydration>` wrapper to prevent Vue SSR hydration mismatches with dates and client-only logic. Always be mindful of SSR when rendering dates or browser-specific APIs.

---

## 🤖 AI Agent Workflow Guidelines

1. **Search Before You Code**: Always use tools like `ast_grep_search`, `bash` with `rg`, or `explore` subagents to understand where functionality lives before making changes.
2. **Respect the Nuxt 4 Structure**: Put composables in `app/composables/`, API routes in `app/server/api/`. Do not put things in the root.
3. **Follow the CSS-First Tailwind Approach**: Don't look for `tailwind.config.ts`. Make design token changes in `app/assets/styles/tailwind.css`.
4. **Error Handling**: When modifying scrapers, always use the established `ScraperError` types and `safeExtract` utilities. Do not throw generic `Error`s.
5. **Testing**: We use Vitest for unit tests (`tests/unit/`) and Playwright for E2E (`tests/e2e/`). Run `npm run test` or `npm run test:e2e` to verify changes.
