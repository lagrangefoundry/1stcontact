import { isKnownTimezone } from '@1stcontact/site-schema'

/**
 * The one place money and time become text (REQ-152).
 *
 * REQ-151 gave a site a locale identity; this is what reads it. Two capabilities
 * that do not exist yet — **payments** and **calendar** — each have to turn a
 * stored value into a string a customer acts on, and both have a wrong answer
 * that is *unrecoverable* rather than merely expensive:
 *
 * - A price is authored once as `{amountMinor, currency}` and DISPLAYED by
 *   deriving from it. If a module hand-rolls `'€' + (n / 100)` the shown price
 *   and the charged price are two independently-authored numbers, and a shown
 *   price that differs from the charged price is a legal exposure.
 * - A moment is stored as a UTC instant plus an IANA zone id. If a module bakes
 *   a wall-clock string or a fixed offset into a booking, history cannot be
 *   re-interpreted: the EU and US leave DST on *different dates*, so a slot
 *   agreed in October for a November appointment silently moves by an hour.
 *
 * So the seam exists BEFORE either module does — not because anything calls it
 * today, but so neither has to invent its own answer. Both functions delegate
 * wholly to ICU: nothing here hand-rolls a currency symbol, a decimal
 * separator, or a date order.
 *
 * ---
 *
 * ## The render-determinism rule (DOC-34 §8.4)
 *
 * `buildInfo.ts` says a module must never call `new Date()` at render time,
 * because a page rendered twice from the same source must be byte-identical. A
 * calendar renders *time-varying availability*. Both cannot hold as written, and
 * the resolution is recorded here because this is the file a module reaches for
 * when it wants a clock:
 *
 * > **Render output stays byte-deterministic. Time-varying content is rendered
 * > on the client or fetched at request time, and is NEVER derived from the
 * > render clock.**
 *
 * A published revision is an immutable R2 snapshot (DOC-12 §7) — it is by
 * definition not re-rendered — so *"next available: 3 September"* baked into its
 * HTML is wrong the following day and cannot self-heal. Under the rule a
 * calendar module emits a mount point plus its data, not a baked date.
 *
 * {@link formatDateTime} is the shape of that rule in code: it takes the instant
 * it formats as an ARGUMENT. There is no overload that reads the ambient clock,
 * so a module reaching for this seam cannot accidentally make its output depend
 * on when it was rendered.
 */

/** ISO 4217 shape. Checked so a swapped currency/locale argument fails loudly. */
const CURRENCY_CODE = /^[A-Z]{3}$/

/**
 * An unambiguous instant: an ISO-8601 date-time carrying `Z` or a numeric
 * offset. A zone-less `2026-11-01T02:30` is refused — that is precisely the
 * wall-clock string DOC-34 §7 calls unrecoverable, and accepting it here would
 * silently reinterpret it as the host's zone, which is a property of the machine
 * that happened to run the render.
 */
const INSTANT = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})$/

/**
 * `Intl.NumberFormat` as of the V3 proposal, whose `format` accepts a decimal
 * STRING and parses it exactly.
 *
 * Declared locally because this project's `lib` is pinned at ES2022 and the
 * widened overload arrived in ES2023. Both hosts we render on — Node 22 and
 * workerd — implement it; only the type declaration is behind. Widening the
 * whole project's lib to reach one overload would change what every other file
 * is allowed to reference, which is a much larger claim than this needs.
 */
interface NumberFormatV3 extends Intl.NumberFormat {
  format(value: number | bigint | string): string
}

/** How many minor units make one major unit of `currency`, per ICU's ISO 4217 data. */
function minorUnitDigits(currency: string, locale: string): number {
  const resolved = new Intl.NumberFormat(locale, { style: 'currency', currency }).resolvedOptions()
  const digits = resolved.minimumFractionDigits
  if (digits === undefined) {
    // Unreachable for `style: 'currency'`, which always resolves the currency's
    // ISO 4217 minor-unit count. Refused rather than defaulted, because the
    // plausible default — 2 — is wrong for exactly the currencies (JPY, KWD)
    // this function exists to get right.
    throw new TypeError(`formatMoney: ICU resolved no minor-unit count for ${currency}`)
  }
  return digits
}

/**
 * The exact decimal representation of `amountMinor` at `digits` minor places.
 *
 * String arithmetic, not `amountMinor / 10 ** digits`, because the division is
 * lossy: `9007199254740991 / 100` formats as `…409.90` where the true value ends
 * `.91`. `Intl.NumberFormat.format` accepts a decimal string and parses it
 * exactly, so the cent that float arithmetic drops survives.
 */
