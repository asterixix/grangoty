import { DeepLClient } from 'deepl-node'
import { grantStorage } from './redis'

/**
 * DeepL API client singleton
 */
let deeplClient: DeepLClient | null = null

/**
 * Get DeepL client instance
 */
export function getDeepLClient(): DeepLClient | null {
  if (!deeplClient) {
    const apiKey = process.env.DEEPL_API_KEY
    
    if (!apiKey) {
      console.warn('DeepL API key not configured. Translations will be skipped.')
      return null
    }
    
    deeplClient = new DeepLClient(apiKey)
  }
  
  return deeplClient
}

/**
 * Supported languages for translation
 */
export const SUPPORTED_LANGUAGES = {
  pl: 'Polish',
  en: 'English',
  uk: 'Ukrainian',
  be: 'Belarusian',
  de: 'German',
} as const

/**
 * DeepL language codes mapping
 */
const DEEPL_LANG_MAP: Record<string, string> = {
  pl: 'PL',
  en: 'EN',
  uk: 'UK',
  be: 'BE', // Note: Belarusian may require DeepL Pro
  de: 'DE',
}

/**
 * Translation service for grant content
 */
export class TranslationService {
  private client: DeepLClient | null

  constructor() {
    this.client = getDeepLClient()
  }

  /**
   * Translate text to target language
   * Uses caching to avoid duplicate API calls
   */
  async translate(
    text: string,
    targetLang: string,
    sourceLang: string = 'PL'
  ): Promise<string> {
    if (!text || text.trim().length === 0) {
      return text
    }

    // Check cache first
    const cached = await grantStorage.getCachedTranslation(text, targetLang)
    if (cached) {
      return cached
    }

    // If no client, return original text
    if (!this.client) {
      return text
    }

    try {
      const deeplTargetLang = DEEPL_LANG_MAP[targetLang] || targetLang.toUpperCase()
      const deeplSourceLang = DEEPL_LANG_MAP[sourceLang] || sourceLang.toUpperCase()

      const result = await this.client.translateText(
        text,
        deeplSourceLang as any,
        deeplTargetLang as any,
        {
          preserveFormatting: true,
        }
      )

      const translation = result.text

      // Cache the translation
      await grantStorage.cacheTranslation(text, targetLang, translation)

      return translation
    } catch (error) {
      console.error(`DeepL translation error for "${text.slice(0, 50)}...":`, error)
      return text // Return original on error
    }
  }

  /**
   * Translate multiple texts in batch
   */
  async translateBatch(
    texts: string[],
    targetLang: string,
    sourceLang: string = 'PL'
  ): Promise<string[]> {
    if (!this.client || texts.length === 0) {
      return texts
    }

    // Check cache for all texts
    const results: string[] = []
    const uncachedTexts: { index: number; text: string }[] = []

    for (let i = 0; i < texts.length; i++) {
      const text = texts[i]
      if (!text || text.trim().length === 0) {
        results[i] = text
        continue
      }

      const cached = await grantStorage.getCachedTranslation(text, targetLang)
      if (cached) {
        results[i] = cached
      } else {
        uncachedTexts.push({ index: i, text })
        results[i] = text // Placeholder
      }
    }

    // Translate uncached texts
    if (uncachedTexts.length > 0) {
      try {
        const deeplTargetLang = DEEPL_LANG_MAP[targetLang] || targetLang.toUpperCase()
        const deeplSourceLang = DEEPL_LANG_MAP[sourceLang] || sourceLang.toUpperCase()

        const translations = await this.client.translateText(
          uncachedTexts.map(t => t.text),
          deeplSourceLang as any,
          deeplTargetLang as any,
          {
            preserveFormatting: true,
          }
        )

        // Apply translations and cache them
        for (let i = 0; i < uncachedTexts.length; i++) {
          const { index, text } = uncachedTexts[i]
          const translation = translations[i]?.text || text
          results[index] = translation
          
          // Cache
          await grantStorage.cacheTranslation(text, targetLang, translation)
        }
      } catch (error) {
        console.error('DeepL batch translation error:', error)
        // Keep original texts on error
      }
    }

    return results
  }

  /**
   * Translate grant content to all supported languages
   */
  async translateGrantContent(
    title: string,
    description: string,
    sourceLang: string = 'PL'
  ): Promise<Record<string, { title: string; description: string }>> {
    const translations: Record<string, { title: string; description: string }> = {}

    // Original language
    translations[sourceLang] = { title, description }

    // Translate to other supported languages
    const targetLanguages = Object.keys(SUPPORTED_LANGUAGES).filter(lang => lang !== sourceLang)

    for (const targetLang of targetLanguages) {
      try {
        const [translatedTitle, translatedDescription] = await this.translateBatch(
          [title, description],
          targetLang,
          sourceLang
        )

        translations[targetLang] = {
          title: translatedTitle,
          description: translatedDescription,
        }
      } catch (error) {
        console.error(`Failed to translate grant to ${targetLang}:`, error)
        // Use original on error
        translations[targetLang] = { title, description }
      }
    }

    return translations
  }

  /**
   * Translate grant news/updates
   */
  async translateGrantNews(
    news: string,
    targetLang: string,
    sourceLang: string = 'PL'
  ): Promise<string> {
    return this.translate(news, targetLang, sourceLang)
  }

  /**
   * Check if DeepL is configured
   */
  isConfigured(): boolean {
    return this.client !== null
  }

  /**
   * Get usage statistics from DeepL
   */
  async getUsage(): Promise<{ characterCount: number; characterLimit: number } | null> {
    if (!this.client) return null

    try {
      const usage = await this.client.getUsage()
      return {
        characterCount: usage.character?.count || 0,
        characterLimit: usage.character?.limit || 0,
      }
    } catch (error) {
      console.error('Failed to get DeepL usage:', error)
      return null
    }
  }
}

// Export singleton instance
export const translationService = new TranslationService()