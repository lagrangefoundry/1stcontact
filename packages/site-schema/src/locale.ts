/**
 * Site locale identity (REQ-151) — where a business *is*, as structured data.
 *
 * `siteConfigSchema` carried no notion of place, so the US/English assumption
 * was hardcoded at every point that needed one: `<html lang="en">` was a literal
 * in both renderers. The first customer cohort is Irish and British, so that is
 * wrong on day one — and because a published revision is an immutable R2
 * snapshot (DOC-12 §7), a wrong `lang` baked into a live site cannot be fixed by
 * fixing the renderer. It is also a live accessibility defect independent of
 * i18n: `lang` is what a screen reader uses to choose pronunciation.
 *
 * Four fields, all optional, all standards-typed: `country` (ISO 3166-1
 * alpha-2), `locale` (BCP 47), `currency` (ISO 4217), `timezone` (IANA zone id).
 * The last three **derive** from `country`, each individually overridable, and
 * `country` itself defaults to `US` — so a site that declares none of them
 * validates and renders exactly as it did before this landed.
 *
 * They stay four fields rather than one, because they correlate without
 * determining. Locale decides placement and separators; currency decides symbol
 * and decimal count: `Intl.NumberFormat('en-IE', …EUR)` → `€49.99`, while
 * `('de-DE', …EUR)` → `49,99 €`. A single field could express neither pair.
 */

/** What a country implies when the site declares nothing more specific. */
export interface CountryDefaults {
  /** BCP 47 language tag. */
  locale: string
  /** ISO 4217 currency code. */
  currency: string
  /** IANA time-zone id. */
  timezone: string
}

/**
 * country → (locale, currency, timezone).
 *
 * DATA, NOT CODE: adding a country is one row here and nothing else. A country
 * absent from this table is a **validation error**, never a silent fall back to
 * the `US` default — a business told its site is fine while it silently renders
 * as American is exactly the failure this ticket exists to prevent.
 *
 * A country spanning several zones gets ONE explicit pick — its
 * largest-population civil zone — because the alternative is a rendered page
 * with no `lang` at all. The pick is a default, and `timezone` overrides it.
 */
