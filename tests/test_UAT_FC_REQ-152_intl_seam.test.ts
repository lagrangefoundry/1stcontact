import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { formatDateTime, formatMoney } from '../packages/framework/src/intl'
import { renderL1Page } from '../packages/framework/src/l1/render'
import { validateSite } from '../packages/site-schema/src'
import type { L1Document, Site } from '../packages/site-schema/src'
import { renderSiteFiles } from '../tools/generate/src/render'
import { starterHomePage, starterSiteJson } from '../tools/generate/src/cli/scaffold'
import type { LoadedSite } from '../tools/generate/src/store/assemble'

/**
 * REQ-152 — money and time representation, and the render-determinism rule.
 *
 * These pin claims whose wrong answer is *unrecoverable* rather than expensive.
 * A published revision is an immutable R2 snapshot (DOC-12 §7), so a price
 * rendered with a hardcoded `/100`, a booking baked as a wall-clock string, or a
 * date derived from the render clock is not fixable by fixing the code — the
 * artifact already shipped.
 *
 * Everything below is asserted against ICU's real output for real locales rather
 * than against a snapshot of our own formatting, because the whole point of the
 * seam is that we do not author the symbol, the separator or the date order. The
 * DST case (AC-3) uses fixed explicit instants and never the ambient clock, so
 * it asserts the same thing in October as it does in July.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.join(HERE, '..')

/** ICU emits U+00A0 between a de-DE amount and its symbol; spell it out. */
const NBSP = ' '

describe('AC-1 — one amount, one currency, two locales', () => {
  it('test_UAT_FC_REQ_152_money_locale_places_symbol_and_separator', () => {
    // Same 4999 cents, same EUR. Locale decides placement and separator;
    // currency decides symbol and decimal count. Neither can answer for the
    // other, which is why REQ-151 kept them as two fields rather than one.
    expect(formatMoney(4999, 'EUR', 'en-IE')).toBe('€49.99')
    expect(formatMoney(4999, 'EUR', 'de-DE')).toBe(`49,99${NBSP}€`)
  })

  it('test_UAT_FC_REQ_152_money_currency_is_independent_of_locale', () => {
    // The same locale rendering two currencies proves the symbol comes from the
    // currency argument and not from a locale-keyed table of our own.
    expect(formatMoney(4999, 'USD', 'en-IE')).toBe('US$49.99')
    expect(formatMoney(4999, 'GBP', 'en-IE')).toBe('£49.99')
  })
})

describe('AC-2 — minor units are not always two', () => {
  it('test_UAT_FC_REQ_152_money_zero_and_three_minor_unit_currencies', () => {
    // JPY has no minor unit and KWD has three. A hardcoded `/100` renders these
    // as ¥49.99 and KD 4,999 — the first undercharges by a hundredfold and the
    // second overcharges by a thousand.
    expect(formatMoney(4999, 'JPY', 'ja-JP')).toBe('￥4,999')
    expect(formatMoney(4999, 'KWD', 'en-GB')).toContain('4.999')
    // ISK is the other zero-minor-unit case, in a locale that groups differently.
    expect(formatMoney(499900, 'ISK', 'is-IS')).toContain('499')
  })

  it('test_UAT_FC_REQ_152_money_is_exact_beyond_float_precision', () => {
    // `amountMinor / 100` is lossy: 9007199254740991/100 formats as …409.90,
    // dropping a cent. A price is a legal claim, so the seam does string
    // arithmetic and hands ICU an exact decimal.
    expect(formatMoney(9007199254740991, 'USD', 'en-US')).toBe('$90,071,992,547,409.91')
  })

  it('test_UAT_FC_REQ_152_money_rejects_a_non_integer_amount', () => {
    // A float price is a rounding bug waiting for a total; refuse it at the seam
    // rather than let it round somewhere downstream.
    expect(() => formatMoney(49.99, 'EUR', 'en-IE')).toThrow(/integer/)
  })

  it('test_UAT_FC_REQ_152_money_rejects_transposed_currency_and_locale', () => {
    // The two string arguments are easy to swap, and a swap would otherwise
    // render something plausible-looking. It fails loudly instead.
    expect(() => formatMoney(4999, 'en-IE', 'EUR')).toThrow(/ISO 4217/)
  })

  it('test_UAT_FC_REQ_152_money_handles_a_negative_amount', () => {
    // Refunds and credits are the same representation with a sign.
    expect(formatMoney(-4999, 'EUR', 'en-IE')).toBe('-€49.99')
  })
})