function toDecimalString(amountMinor: number, digits: number): string {
  const negative = amountMinor < 0
  const units = String(Math.abs(amountMinor)).padStart(digits + 1, '0')
  const whole = units.slice(0, units.length - digits)
  const fraction = digits === 0 ? '' : `.${units.slice(units.length - digits)}`
  return `${negative ? '-' : ''}${whole}${fraction}`
}

/**
 * Render an amount held in **minor units** as money in `locale`.
 *
 * `formatMoney(4999, 'EUR', 'en-IE')` → `€49.99`; the same amount and currency
 * in `de-DE` → `49,99 €`. Locale decides placement and separators, currency
 * decides symbol and decimal count, and neither can answer for the other — which
 * is why REQ-151 kept them as two fields.
 *
 * **Minor units are not always two.** JPY has none and KWD has three, so the
 * divisor comes from ICU's data for the currency rather than from a literal
 * `/100` anywhere: `formatMoney(4999, 'JPY', 'ja-JP')` is ¥4,999, not ¥49.99.
 *
 * @param amountMinor Integer count of the currency's smallest unit (cents, yen,
 *   fils). Never a float — a float price is a rounding bug waiting for a total.
 * @param currency ISO 4217 code, e.g. the site's `locale.currency`.
 * @param locale BCP 47 tag, e.g. the site's `locale.locale`.
 * @param options Passed through to `Intl.NumberFormat`; `style` and `currency`
 *   are fixed by this function and cannot be overridden.
 */
export function formatMoney(
  amountMinor: number,
  currency: string,
  locale: string,
  options: Omit<Intl.NumberFormatOptions, 'style' | 'currency'> = {},
): string {
  if (!Number.isInteger(amountMinor)) {
    throw new TypeError(
      `formatMoney: amountMinor must be an integer count of minor units, got ${amountMinor}`,
    )
  }
  if (!CURRENCY_CODE.test(currency)) {
    throw new TypeError(
      `formatMoney: currency must be an ISO 4217 code, got ${JSON.stringify(currency)}` +
        ' (arguments are (amountMinor, currency, locale))',
    )
  }
  const digits = minorUnitDigits(currency, locale)
  const formatter = new Intl.NumberFormat(locale, {
    ...options,
    style: 'currency',
    currency,
  }) as NumberFormatV3
  return formatter.format(toDecimalString(amountMinor, digits))
}

/**
 * Render a UTC `instant` as local time in `timeZone`, formatted for `locale`.
 *
 * The instant and the zone are separate arguments because they are separate
 * facts: the moment is absolute, and which wall clock it is shown on is a
 * choice. `2026-10-28T12:00:00Z` is 12:00 in Dublin and 08:00 in New York — and
 * on that particular date the gap between them is four hours rather than the
 * usual five, because Ireland has already left summer time and the US has not.
 * A stored fixed offset gets that week wrong; an instant plus an IANA id cannot.
 *
 * There is deliberately no default for `instant`. See this module's header: a
 * renderer that could read its own clock is a renderer whose output depends on
 * when it ran, and a published revision is never re-rendered.
 *
 * @param instant ISO-8601 date-time with `Z` or an explicit offset.
 * @param timeZone IANA zone id, e.g. the site's `locale.timezone`.
 * @param locale BCP 47 tag, e.g. the site's `locale.locale`.
 * @param options Passed through to `Intl.DateTimeFormat`; `timeZone` is fixed by
 *   this function. Pass `timeZoneName` wherever a cross-zone booking is possible
 *   — a time with no zone shown is a time two people can read differently.
 */
export function formatDateTime(
  instant: string,
  timeZone: string,
  locale: string,
  options: Omit<Intl.DateTimeFormatOptions, 'timeZone'> = { dateStyle: 'long', timeStyle: 'short' },
): string {
  if (!INSTANT.test(instant)) {
    throw new TypeError(
      `formatDateTime: instant must be an ISO-8601 date-time with Z or an explicit offset,` +
        ` got ${JSON.stringify(instant)} — a wall-clock string cannot be re-interpreted (DOC-34 §7)`,
    )
  }
  const parsed = new Date(instant)
  if (Number.isNaN(parsed.getTime())) {
    throw new TypeError(`formatDateTime: instant is not a real date-time: ${JSON.stringify(instant)}`)
  }
  if (!isKnownTimezone(timeZone)) {
    throw new TypeError(`formatDateTime: unknown IANA time-zone id ${JSON.stringify(timeZone)}`)
  }
  return new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(parsed)
}