export const COUNTRY_DEFAULTS: Readonly<Record<string, CountryDefaults>> = {
  // Europe
  AT: { locale: 'de-AT', currency: 'EUR', timezone: 'Europe/Vienna' },
  BE: { locale: 'nl-BE', currency: 'EUR', timezone: 'Europe/Brussels' },
  BG: { locale: 'bg-BG', currency: 'BGN', timezone: 'Europe/Sofia' },
  CH: { locale: 'de-CH', currency: 'CHF', timezone: 'Europe/Zurich' },
  CY: { locale: 'el-CY', currency: 'EUR', timezone: 'Asia/Nicosia' },
  CZ: { locale: 'cs-CZ', currency: 'CZK', timezone: 'Europe/Prague' },
  DE: { locale: 'de-DE', currency: 'EUR', timezone: 'Europe/Berlin' },
  DK: { locale: 'da-DK', currency: 'DKK', timezone: 'Europe/Copenhagen' },
  EE: { locale: 'et-EE', currency: 'EUR', timezone: 'Europe/Tallinn' },
  // Spain also spans the Canaries (Atlantic/Canary); the peninsula is the pick.
  ES: { locale: 'es-ES', currency: 'EUR', timezone: 'Europe/Madrid' },
  FI: { locale: 'fi-FI', currency: 'EUR', timezone: 'Europe/Helsinki' },
  FR: { locale: 'fr-FR', currency: 'EUR', timezone: 'Europe/Paris' },
  GB: { locale: 'en-GB', currency: 'GBP', timezone: 'Europe/London' },
  GR: { locale: 'el-GR', currency: 'EUR', timezone: 'Europe/Athens' },
  HR: { locale: 'hr-HR', currency: 'EUR', timezone: 'Europe/Zagreb' },
  HU: { locale: 'hu-HU', currency: 'HUF', timezone: 'Europe/Budapest' },
  IE: { locale: 'en-IE', currency: 'EUR', timezone: 'Europe/Dublin' },
  IS: { locale: 'is-IS', currency: 'ISK', timezone: 'Atlantic/Reykjavik' },
  IT: { locale: 'it-IT', currency: 'EUR', timezone: 'Europe/Rome' },
  LT: { locale: 'lt-LT', currency: 'EUR', timezone: 'Europe/Vilnius' },
  LU: { locale: 'fr-LU', currency: 'EUR', timezone: 'Europe/Luxembourg' },
  LV: { locale: 'lv-LV', currency: 'EUR', timezone: 'Europe/Riga' },
  MT: { locale: 'mt-MT', currency: 'EUR', timezone: 'Europe/Malta' },
  NL: { locale: 'nl-NL', currency: 'EUR', timezone: 'Europe/Amsterdam' },
  NO: { locale: 'nb-NO', currency: 'NOK', timezone: 'Europe/Oslo' },
  PL: { locale: 'pl-PL', currency: 'PLN', timezone: 'Europe/Warsaw' },
  PT: { locale: 'pt-PT', currency: 'EUR', timezone: 'Europe/Lisbon' },
  RO: { locale: 'ro-RO', currency: 'RON', timezone: 'Europe/Bucharest' },
  // Russia spans eleven zones; Moscow is the civil and commercial default.
  RU: { locale: 'ru-RU', currency: 'RUB', timezone: 'Europe/Moscow' },
  SE: { locale: 'sv-SE', currency: 'SEK', timezone: 'Europe/Stockholm' },
  SI: { locale: 'sl-SI', currency: 'EUR', timezone: 'Europe/Ljubljana' },
  SK: { locale: 'sk-SK', currency: 'EUR', timezone: 'Europe/Bratislava' },
  TR: { locale: 'tr-TR', currency: 'TRY', timezone: 'Europe/Istanbul' },
  UA: { locale: 'uk-UA', currency: 'UAH', timezone: 'Europe/Kyiv' },

  // Americas
  AR: { locale: 'es-AR', currency: 'ARS', timezone: 'America/Argentina/Buenos_Aires' },
  // Brazil spans four zones; São Paulo is the civil and commercial default.
  BR: { locale: 'pt-BR', currency: 'BRL', timezone: 'America/Sao_Paulo' },
  // Canada spans six zones; Toronto (Eastern) is the largest-population pick.
  CA: { locale: 'en-CA', currency: 'CAD', timezone: 'America/Toronto' },
  CL: { locale: 'es-CL', currency: 'CLP', timezone: 'America/Santiago' },
  // Mexico spans four zones; Mexico City is the largest-population pick.
  MX: { locale: 'es-MX', currency: 'MXN', timezone: 'America/Mexico_City' },
  // The US spans nine zones; New York (Eastern) is the largest-population pick.
  US: { locale: 'en-US', currency: 'USD', timezone: 'America/New_York' },

  // Africa & Middle East
  AE: { locale: 'ar-AE', currency: 'AED', timezone: 'Asia/Dubai' },
  EG: { locale: 'ar-EG', currency: 'EGP', timezone: 'Africa/Cairo' },
  IL: { locale: 'he-IL', currency: 'ILS', timezone: 'Asia/Jerusalem' },
  IR: { locale: 'fa-IR', currency: 'IRR', timezone: 'Asia/Tehran' },
  KE: { locale: 'en-KE', currency: 'KES', timezone: 'Africa/Nairobi' },
  MA: { locale: 'ar-MA', currency: 'MAD', timezone: 'Africa/Casablanca' },
  NG: { locale: 'en-NG', currency: 'NGN', timezone: 'Africa/Lagos' },
  QA: { locale: 'ar-QA', currency: 'QAR', timezone: 'Asia/Qatar' },
  SA: { locale: 'ar-SA', currency: 'SAR', timezone: 'Asia/Riyadh' },
  ZA: { locale: 'en-ZA', currency: 'ZAR', timezone: 'Africa/Johannesburg' },

  // Asia & Pacific
  // Australia spans five zones; Sydney is the largest-population pick.
  AU: { locale: 'en-AU', currency: 'AUD', timezone: 'Australia/Sydney' },
  CN: { locale: 'zh-CN', currency: 'CNY', timezone: 'Asia/Shanghai' },
  HK: { locale: 'zh-HK', currency: 'HKD', timezone: 'Asia/Hong_Kong' },
  // Indonesia spans three zones; Jakarta is the largest-population pick.
  ID: { locale: 'id-ID', currency: 'IDR', timezone: 'Asia/Jakarta' },
  IN: { locale: 'en-IN', currency: 'INR', timezone: 'Asia/Kolkata' },
  JP: { locale: 'ja-JP', currency: 'JPY', timezone: 'Asia/Tokyo' },
  KR: { locale: 'ko-KR', currency: 'KRW', timezone: 'Asia/Seoul' },
  MY: { locale: 'ms-MY', currency: 'MYR', timezone: 'Asia/Kuala_Lumpur' },
  NZ: { locale: 'en-NZ', currency: 'NZD', timezone: 'Pacific/Auckland' },
  PH: { locale: 'en-PH', currency: 'PHP', timezone: 'Asia/Manila' },
  PK: { locale: 'ur-PK', currency: 'PKR', timezone: 'Asia/Karachi' },
  SG: { locale: 'en-SG', currency: 'SGD', timezone: 'Asia/Singapore' },
  TH: { locale: 'th-TH', currency: 'THB', timezone: 'Asia/Bangkok' },
  TW: { locale: 'zh-TW', currency: 'TWD', timezone: 'Asia/Taipei' },
  VN: { locale: 'vi-VN', currency: 'VND', timezone: 'Asia/Ho_Chi_Minh' },
}

