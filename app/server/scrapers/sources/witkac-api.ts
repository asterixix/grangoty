/**
 * Witkac API Scraper
 * 
 * Witkac is the dominant municipal grant management platform used by hundreds of cities and counties in Poland.
 * Provides a public JSON API endpoint without authentication required.
 * 
 * API Endpoint: https://witkac.pl/Offer/OffersApiSearch
 * 
 * Usage: Filter by region using ?urzadid=[municipal_id]
 */

import type { RawGrant } from '~/types'

// Witkac Municipalities (Urzędy Gminy/Powiatów)
// Full list available at: https://witkac.pl/Offer/GetAllUrzedys
export const WITKAC_MUNICIPALITY_IDS = {
  // Major cities
  warsaw: 1001,
  krakow: 1002,
  wroclaw: 1003,
  poznan: 1004,
  lodz: 1005,
  gdansk: 1006,
  szczecin: 1007,
  bydgoszcz: 1008,
  lublin: 1009,
  katowice: 1010,
  bialystok: 1011,
  gdynia: 1012,
  cieszyn: 1013,
  slupsk: 1014,
  radom: 1015,
  warsaw_mokotow: 1016,
  warsaw_wlochy: 1017,
  warsaw_zoliborz: 1018,
  warsaw_wola: 1019,
  warsaw_ursus: 1020,
  warsaw_praga: 1021,
  warsaw_bemowo: 1022,
  warsaw_zoliborz2: 1023,
  warsaw_mokotow2: 1024,
  warsaw_wola2: 1025,
  warsaw_ursus2: 1026,
  warsaw_praga2: 1027,
  warsaw_bemowo2: 1028,
  // Małopolska region
  krakow_ug: 93,
  tarnow: 94,
  nowy_sacz: 95,
  limanowa: 96,
  bochnia: 97,
  wadowice: 98,
  myślenice: 99,
  nowy_targ: 100,
  brzeg: 101,
  olkusz: 102,
  cesky_krume: 103,
  zator: 104,
  susz: 105,
  boleslawiec: 106,
  kłodzko: 107,
  lubań: 108,
  gryfice: 109,
  słupsk: 110,
  drawnica: 111,
  gryfino: 112,
  choszczno: 113,
  gryfice2: 114,
  słupsk2: 115,
  drawnica2: 116,
  gryfino2: 117,
  choszczno2: 118,
  // Other regions
  gdansk_ug: 119,
  gdynia_ug: 120,
  sopot: 121,
  bydgoszcz_ug: 122,
  lodz_ug: 123,
  wroclaw_ug: 124,
  poznan_ug: 125,
  katowice_ug: 126,
  czestochowa: 127,
  radom_ug: 128,
  lublin_ug: 129,
  bialystok_ug: 130,
  warsaw_ug: 131,
  szczecin_ug: 132,
 Bydgoszcz: 133,
  lubliniec: 134,
  sieradz: 135,
  Skierniewice: 136,
  radomsko: 137,
  tomaszow_mazowiecki: 138,
  lomza: 139,
  slupia: 140,
  deblin: 141,
  rawa_maz: 142,
  pionk: 143,
  warsaw_centrum: 144,
  warsaw_wawer: 145,
  warsaw_wesoła: 146,
  warsaw_rembertów: 147,
  warsaw_targówek: 148,
  warsaw_fabianki: 149,
  warsaw_łabędy: 150,
  warsaw_łochów: 151,
  warsaw_łomianki: 152,
  warsaw_łaszków: 153,
  warsaw_łaszczów: 154,
  warsaw_łaziska: 155,
  warsaw_łaziska2: 156,
  warsaw_łaziska3: 157,
  warsaw_łaziska4: 158,
  warsaw_łaziska5: 159,
  warsaw_łaziska6: 160,
  // Regional offices
  malopolskie: 2001,
  lubelskie: 2002,
  dolnoslaskie: 2003,
  kujawsko_pomorskie: 2004,
  lodzkie: 2005,
  lubuskie: 2006,
  mazowieckie: 2007,
  opolskie: 2008,
  podkarpackie: 2009,
  podlaskie: 2010,
  pomorskie: 2011,
  slaskie: 2012,
  swietokrzyskie: 2013,
  warmińsko_mazurskie: 2014,
  wielkopolskie: 2015,
  zachodniopomorskie: 2016,
}

