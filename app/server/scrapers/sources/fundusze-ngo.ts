/**
 * Fundusze.ngo.pl Scraper — DISABLED (2026-03):
 *
 * The page at fundusze.ngo.pl/aktualne is a Vue SPA served from api.ngo.pl.
 * Grant cards are injected by client-side JavaScript — no <a href> links or
 * text-block content exists in the static HTML response.
 *
 * The api.ngo.pl REST endpoints (e.g. /fundusze/v1/competitions) return 200 OK
 * with an empty body for unauthenticated requests, so there is no viable API
 * path without a login session.
 *
 * Leave enabled = false until a working authenticated API or a Playwright-based
 * approach is implemented.
 */

import type { RawGrant } from '~/types'

const LISTING_URL = 'https://fundusze.ngo.pl/aktualne'

export class FunduszeNgoScraper {
  source = 'fundusze-ngo'
  url = LISTING_URL
  enabled = false
  name = 'Fundusze.ngo.pl Scraper'

  async scrape(): Promise<RawGrant[]> {
    console.log('[fundusze-ngo] Scraper disabled — SPA requires authenticated API access')
    return []
  }
}