/**
 * The country assumed when a site declares none — so `currency` and `timezone`
 * always have a concrete answer, which is the only kind either can use.
 */
export const DEFAULT_COUNTRY = 'US'

/**
 * The locale of a site that has declared no country: the **region-free** `en`,
 * not `en-US`.
 *
 * A declared `country: 'US'` is a fact about the business and resolves to
 * `en-US`. Declaring nothing is not that fact — it is the absence of one — and
 * stamping `lang="en-US"` onto a page whose owner never said where they are
 * asserts something we were not told, into an attribute a screen reader and a
 * search index both act on. `en` says exactly what we know: English, region
 * unstated. It is also the literal these renderers emitted before this ticket,
 * so every site authored before the field existed renders byte-identically.
 *
 * Currency and timezone take no such care because there is no region-free EUR
 * or region-free clock; `US` has to answer for them or nothing does.
 */
export const UNDECLARED_LOCALE = 'en'

/** The `dir` attribute's two values. */
export type TextDirection = 'ltr' | 'rtl'

/**
 * Scripts written right-to-left. Checked before the language subtag, because an
 * explicit script *overrides* the language's usual one — `az-Arab` is RTL where
 * `az-Latn` is not, and a language-only table would get one of them wrong.
 */
const RTL_SCRIPTS = new Set([
  'adlm', 'arab', 'aran', 'hebr', 'mand', 'mend', 'nkoo', 'rohg', 'samr', 'syrc', 'thaa', 'yezi',
])

/** Languages whose default script is right-to-left. */
const RTL_LANGUAGES = new Set([
  'ar', 'ckb', 'dv', 'fa', 'he', 'ks', 'ps', 'sd', 'ug', 'ur', 'yi',
])

/**
 * BCP 47 well-formedness: `language[-script][-region][-variant…]`.
 *
 * Well-formedness, not registry membership — RFC 5646 itself separates the two,
 * and a language subtag we do not recognise is far more likely to be a real
 * minority language than a typo. Extensions and private-use subtags are
 * deliberately out: nothing in a site definition has a use for them, and
 * refusing them keeps the value that reaches `lang=` simple.
 */
