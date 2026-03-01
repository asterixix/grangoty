/**
 * Central export point for all grant scrapers
 * Organized by tier based on source importance
 */

// Tier 1: Primary National Portals
export { FunduszeNgoScraper } from './fundusze-ngo'
export { GrantowoPlScraper } from './grantowo'

// Tier 2: Government & Official Systems
export { WitkacApiScraper, WITKAC_MUNICIPALITY_IDS } from './witkac-api'
export { GovPlPozytekScraper } from './gov-pl-pozytek'
export { NiwGeneratorScraper } from './niw-generator'

// Tier 3: Regional/Municipal Portals
// export { MalopolskaPlScraper } from './malopolska'
// export { KrakowNgoPlScraper } from './krakow-ngo'
export { WarsawNgoScraper } from './warsaw'
export { WroclawNgoScraper } from './wroclaw'
export { LodzNgoScraper } from './lodz'
export { PoznanNgoScraper } from './poznan'
export { PodkarpackieNgoScraper } from './podkarpackie'
export { GdanskNgoScraper } from './gdansk'
export { LesznoNgoScraper } from './leszno'

// Tier 4: European & International Sources
export { EuFundingTendersScraper } from './eu-funding-tenders'
export { EurodeskPlScraper } from './eurodesk'
export { ActiveCitizensFundScraper } from './active-citizens-fund'

// Tier 5: Sector-Specific Sources
export { AktywniPlusScraper } from './aktywni-plus'

// Import types
import type { RawGrant } from '~/app/types'

// Scraper registry
import { FunduszeNgoScraper } from './fundusze-ngo'
import { GrantowoPlScraper } from './grantowo'
import { WitkacApiScraper } from './witkac-api'
import { GovPlPozytekScraper } from './gov-pl-pozytek'
import { NiwGeneratorScraper } from './niw-generator'
import { EuFundingTendersScraper } from './eu-funding-tenders'
import { EurodeskPlScraper } from './eurodesk'
import { ActiveCitizensFundScraper } from './active-citizens-fund'
// import { MalopolskaPlScraper } from './malopolska'
// import { KrakowNgoPlScraper } from './krakow-ngo'
import { WarsawNgoScraper } from './warsaw'
import { WroclawNgoScraper } from './wroclaw'
import { LodzNgoScraper } from './lodz'
import { PoznanNgoScraper } from './poznan'
import { PodkarpackieNgoScraper } from './podkarpackie'
import { GdanskNgoScraper } from './gdansk'
import { LesznoNgoScraper } from './leszno'
import { AktywniPlusScraper } from './aktywni-plus'

/**
 * All registered scrapers
 * Add new scrapers to this array
 */
export const allScrapers = [
  // Tier 1: Primary National Portals
  new FunduszeNgoScraper(),
  new GrantowoPlScraper(),

  // Tier 2: Government & Official Systems
  new WitkacApiScraper(),
  new GovPlPozytekScraper(),
  new NiwGeneratorScraper(),

  // Tier 3: Regional Portals
  // new MalopolskaPlScraper(),
  // new KrakowNgoPlScraper(),
  new WarsawNgoScraper(),
  new WroclawNgoScraper(),
  new LodzNgoScraper(),
  new PoznanNgoScraper(),
  new PodkarpackieNgoScraper(),
  new GdanskNgoScraper(),
  new LesznoNgoScraper(),

  // Tier 4: European & International
  new EuFundingTendersScraper(),
  new EurodeskPlScraper(),
  new ActiveCitizensFundScraper(),

  // Tier 5: Sector-Specific
  new AktywniPlusScraper(),
]

/**
 * Get enabled scrapers only
 */
export function getEnabledScrapers() {
  return allScrapers.filter(scraper => scraper.enabled)
}

/**
 * Get scrapers by category/tier
 */
export function getScrapersByTier(tier: 'primary' | 'government' | 'regional' | 'european' | 'sector') {
  const tierMap = {
    primary: ['fundusze-ngo', 'grantowo'],
    government: ['witkac-api', 'gov-pl-pozytek', 'niw-generator'],
    regional: ['malopolska', 'krakow-ngo', 'warsaw', 'wroclaw', 'lodz', 'poznan', 'podkarpackie', 'gdansk', 'leszno'],
    european: ['eu-funding-tenders', 'eurodesk', 'active-citizens-fund'],
    sector: ['aktywni-plus'],
  }
  
  return allScrapers.filter(scraper => tierMap[tier].includes(scraper.source))
}

const SCRAPER_TIMEOUT_MS = 8_000

function runScraperWithTimeout(scraper: { source: string; scrape: () => Promise<RawGrant[]> }): Promise<RawGrant[]> {
  const timeout = new Promise<RawGrant[]>((resolve) =>
    setTimeout(() => {
      console.warn(`[scrapers] ${scraper.source} timed out after ${SCRAPER_TIMEOUT_MS}ms`)
      resolve([])
    }, SCRAPER_TIMEOUT_MS)
  )

  const scrape = scraper.scrape().catch((error: unknown) => {
    console.error(`[scrapers] ${scraper.source} failed:`, error)
    return [] as RawGrant[]
  })

  return Promise.race([scrape, timeout])
}

/**
 * Run all enabled scrapers in parallel, each with a per-scraper timeout.
 * The entire run is capped at 45s so Redis writes have time before the
 * Vercel 60s Lambda limit is reached.
 */
export async function runAllScrapers(): Promise<RawGrant[]> {
  const enabled = getEnabledScrapers()
  console.log(`[scrapers] Running ${enabled.length} enabled scrapers`)

  const TOTAL_TIMEOUT_MS = 45_000

  const scrapeAll = Promise.allSettled(
    enabled.map(scraper => runScraperWithTimeout(scraper))
  )

  const totalTimeout = new Promise<PromiseSettledResult<RawGrant[]>[]>((resolve) =>
    setTimeout(() => {
      console.warn('[scrapers] Total timeout reached — returning partial results')
      resolve([])
    }, TOTAL_TIMEOUT_MS)
  )

  const results = await Promise.race([scrapeAll, totalTimeout]) as PromiseSettledResult<RawGrant[]>[]

  const allGrants: RawGrant[] = []

  for (const result of results) {
    if (result.status === 'fulfilled') {
      allGrants.push(...result.value)
    }
  }

  console.log(`[scrapers] Total raw grants collected: ${allGrants.length}`)
  return allGrants
}