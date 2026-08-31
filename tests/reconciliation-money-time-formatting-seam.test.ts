import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import * as intlSeam from '../packages/framework/src/intl'
import { formatDateTime, formatMoney } from '../packages/framework/src/intl'
import { renderL1Page } from '../packages/framework/src/l1/render'
import { validateSite } from '../packages/site-schema/src'
import type { L1Document, Site } from '../packages/site-schema/src'
import { renderSiteFiles } from '../tools/generate/src/render'
import { starterHomePage, starterSiteJson } from '../tools/generate/src/cli/scaffold'
import type { LoadedSite } from '../tools/generate/src/store/assemble'

/**
 * Story story-0598c150 — the one place a value becomes text.
 *
 * Every claim here has a wrong answer that is *unrecoverable* rather than merely
 * expensive. A published revision is an immutable R2 snapshot and is never
 * re-rendered, so a price scaled by a hardcoded `/100`, a booking baked from a
 * zone-less wall-clock string, or a date derived from the render clock cannot be
 * rescued by fixing the code afterwards — the artifact already shipped.
 *
 * Assertions are against ICU's real output for real locales rather than against
 * a snapshot of platform-authored formatting, because the correctness claim is
 * that the right inputs reach a standard formatter — not that the formatting is
 * reimplemented here. Every instant is a fixed literal and never the ambient
 * clock, so each assertion holds identically whenever the suite is run.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.join(HERE, '..')
const FRAMEWORK_SRC = path.join(REPO, 'packages', 'framework', 'src')

/** ICU emits U+00A0 between a de-DE amount and its symbol; spell it out. */
const NBSP = ' '

/** A source file with its comments removed — prose is not executable code. */
function codeWithoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
}

/**
 * A doc comment flattened to one line — comment and blockquote markers removed
 * and whitespace collapsed — so a sentence wrapped across lines still matches.
 */
function prose(file: string): string {
  return readFileSync(file, 'utf8')
    .replace(/^\s*\*\s?/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/\s+/g, ' ')
}

/**
 * A money rendering with ICU's non-breaking gaps normalised to plain spaces.
 *
 * The claim under test is which SYMBOL and which SEPARATOR characters the
 * currency and locale contribute; which class of space ICU puts between the
 * symbol and the digits is not part of it.
 */
function money(
  amountMinor: number,
  currency: string,
  locale: string,
  options?: Omit<Intl.NumberFormatOptions, 'style' | 'currency'>,
): string {
  return formatMoney(amountMinor, currency, locale, options).replace(/[   ]/g, ' ')
}

/** The scaffolder's starter site, validated. */
function starterSite(): Site {
  const json = {
    ...(starterSiteJson('intl-fixture') as Record<string, unknown>),
    pages: [starterHomePage('intl-fixture')],
  }
  const result = validateSite(json)
  if (!result.ok) throw new Error(`unexpected validation failure: ${JSON.stringify(result.errors)}`)
  return result.value
}