describe('AC-3 — an instant plus a zone, across a DST boundary', () => {
  it('test_UAT_FC_REQ_152_datetime_same_instant_differs_by_zone', () => {
    const instant = '2026-11-01T02:30:00Z'
    const dublin = formatDateTime(instant, 'Europe/Dublin', 'en-IE')
    const newYork = formatDateTime(instant, 'America/New_York', 'en-US')
    expect(dublin).not.toBe(newYork)
    // Not merely different: different *days*. 02:30 UTC on 1 November is still
    // 31 October in New York, which is the version of this bug that shows a
    // customer the wrong date rather than the wrong hour.
    expect(dublin).toContain('1 November 2026')
    expect(newYork).toContain('October 31, 2026')
  })

  it('test_UAT_FC_REQ_152_datetime_survives_diverging_dst_transitions', () => {
    // The EU leaves summer time on 25 October 2026; the US leaves it on 1
    // November. In the week between, the Dublin↔New York gap is FOUR hours, not
    // the usual five. A booking stored as a fixed `+01:00` offset — or one made
    // in October for a November slot — silently moves by an hour here.
    const hour = (instant: string, zone: string): string =>
      formatDateTime(instant, zone, 'en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })

    // Before either transition: five hours apart.
    expect(hour('2026-10-20T12:00:00Z', 'Europe/Dublin')).toBe('13:00')
    expect(hour('2026-10-20T12:00:00Z', 'America/New_York')).toBe('08:00')

    // Inside the divergence window: Dublin has fallen back, New York has not.
    expect(hour('2026-10-28T12:00:00Z', 'Europe/Dublin')).toBe('12:00')
    expect(hour('2026-10-28T12:00:00Z', 'America/New_York')).toBe('08:00')

    // After both: five hours apart again, at the new offsets.
    expect(hour('2026-11-05T12:00:00Z', 'Europe/Dublin')).toBe('12:00')
    expect(hour('2026-11-05T12:00:00Z', 'America/New_York')).toBe('07:00')
  })

  it('test_UAT_FC_REQ_152_datetime_surfaces_the_zone_abbreviation', () => {
    // DOC-34 §8.2 obliges the calendar module to show the zone wherever a
    // cross-zone booking is possible. A time with no zone shown is a time two
    // people read differently, so the seam has to be able to say which one.
    const withZone = formatDateTime('2026-10-28T12:00:00Z', 'Europe/Dublin', 'en-IE', {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    })
    expect(withZone).toContain('GMT')
  })

  it('test_UAT_FC_REQ_152_datetime_rejects_a_wall_clock_string', () => {
    // The unrecoverable case (DOC-34 §7): a zone-less string would otherwise be
    // reinterpreted as whichever zone the machine running the render happens to
    // be in — a property of the build host, baked into an immutable snapshot.
    expect(() => formatDateTime('2026-11-01T02:30', 'Europe/Dublin', 'en-IE')).toThrow(
      /explicit offset/,
    )
    expect(() => formatDateTime('2026-11-01', 'Europe/Dublin', 'en-IE')).toThrow(/explicit offset/)
  })

  it('test_UAT_FC_REQ_152_datetime_rejects_an_unknown_zone', () => {
    // `Europe/Dubland` is the silent-fallback shape REQ-151 already refused for
    // the site field; the formatter refuses it too rather than throwing an
    // opaque RangeError from deep inside ICU.
    expect(() => formatDateTime('2026-11-01T02:30:00Z', 'Europe/Dubland', 'en-IE')).toThrow(
      /time-zone/,
    )
  })
})

describe('AC-4 — the render stays byte-deterministic', () => {
  /** The scaffolder's starter site, validated. */
  function starter(): Site {
    const json = {
      ...(starterSiteJson('intl-fixture') as Record<string, unknown>),
      pages: [starterHomePage('intl-fixture')],
    }
    const result = validateSite(json)
    if (!result.ok) throw new Error(`unexpected validation failure: ${JSON.stringify(result.errors)}`)
    return result.value
  }

  it('test_UAT_FC_REQ_152_render_twice_is_byte_identical', async () => {
    // The claim is asserted on the ARTIFACT, twice, rather than on the absence
    // of a clock call — because the artifact is what ships and never re-renders.
    const site = starter()
    const loaded: LoadedSite = {
      slug: 'intl-fixture',
      sourceDir: '(memory)',
      site,
      assetFiles: [],
    }
    const first = await renderSiteFiles(loaded)
    const second = await renderSiteFiles(loaded)
    expect([...second.files.keys()].sort()).toEqual([...first.files.keys()].sort())
    for (const [name, html] of first.files) {
      expect(second.files.get(name), `${name} differs between two renders`).toBe(html)
    }

    // And the same for the framework's standalone page renderer.
    const doc = site.pages[0].l1 as L1Document
    expect(renderL1Page(doc, 'intl-fixture', site.config)).toBe(
      renderL1Page(doc, 'intl-fixture', site.config),
    )
  })

  it('test_UAT_FC_REQ_152_no_render_source_reads_the_ambient_clock', () => {
    // Determinism as MECHANISM rather than discipline: a future module that
    // reaches for `new Date()` fails here rather than shipping a snapshot that
    // is wrong the next morning. `intl.ts` is the sanctioned alternative and
    // takes its instant as an argument, so it needs no exemption.
    const offenders: string[] = []
    const walk = (dir: string): void => {
      for (const entry of readdirSync(dir)) {
        const full = path.join(dir, entry)
        if (statSync(full).isDirectory()) {
          walk(full)
          continue
        }
        if (!entry.endsWith('.ts')) continue
        const source = readFileSync(full, 'utf8')
        // Strip block and line comments: the rule is stated in prose in several
        // of these files, and prose is not a clock read.
        const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
        if (/\bnew Date\s*\(\s*\)|\bDate\.now\s*\(/.test(code)) {
          offenders.push(path.relative(REPO, full))
        }
      }
    }
    walk(path.join(REPO, 'packages', 'framework', 'src'))
    expect(offenders, 'render-path sources must not read the ambient clock').toEqual([])
  })
})

describe('AC-5 — the resolution is recorded where a reader will look', () => {
  it('test_UAT_FC_REQ_152_build_info_points_at_the_determinism_rule', () => {
    // The old comment said no module may call `new Date()` at render time, full
    // stop — which a calendar cannot satisfy, so the next person to author one
    // would have had to either break the rule or believe dates were forbidden.
    // It now points at the rule that resolves it.
    const buildInfo = readFileSync(
      path.join(REPO, 'packages', 'framework', 'src', 'buildInfo.ts'),
      'utf8',
    )
    expect(buildInfo).toContain('DOC-34 §8.4')
    expect(buildInfo).toContain('intl.ts')

    const intl = readFileSync(path.join(REPO, 'packages', 'framework', 'src', 'intl.ts'), 'utf8')
    expect(intl).toContain('byte-deterministic')
    expect(intl).toContain('DOC-34 §8.4')
  })
})