const LANGUAGE_TAG =
  /^[A-Za-z]{2,3}(-[A-Za-z]{4})?(-(?:[A-Za-z]{2}|[0-9]{3}))?(-(?:[A-Za-z0-9]{5,8}|[0-9][A-Za-z0-9]{3}))*$/

/** ISO 3166-1 alpha-2 shape. Membership of {@link COUNTRY_DEFAULTS} is separate. */
const COUNTRY_CODE = /^[A-Z]{2}$/

/** ISO 4217 shape: three uppercase letters. */
const CURRENCY_CODE = /^[A-Z]{3}$/

/** Is `value` a country this platform can derive defaults for? */
export function isSupportedCountry(value: string): boolean {
  return COUNTRY_CODE.test(value) && value in COUNTRY_DEFAULTS
}

/** Is `value` a well-formed BCP 47 language tag? */
export function isWellFormedLocale(value: string): boolean {
  return LANGUAGE_TAG.test(value)
}

/** Is `value` an ISO 4217-shaped currency code? */
export function isCurrencyCode(value: string): boolean {
  return CURRENCY_CODE.test(value)
}

/**
 * Is `value` a time-zone id the runtime knows?
 *
 * Asked of ICU rather than of a regex or a checked-in list: the tz database is
 * the authority, it changes under us on its own schedule, and both hosts we run
 * on (Node and workerd) ship a full one. A regex would accept
 * `Europe/Dubland` — the exact silent-fallback this ticket forbids.
 */
export function isKnownTimezone(value: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value })
    return true
  } catch {
    return false
  }
}

/**
 * Which way a locale's script runs.
 *
 * Reads the script subtag when one is present and the language subtag
 * otherwise; anything unrecognised is `ltr`, which is both the overwhelming
 * majority and the value a browser assumes anyway.
 */
export function localeDirection(locale: string): TextDirection {
  const parts = locale.toLowerCase().split('-')
  const script = parts.find((p) => p.length === 4 && /^[a-z]{4}$/.test(p))
  if (script) return RTL_SCRIPTS.has(script) ? 'rtl' : 'ltr'
  return RTL_LANGUAGES.has(parts[0] ?? '') ? 'rtl' : 'ltr'
}

/** The four locale fields as a site may declare them — all optional. */
export interface SiteLocaleInput {
  country?: string
  locale?: string
  currency?: string
  timezone?: string
}

/**
 * A site's locale identity with every field settled — what the renderers emit
 * and what a behavior module reads. Never partial: `resolveSiteLocale` is total.
 */
export interface ResolvedLocale {
  country: string
  locale: string
  currency: string
  timezone: string
  /** Derived from `locale`; never declared, because it is not an independent choice. */
  dir: TextDirection
}

/**
 * Settle a site's locale identity: country first, then each of the other three
 * from the country's row unless the site overrode it individually.
 *
 * THE ONE DERIVATION. Both renderers and every behavior module call this, which
 * is what makes "the framework and the generator agree" structural rather than
 * something to keep checking: there is only one place for them to read it from.
 *
 * Total by construction — an unsupported country falls back to
 * {@link DEFAULT_COUNTRY} here, because by the time a definition reaches a
 * renderer `validateSite` has already refused an unsupported one. The fallback
 * exists so the render cannot throw, not as a policy.
 */
export function resolveSiteLocale(input: SiteLocaleInput = {}): ResolvedLocale {
  const declared = input.country && isSupportedCountry(input.country) ? input.country : undefined
  const country = declared ?? DEFAULT_COUNTRY
  const defaults = COUNTRY_DEFAULTS[country] ?? COUNTRY_DEFAULTS[DEFAULT_COUNTRY]
  // `declared` rather than `country`: see {@link UNDECLARED_LOCALE} — a country
  // nobody stated must not become a region nobody stated.
  const locale = input.locale ?? (declared ? defaults.locale : UNDECLARED_LOCALE)
  return {
    country,
    locale,
    currency: input.currency ?? defaults.currency,
    timezone: input.timezone ?? defaults.timezone,
    dir: localeDirection(locale),
  }
}