/** A local hour-and-minute reading of `instant` on `zone`'s wall clock. */
function localHour(instant: string, zone: string): string {
  return formatDateTime(instant, zone, 'en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

describe('story-0598c150 — money & time formatting seam', () => {
  it('test_UAT_AC1438_locale_decides_placement_and_separators_currency_decides_symbol_and_decimals', () => {
    // AC-1438. One amount, one currency, two locales: the strings differ only in
    // the locale's own conventions — where the symbol sits and which characters
    // separate the groups and the decimal — while naming the same currency and
    // the same value. This is why the site's locale and its currency stayed two
    // fields: collapsed into one, a Dublin business invoicing in USD has no way
    // to say so.
    expect(formatMoney(4999, 'EUR', 'en-IE')).toBe('€49.99')
    expect(formatMoney(4999, 'EUR', 'de-DE')).toBe(`49,99${NBSP}€`)

    // Currency alone does not answer for placement or separators: the same EUR
    // is symbol-first with a dot decimal in one locale and symbol-last with a
    // comma decimal in the other.
    expect(formatMoney(4999, 'EUR', 'en-IE').startsWith('€')).toBe(true)
    expect(formatMoney(4999, 'EUR', 'de-DE').endsWith('€')).toBe(true)

    // And locale alone does not answer for the symbol. One locale rendering
    // three currencies gives three symbols, which proves the symbol is taken
    // from the currency argument and not from a locale-keyed table of our own.
    expect(formatMoney(4999, 'USD', 'en-IE')).toBe('US$49.99')
    expect(formatMoney(4999, 'GBP', 'en-IE')).toBe('£49.99')
    expect(new Set(['EUR', 'USD', 'GBP'].map((c) => formatMoney(4999, c, 'en-IE'))).size).toBe(3)
  })

  it('test_UAT_AC1439_minor_unit_scale_comes_from_the_currency_never_a_fixed_two', () => {
    // AC-1439. A fixed divisor is wrong for exactly the currencies this exists
    // to get right. JPY has no minor unit: 4999 yen is a four-figure price, and
    // `/100` would show it a hundredfold too small.
    expect(formatMoney(4999, 'JPY', 'ja-JP')).toBe('￥4,999')
    expect(formatMoney(4999, 'JPY', 'ja-JP')).not.toContain('49.99')

    // KWD has three: 4999 fils is 4.999 dinar, and `/100` would show it a
    // thousandfold too large.
    expect(money(4999, 'KWD', 'en-GB')).toBe('KWD 4.999')

    // Two is the ordinary case, and it is derived the same way as the other two
    // rather than assumed.
    expect(formatMoney(4999, 'EUR', 'en-IE')).toBe('€49.99')

    // A second zero-minor-unit currency, in a locale that groups digits with a
    // dot rather than a comma — so the claim is about the CURRENCY and not about
    // one locale's habits. Neither rendering carries a fractional part.
    expect(money(499900, 'ISK', 'is-IS')).toBe('499.900 kr.')
    expect(money(499900, 'ISK', 'en-US')).toBe('ISK 499,900')
  })

  it('test_UAT_AC1440_the_displayed_amount_is_exact_at_the_top_of_range_and_when_negative', () => {
    // AC-1440. `amountMinor / 100` is lossy at the top of the exactly
    // representable range: 9007199254740991/100 renders as …409.90, silently
    // dropping the final cent. A shown price is a legal claim, so the seam does
    // string arithmetic and hands ICU an exact decimal — the cent survives.
    expect(formatMoney(9007199254740991, 'USD', 'en-US')).toBe('$90,071,992,547,409.91')
    expect(formatMoney(9007199254740991, 'USD', 'en-US')).not.toContain('409.90')

    // A refund or a credit is the same representation with a sign, rendered by
    // the locale's own negative convention — not a second shape.
    expect(formatMoney(-4999, 'EUR', 'en-IE')).toBe('-€49.99')
    expect(formatMoney(-4999, 'EUR', 'de-DE')).toBe(`-49,99${NBSP}€`)

    // The magnitude is scaled and grouped exactly as the positive amount is: the
    // sign is the only difference between the two renderings.
    for (const [amount, locale] of [
      [4999, 'en-IE'],
      [9007199254740991, 'en-US'],
    ] as const) {
      const negative = formatMoney(-amount, 'EUR', locale)
      expect(negative.replace('-', ''), `magnitude changed under negation in ${locale}`).toBe(
        formatMoney(amount, 'EUR', locale),
      )
    }
  })

  it('test_UAT_AC1441_a_fractional_amount_or_a_non_iso_4217_currency_is_refused', () => {
    // AC-1441. A float price is a rounding bug waiting for a total; it is
    // refused at the seam rather than allowed to round somewhere downstream.
    // The failure names the requirement and reports the offending value.
    expect(() => formatMoney(49.99, 'EUR', 'en-IE')).toThrow(/integer count of minor units/)
    expect(() => formatMoney(49.99, 'EUR', 'en-IE')).toThrow(/49\.99/)

    // The currency and locale arguments are both strings, so transposing them is
    // easy — and would otherwise render something plausible-looking rather than
    // failing. The failure names ISO 4217, reports the offending value, and
    // states the expected argument order.
    expect(() => formatMoney(4999, 'en-IE', 'EUR')).toThrow(/ISO 4217/)
    expect(() => formatMoney(4999, 'en-IE', 'EUR')).toThrow(/en-IE/)
    expect(() => formatMoney(4999, 'en-IE', 'EUR')).toThrow(/amountMinor, currency, locale/)

    // Nothing is returned in either case: the caller observes a failure, not a
    // best-effort string.
    for (const attempt of [
      (): string => formatMoney(49.99, 'EUR', 'en-IE'),
      (): string => formatMoney(4999, 'en-IE', 'EUR'),
    ]) {
      let produced: string | undefined
      try {
        produced = attempt()
      } catch {
        produced = undefined
      }
      expect(produced, 'a rejected input still produced a formatted value').toBeUndefined()
    }
  })

  it('test_UAT_AC1442_one_instant_reads_as_each_zones_local_time_across_diverging_dst_transitions', () => {
    // AC-1442. One absolute instant, two zones on opposite sides of an ocean.
    // The zones differ not only in hour but in CALENDAR DATE — which is the
    // version of this bug that shows a customer the wrong day, not merely the
    // wrong hour.
    const instant = '2026-11-01T02:30:00Z'
    const dublin = formatDateTime(instant, 'Europe/Dublin', 'en-IE')
    const newYork = formatDateTime(instant, 'America/New_York', 'en-US')
    expect(dublin).not.toBe(newYork)
    expect(dublin).toContain('1 November 2026')
    expect(dublin).toContain('02:30')
    expect(newYork).toContain('October 31, 2026')
    expect(newYork).toContain('10:30 PM')

    // The offset applied is the one in force AT THAT INSTANT, not a fixed offset
    // for the zone. The EU leaves summer time on 25 October 2026 and the US on 1
    // November, so the Dublin↔New York gap narrows and then restores.
    //
    // Before either transition: five hours.
    expect(localHour('2026-10-20T12:00:00Z', 'Europe/Dublin')).toBe('13:00')
    expect(localHour('2026-10-20T12:00:00Z', 'America/New_York')).toBe('08:00')

    // Inside the divergence window: FOUR hours — Dublin has fallen back, New
    // York has not. A booking stored as a fixed `+01:00` offset is an hour wrong
    // for precisely this week.
    expect(localHour('2026-10-28T12:00:00Z', 'Europe/Dublin')).toBe('12:00')
    expect(localHour('2026-10-28T12:00:00Z', 'America/New_York')).toBe('08:00')

    // After both: five hours again, at the new offsets.
    expect(localHour('2026-11-05T12:00:00Z', 'Europe/Dublin')).toBe('12:00')
    expect(localHour('2026-11-05T12:00:00Z', 'America/New_York')).toBe('07:00')

    // Stated as the gap itself: one span, a different span, then the original.
    const gap = (instantAt: string): number =>
      Number(localHour(instantAt, 'Europe/Dublin').slice(0, 2)) -
      Number(localHour(instantAt, 'America/New_York').slice(0, 2))
    expect(gap('2026-10-20T12:00:00Z')).toBe(5)
    expect(gap('2026-10-28T12:00:00Z')).toBe(4)
    expect(gap('2026-11-05T12:00:00Z')).toBe(5)
  })

  it('test_UAT_AC1443_an_ambiguous_or_impossible_instant_and_an_unknown_zone_are_refused', () => {
    // AC-1443. The unrecoverable case: a zone-less wall-clock string would be
    // reinterpreted as whichever zone the machine running the render happened to
    // be in — a property of the build host, baked into an immutable snapshot.
    // The failure states the marker-or-offset requirement and reports the value.
    for (const ambiguous of ['2026-11-01T02:30', '2026-11-01T02:30:00', '2026-11-01']) {
      expect(() => formatDateTime(ambiguous, 'Europe/Dublin', 'en-IE'), ambiguous).toThrow(
        /must be an ISO-8601 date-time with Z or an explicit offset/,
      )
      expect(() => formatDateTime(ambiguous, 'Europe/Dublin', 'en-IE'), ambiguous).toThrow(
        new RegExp(ambiguous),
      )
    }

    // Right shape, not a real date-time. Refused rather than formatted into
    // whatever the runtime makes of it.
    for (const impossible of ['2026-13-01T00:00:00Z', '2026-10-28T25:00:00Z']) {
      expect(() => formatDateTime(impossible, 'Europe/Dublin', 'en-IE'), impossible).toThrow(
        /is not a real date-time/,
      )
    }

    // A zone id the runtime does not recognise is named as the problem, and the
    // offending id reported — rather than an opaque RangeError surfacing from
    // inside ICU. `Europe/Dubland` is the silent-fallback shape the site locale
    // field already refuses.
    expect(() => formatDateTime('2026-11-01T02:30:00Z', 'Europe/Dubland', 'en-IE')).toThrow(
      /time-zone/,
    )
    expect(() => formatDateTime('2026-11-01T02:30:00Z', 'Europe/Dubland', 'en-IE')).toThrow(
      /Europe\/Dubland/,
    )

    // An explicit numeric offset is unusual but unambiguous, so it is accepted —
    // at a formatting boundary the distinction that matters is ambiguous versus
    // unambiguous. It produces the same local reading as the UTC-marked
    // equivalent instant.
    const utcMarked = formatDateTime('2026-10-28T12:00:00Z', 'Europe/Dublin', 'en-IE')
    expect(formatDateTime('2026-10-28T13:00:00+01:00', 'Europe/Dublin', 'en-IE')).toBe(utcMarked)
    expect(formatDateTime('2026-10-28T08:00:00-04:00', 'Europe/Dublin', 'en-IE')).toBe(utcMarked)
    expect(utcMarked).toContain('12:00')
  })

  it('test_UAT_AC1444_presentation_options_pass_through_but_currency_and_zone_cannot_be_overridden', () => {
    // AC-1444. The caller's presentation preferences are applied — including the
    // zone name, which a booking readable across zones has to state. A time with
    // no zone shown is a time two people read differently.
    expect(
      formatDateTime('2026-10-28T12:00:00Z', 'Europe/Dublin', 'en-IE', {
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      }),
    ).toBe('12:00 GMT')

    // What an option cannot do is move the moment to another zone: the argument
    // is the fact, the option is a preference, and the fact wins. Without this
    // boundary a module reintroduces its own answer through the options bag.
    const zoneOverride: Intl.DateTimeFormatOptions = {
      timeZone: 'America/New_York',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }
    expect(formatDateTime('2026-10-28T12:00:00Z', 'Europe/Dublin', 'en-GB', zoneOverride)).toBe(
      '12:00',
    )
    expect(formatDateTime('2026-10-28T12:00:00Z', 'America/New_York', 'en-GB', zoneOverride)).toBe(
      '08:00',
    )

    // Likewise an option cannot turn a price into a bare number, or restate it
    // in a currency the caller did not supply.
    const styleOverride: Intl.NumberFormatOptions = { style: 'decimal', currency: 'USD' }
    expect(formatMoney(4999, 'EUR', 'en-IE', styleOverride)).toBe('€49.99')
    expect(formatMoney(4999, 'GBP', 'en-IE', styleOverride)).toBe('£49.99')

    // A presentation option that is NOT load-bearing does pass through, so the
    // fixing above is a boundary rather than a blanket refusal to be configured.
    expect(formatMoney(4999, 'EUR', 'en-IE', { currencyDisplay: 'code' })).toContain('EUR')

    // With no preference given, a moment shows a full readable date and a short
    // time — the same rendering the explicit long/short pair produces.
    expect(formatDateTime('2026-10-28T12:00:00Z', 'Europe/Dublin', 'en-IE')).toBe(
      '28 October 2026 at 12:00',
    )
    expect(formatDateTime('2026-10-28T12:00:00Z', 'Europe/Dublin', 'en-IE')).toBe(
      formatDateTime('2026-10-28T12:00:00Z', 'Europe/Dublin', 'en-IE', {
        dateStyle: 'long',
        timeStyle: 'short',
      }),
    )
  })

  it('test_UAT_AC1445_rendering_twice_is_byte_identical_and_no_render_source_reads_the_clock', async () => {
    // AC-1445. The determinism claim is asserted on the ARTIFACT — what ships,
    // and what never re-renders — rather than inferred from the absence of a
    // clock call. Same source, two renders, compared file by file.
    const site = starterSite()
    const loaded: LoadedSite = {
      slug: 'intl-fixture',
      sourceDir: '(memory)',
      site,
      assetFiles: [],
    }
    const first = await renderSiteFiles(loaded)
    const second = await renderSiteFiles(loaded)
    expect(first.files.size, 'the render produced no files to compare').toBeGreaterThan(0)
    expect([...second.files.keys()].sort()).toEqual([...first.files.keys()].sort())
    for (const [name, html] of first.files) {
      expect(second.files.get(name), `${name} differs between two renders`).toBe(html)
    }

    // The same for the framework's standalone single-page renderer.
    const doc = site.pages[0].l1 as L1Document
    expect(renderL1Page(doc, 'intl-fixture', site.config)).toBe(
      renderL1Page(doc, 'intl-fixture', site.config),
    )

    // And independently of any particular render: determinism as MECHANISM
    // rather than discipline. A future module reaching for `new Date()` fails
    // here rather than shipping a snapshot that is wrong the next morning.
    // Offenders are reported by path, so a violation names itself.
    const offenders: string[] = []
    const walk = (dir: string): void => {
      for (const entry of readdirSync(dir)) {
        const full = path.join(dir, entry)
        if (statSync(full).isDirectory()) {
          walk(full)
          continue
        }
        if (!entry.endsWith('.ts')) continue
        // Comments are stripped: the rule is stated in prose in several of these
        // files, and prose describing a clock read is not a clock read.
        if (/\bnew Date\s*\(\s*\)|\bDate\.now\s*\(/.test(codeWithoutComments(readFileSync(full, 'utf8')))) {
          offenders.push(path.relative(REPO, full))
        }
      }
    }
    walk(FRAMEWORK_SRC)
    expect(offenders, 'render-path sources must not read the ambient clock').toEqual([])
  })

  it('test_UAT_AC1446_there_is_no_now_form_and_the_determinism_resolution_is_recorded', () => {
    // AC-1446. The rule expressed as an API rather than as something to
    // remember: every formatted moment is one the caller passed in. There is no
    // zero-instant form, no overload and no default that supplies "now".
    expect(formatDateTime.length, 'formatDateTime no longer requires an explicit instant').toBe(3)
    expect(() => (formatDateTime as unknown as () => string)()).toThrow(
      /must be an ISO-8601 date-time with Z or an explicit offset/,
    )

    // Nor is there a second export offering one by another name.
    expect(Object.keys(intlSeam).sort()).toEqual(['formatDateTime', 'formatMoney'])
    for (const name of Object.keys(intlSeam)) {
      expect(name, `${name} reads as a clock-reading form`).not.toMatch(/now|today|current/i)
    }

    // The resolution is recorded where a module author will encounter it, rather
    // than left as folklore. The build-determinism contract used to read as an
    // unqualified ban on reading the clock — which a calendar module could not
    // satisfy — so the next person to author one would have had to either break
    // the rule or believe dates were forbidden. It now carries the resolution,
    // names the byte-deterministic property, and points at the seam.
    const buildInfo = prose(path.join(FRAMEWORK_SRC, 'buildInfo.ts'))
    expect(buildInfo).toContain('byte-deterministic')
    expect(buildInfo).toMatch(/NEVER derived from the render clock/i)
    expect(buildInfo).toMatch(/rendered on the client or fetched at request time/i)
    expect(buildInfo).toContain('intl.ts')
    expect(buildInfo).toContain('formatDateTime')
    expect(buildInfo).toContain('DOC-34 §8.4')

    // And the seam states the same rule in the same terms at its own entrance,
    // so a reader arriving from either direction finds it.
    const intlDoc = prose(path.join(FRAMEWORK_SRC, 'intl.ts'))
    expect(intlDoc).toContain('byte-deterministic')
    expect(intlDoc).toMatch(/NEVER derived from the render clock/i)
    expect(intlDoc).toContain('DOC-34 §8.4')
  })
})