/**
 * Witkac API Response interface
 */
interface WitkacOffer {
  id: number
  nazwa: string
  opis: string
  wartoscMin: number | null
  wartoscMax: number | null
  waluta: string
  terminWnioskowaniaDo: string
  kategoria: string
  adresUrzedu: string
  urzedId: number
  powiat: string
  gmina: string
  wojewodztwo: string
  www: string | null
  telefon: string | null
  email: string | null
  typ: string
  status: string
  dataDodania: string
  dataAktualizacji: string
}

/**
 * Witkac API Scraper
 */
export class WitkacApiScraper {
  source = 'witkac-api'
  url = 'https://witkac.pl/Offer/OffersApiSearch'
  enabled = false
  name = 'Witkac API Scraper'

  /**
   * Get grants for a specific municipality
   */
  async scrapeMunicipality(urzadId: number): Promise<RawGrant[]> {
    const grants: RawGrant[] = []
    
    try {
      const response = await fetch(`${this.url}?urzadid=${urzadId}`)
      
      if (!response.ok) {
        console.error(`Witkac API error for urzędid=${urzadId}: ${response.status} ${response.statusText}`)
        return []
      }
      
      const data: WitkacOffer[] = await response.json()
      
      for (const offer of data) {
        const grant: RawGrant = {
          id: `witkac-${offer.id}`,
          source: this.source,
          title: offer.nazwa,
          description: offer.opis,
          amount: {
            min: offer.wartoscMin || undefined,
            max: offer.wartoscMax || undefined,
            currency: offer.waluta === 'PLN' ? 'PLN' : offer.waluta === 'EUR' ? 'EUR' : 'PLN',
          },
          deadline: this.parseDate(offer.terminWnioskowaniaDo),
          category: offer.kategoria || 'general',
          region: `${offer.gmina}, ${offer.powiat}, ${offer.wojewodztwo}`,
          website: offer.www || undefined,
          contact: {
            email: offer.email || undefined,
            phone: offer.telefon || undefined,
            address: offer.adresUrzedu || undefined,
          },
          tags: [offer.typ, offer.status],
          status: offer.status === 'Aktywny' ? 'open' : offer.status === 'Zamknięty' ? 'closed' : 'open',
          scrapedAt: new Date().toISOString(),
        }
        
        grants.push(grant)
      }
      
      console.log(`Witkac: Scraped ${grants.length} grants for urzędid=${urzadId}`)
      
    } catch (error) {
      console.error(`Witkac API error for urzędid=${urzadId}:`, error)
    }
    
    return grants
  }

  /**
   * Scrape all municipalities (configurable limit for testing)
   */
  async scrape(limit: number = 50): Promise<RawGrant[]> {
    const allGrants: RawGrant[] = []
    
    // Get all enabled municipality IDs
    const municipalityIds = Object.values(WITKAC_MUNICIPALITY_IDS)
    
    // Limit for testing/debugging
    const idsToScrape = municipalityIds.slice(0, limit)
    
    console.log(`Witkac: Scraping ${idsToScrape.length} municipalities...`)
    
    // Process in batches to avoid rate limiting
    const BATCH_SIZE = 5
    for (let i = 0; i < idsToScrape.length; i += BATCH_SIZE) {
      const batch = idsToScrape.slice(i, i + BATCH_SIZE)
      
      const batchGrants = await Promise.all(
        batch.map(id => this.scrapeMunicipality(id))
      )
      
      allGrants.push(...batchGrants.flat())
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    console.log(`Witkac: Total grants scraped: ${allGrants.length}`)
    
    return allGrants
  }

  /**
   * Parse date from Witkac format
   */
  private parseDate(dateString: string): string | undefined {
    if (!dateString) return undefined
    
    // Witkac format: "2024-12-31T23:59:59"
    try {
      const date = new Date(dateString)
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0]
      }
    } catch {
      // Try alternative formats
      const clean = dateString.replace('T23:59:59', '').trim()
      return clean || undefined
    }
    
    return undefined
  }
}